#!/usr/bin/env node
/**
 * Pre-fetches Strava data, encrypts it with AES-256-GCM, and writes
 * public/strava-data.json as an encrypted envelope.
 *
 * Used by GitHub Actions before the static Next.js build.
 * Requires env vars: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN
 * Optional: PASSWORD_HASH (for encryption; falls back to hardcoded hash)
 */
import { writeFileSync, mkdirSync } from 'fs'
import { createCipheriv, randomBytes } from 'crypto'

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env
if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
  console.error('Missing STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / STRAVA_REFRESH_TOKEN')
  process.exit(1)
}

// ── Token refresh ────────────────────────────────────────────────────────────
const tokenRes = await fetch('https://www.strava.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    refresh_token: STRAVA_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
})
const tokenData = await tokenRes.json()
if (!tokenData.access_token) {
  console.error('Token refresh failed:', tokenData)
  process.exit(1)
}
const token = tokenData.access_token
console.log('✓ Strava token refreshed')

async function stravaGet(path) {
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Strava API ${path} → ${res.status}`)
  return res.json()
}

// ── Fetch data ───────────────────────────────────────────────────────────────
const [athlete, page1, page2] = await Promise.all([
  stravaGet('/athlete'),
  stravaGet('/athlete/activities?per_page=100&page=1'),
  stravaGet('/athlete/activities?per_page=100&page=2'),
])
const stats = await stravaGet(`/athletes/${athlete.id}/stats`)
const allActivities = [...page1, ...page2]
console.log(`✓ Loaded ${allActivities.length} activities`)

const SPORT_MAP = {
  Ride: 'Rennrad', GravelRide: 'Gravel', VirtualRide: 'Indoors',
  MountainBikeRide: 'MTB', EBikeRide: 'E-Bike', Run: 'Laufen', Walk: 'Wandern',
}
const RIDE_TYPES = ['Ride', 'GravelRide', 'VirtualRide', 'MountainBikeRide', 'EBikeRide']
const rides = allActivities.filter(a => RIDE_TYPES.includes(a.sport_type))
const toKmh = ms => ms * 3.6

// ── Heatmap ──────────────────────────────────────────────────────────────────
const today = new Date()
const heatmap = {}
for (let i = 364; i >= 0; i--) {
  const d = new Date(today); d.setDate(d.getDate() - i)
  heatmap[d.toISOString().slice(0, 10)] = 0
}
for (const act of allActivities) {
  const day = act.start_date_local.slice(0, 10)
  if (day in heatmap) heatmap[day] = (heatmap[day] || 0) + act.distance / 1000
}

// ── Weekly load (16 weeks) ───────────────────────────────────────────────────
const weeklyLoad = []
for (let w = 15; w >= 0; w--) {
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() - w * 7)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
  const wRides = rides.filter(a => { const d = new Date(a.start_date_local); return d >= weekStart && d < weekEnd })
  weeklyLoad.push({
    label: weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
    km: Math.round(wRides.reduce((s, a) => s + a.distance / 1000, 0)),
    rides: wRides.length,
    elevation: Math.round(wRides.reduce((s, a) => s + a.total_elevation_gain, 0)),
  })
}

// ── Sport breakdown ──────────────────────────────────────────────────────────
const sportBreakdown = {}
for (const act of allActivities) {
  const label = SPORT_MAP[act.sport_type] ?? act.sport_type
  if (!sportBreakdown[label]) sportBreakdown[label] = { count: 0, km: 0 }
  sportBreakdown[label].count++
  sportBreakdown[label].km += act.distance / 1000
}

// ── Speed buckets ────────────────────────────────────────────────────────────
const speedBuckets = [
  { label: '< 20', min: 0, max: 20, count: 0 },
  { label: '20–25', min: 20, max: 25, count: 0 },
  { label: '25–28', min: 25, max: 28, count: 0 },
  { label: '28–31', min: 28, max: 31, count: 0 },
  { label: '31–34', min: 31, max: 34, count: 0 },
  { label: '> 34', min: 34, max: 999, count: 0 },
]
for (const r of rides) {
  if (!r.average_speed) continue
  const kmh = toKmh(r.average_speed)
  const b = speedBuckets.find(b => kmh >= b.min && kmh < b.max)
  if (b) b.count++
}

// ── HR zones ─────────────────────────────────────────────────────────────────
const hrZones = [
  { label: 'Z1 Erholung', max: 120, count: 0, color: '#2ecc71' },
  { label: 'Z2 Grundlage', max: 140, count: 0, color: '#3498db' },
  { label: 'Z3 Aerob', max: 155, count: 0, color: '#f39c12' },
  { label: 'Z4 Schwelle', max: 168, count: 0, color: '#e67e22' },
  { label: 'Z5 VO2max', max: 999, count: 0, color: '#e74c3c' },
]
for (const r of rides) {
  if (!r.average_heartrate) continue
  for (const z of hrZones) { if (r.average_heartrate < z.max) { z.count++; break } }
}

// ── Streak ───────────────────────────────────────────────────────────────────
const activeDays = new Set(allActivities.map(a => a.start_date_local.slice(0, 10)))
let currentStreak = 0, longestStreak = 0, streak = 0
const checkDate = new Date(today)
if (!activeDays.has(checkDate.toISOString().slice(0, 10))) checkDate.setDate(checkDate.getDate() - 1)
for (let i = 0; i < 365; i++) {
  const d = checkDate.toISOString().slice(0, 10)
  if (activeDays.has(d)) {
    streak++
    if (i === 0) currentStreak = streak
    longestStreak = Math.max(longestStreak, streak)
  } else {
    if (i === 0) currentStreak = 0
    streak = 0
  }
  checkDate.setDate(checkDate.getDate() - 1)
}

// ── Records ──────────────────────────────────────────────────────────────────
const rwd = rides.filter(r => r.distance > 0)
const maxBy = (arr, fn) => arr.reduce((best, r) => fn(r) > fn(best ?? {}) ? r : best, null)
const longestRide = maxBy(rwd, r => r.distance)
const mostElevation = maxBy(rwd, r => r.total_elevation_gain)
const fastestRide = maxBy(rwd.filter(r => r.distance > 30000), r => r.average_speed)
const mostSuffering = maxBy(rides.filter(r => r.suffer_score), r => r.suffer_score ?? 0)

// ── Monthly km 2026 ──────────────────────────────────────────────────────────
const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const monthlyKm = months.map((month, m) => {
  const mRides = rides.filter(r => { const d = new Date(r.start_date_local); return d.getFullYear() === 2026 && d.getMonth() === m })
  return { month, km: Math.round(mRides.reduce((s, r) => s + r.distance / 1000, 0)), rides: mRides.length }
})

// ── Assemble output ──────────────────────────────────────────────────────────
const everests = (stats.all_ride_totals.elevation_gain / 8849).toFixed(1)

const output = {
  athlete: {
    id: athlete.id,
    name: `${athlete.firstname} ${athlete.lastname}`,
    username: athlete.username,
    city: athlete.city,
    country: athlete.country,
    weight: athlete.weight,
    premium: athlete.premium,
    memberSince: new Date(athlete.created_at).getFullYear(),
    followers: athlete.follower_count,
    following: athlete.friend_count,
    bikes: athlete.bikes.map(b => ({
      id: b.id, name: b.name, brand: b.brand_name,
      model: b.model_name, km: Math.round(b.distance / 1000), primary: b.primary,
    })),
  },
  stats: {
    ytd: {
      count: stats.ytd_ride_totals.count,
      km: Math.round(stats.ytd_ride_totals.distance / 1000),
      hours: Math.round(stats.ytd_ride_totals.moving_time / 3600 * 10) / 10,
      elevation: Math.round(stats.ytd_ride_totals.elevation_gain),
    },
    recent: {
      count: stats.recent_ride_totals.count,
      km: Math.round(stats.recent_ride_totals.distance / 1000),
      hours: Math.round(stats.recent_ride_totals.moving_time / 3600 * 10) / 10,
      elevation: Math.round(stats.recent_ride_totals.elevation_gain),
    },
    allTime: {
      count: stats.all_ride_totals.count,
      km: Math.round(stats.all_ride_totals.distance / 1000),
      hours: Math.round(stats.all_ride_totals.moving_time / 3600),
      elevation: Math.round(stats.all_ride_totals.elevation_gain),
      everests,
    },
    biggestRideKm: Math.round(stats.biggest_ride_distance / 1000),
    biggestClimbM: Math.round(stats.biggest_climb_elevation_gain),
  },
  heatmap, weeklyLoad, sportBreakdown: sportBreakdown, speedBuckets, hrZones,
  streak: { current: currentStreak, longest: longestStreak },
  records: {
    longestRide: longestRide ? { name: longestRide.name, km: Math.round(longestRide.distance / 1000), date: longestRide.start_date_local } : null,
    mostElevation: mostElevation ? { name: mostElevation.name, elevation: Math.round(mostElevation.total_elevation_gain), date: mostElevation.start_date_local } : null,
    fastestRide: fastestRide ? { name: fastestRide.name, kmh: Math.round(toKmh(fastestRide.average_speed) * 10) / 10, km: Math.round(fastestRide.distance / 1000), date: fastestRide.start_date_local } : null,
    mostSuffering: mostSuffering ? { name: mostSuffering.name, score: mostSuffering.suffer_score, date: mostSuffering.start_date_local } : null,
  },
  monthlyKm,
  recentActivities: allActivities.slice(0, 10).map(a => ({
    id: a.id, name: a.name, sport_type: a.sport_type, date: a.start_date_local,
    km: Math.round(a.distance / 1000 * 10) / 10,
    durationMin: Math.round(a.moving_time / 60),
    elevation: Math.round(a.total_elevation_gain),
    avgSpeedKmh: Math.round(toKmh(a.average_speed) * 10) / 10,
    avgHr: a.average_heartrate ? Math.round(a.average_heartrate) : null,
    watts: a.weighted_average_watts ?? a.average_watts ?? null,
    sufferScore: a.suffer_score ?? null,
    kudos: a.kudos_count, prCount: a.pr_count,
  })),
  fetchedAt: new Date().toISOString(),
  totalActivitiesLoaded: allActivities.length,
}

mkdirSync('public', { recursive: true })

// ── AES-256-GCM Encryption ──────────────────────────────────────────────────
const PASSWORD_HASH = process.env.PASSWORD_HASH
if (!PASSWORD_HASH) {
  console.error('Missing PASSWORD_HASH environment variable — cannot encrypt data')
  process.exit(1)
}

const key = Buffer.from(PASSWORD_HASH, 'hex') // 32 bytes = AES-256
const iv = randomBytes(12)                    // 96-bit nonce for GCM
const cipher = createCipheriv('aes-256-gcm', key, iv)

const plaintext = JSON.stringify(output, null, 2)
const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
const tag = cipher.getAuthTag() // 16 bytes

// Combine ciphertext + auth tag into one base64 blob
const payload = Buffer.concat([encrypted, tag]).toString('base64')

const envelope = {
  _encrypted: true,
  iv: iv.toString('hex'),
  data: payload,
}

writeFileSync('public/strava-data.json', JSON.stringify(envelope))
console.log(`✓ Wrote public/strava-data.json (encrypted, ${allActivities.length} activities, ${rides.length} rides)`)
