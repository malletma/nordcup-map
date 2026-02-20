import { NextResponse } from 'next/server'
import { fetchAthlete, fetchStats, fetchActivities } from '@/lib/strava-server'

export const dynamic = 'force-static'
export const revalidate = false

// Key sport types for mapping
const SPORT_MAP: Record<string, string> = {
  Ride: 'Rennrad',
  GravelRide: 'Gravel',
  VirtualRide: 'Indoors',
  MountainBikeRide: 'MTB',
  EBikeRide: 'E-Bike',
  Run: 'Laufen',
  Walk: 'Wandern',
}

function toKmh(ms: number) { return ms * 3.6 }

export async function GET() {
  try {
    // Parallel fetch: athlete + recent 200 activities
    const [athlete, page1, page2] = await Promise.all([
      fetchAthlete(),
      fetchActivities(100, 1),
      fetchActivities(100, 2),
    ])

    const stats = await fetchStats(athlete.id)
    const allActivities = [...page1, ...page2]

    // Filter to rides only (all cycling types)
    const rides = allActivities.filter((a) =>
      ['Ride', 'GravelRide', 'VirtualRide', 'MountainBikeRide', 'EBikeRide'].includes(a.sport_type)
    )

    // ── Activity Heatmap: last 365 days ──────────────────
    const heatmap: Record<string, number> = {}
    const today = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      heatmap[d.toISOString().slice(0, 10)] = 0
    }
    for (const act of allActivities) {
      const day = act.start_date_local.slice(0, 10)
      if (day in heatmap) heatmap[day] = (heatmap[day] || 0) + act.distance / 1000
    }

    // ── Weekly Load: last 16 weeks ───────────────────────
    const weeklyLoad: { label: string; km: number; rides: number; elevation: number }[] = []
    for (let w = 15; w >= 0; w--) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() - w * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const weekRides = rides.filter((a) => {
        const d = new Date(a.start_date_local)
        return d >= weekStart && d < weekEnd
      })

      const label = weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
      weeklyLoad.push({
        label,
        km: Math.round(weekRides.reduce((s, a) => s + a.distance / 1000, 0)),
        rides: weekRides.length,
        elevation: Math.round(weekRides.reduce((s, a) => s + a.total_elevation_gain, 0)),
      })
    }

    // ── Sport Type Breakdown ─────────────────────────────
    const sportCount: Record<string, { count: number; km: number }> = {}
    for (const act of allActivities) {
      const label = SPORT_MAP[act.sport_type] ?? act.sport_type
      if (!sportCount[label]) sportCount[label] = { count: 0, km: 0 }
      sportCount[label].count++
      sportCount[label].km += act.distance / 1000
    }

    // ── Speed Distribution (rides only) ──────────────────
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
      const bucket = speedBuckets.find((b) => kmh >= b.min && kmh < b.max)
      if (bucket) bucket.count++
    }

    // ── HR Zones ─────────────────────────────────────────
    const hrZones = [
      { label: 'Z1 Erholung', max: 120, count: 0, color: '#2ecc71' },
      { label: 'Z2 Grundlage', max: 140, count: 0, color: '#3498db' },
      { label: 'Z3 Aerob', max: 155, count: 0, color: '#f39c12' },
      { label: 'Z4 Schwelle', max: 168, count: 0, color: '#e67e22' },
      { label: 'Z5 VO2max', max: 999, count: 0, color: '#e74c3c' },
    ]
    for (const r of rides) {
      if (!r.average_heartrate) continue
      const hr = r.average_heartrate
      for (const z of hrZones) {
        if (hr < z.max) { z.count++; break }
      }
    }

    // ── Streak ───────────────────────────────────────────
    const activeDays = new Set(allActivities.map((a) => a.start_date_local.slice(0, 10)))
    let currentStreak = 0
    let longestStreak = 0
    let streak = 0
    const checkDate = new Date(today)
    // Check today or yesterday to start streak
    if (!activeDays.has(checkDate.toISOString().slice(0, 10))) {
      checkDate.setDate(checkDate.getDate() - 1)
    }
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

    // ── Records ──────────────────────────────────────────
    const ridesWithData = rides.filter((r) => r.distance > 0)
    const records = {
      longestRide: ridesWithData.reduce((best, r) => r.distance > (best?.distance ?? 0) ? r : best, ridesWithData[0]),
      mostElevation: ridesWithData.reduce((best, r) => r.total_elevation_gain > (best?.total_elevation_gain ?? 0) ? r : best, ridesWithData[0]),
      fastestRide: ridesWithData.filter((r) => r.distance > 30000).reduce((best, r) => r.average_speed > (best?.average_speed ?? 0) ? r : best, ridesWithData[0]),
      mostSuffering: rides.filter((r) => r.suffer_score).reduce((best, r) => (r.suffer_score ?? 0) > (best?.suffer_score ?? 0) ? r : best, rides[0]),
    }

    // ── Monthly 2026 ──────────────────────────────────────
    const monthlyKm: { month: string; km: number; rides: number }[] = []
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    for (let m = 0; m < 12; m++) {
      const monthRides = rides.filter((r) => {
        const d = new Date(r.start_date_local)
        return d.getFullYear() === 2026 && d.getMonth() === m
      })
      monthlyKm.push({
        month: months[m],
        km: Math.round(monthRides.reduce((s, r) => s + r.distance / 1000, 0)),
        rides: monthRides.length,
      })
    }

    // ── Elevation Milestones ─────────────────────────────
    const totalElevation = stats.all_ride_totals.elevation_gain
    const everestHeight = 8849
    const everests = (totalElevation / everestHeight).toFixed(1)

    // ── Recent 10 activities ─────────────────────────────
    const recentActivities = allActivities.slice(0, 10).map((a) => ({
      id: a.id,
      name: a.name,
      sport_type: a.sport_type,
      date: a.start_date_local,
      km: Math.round((a.distance / 1000) * 10) / 10,
      durationMin: Math.round(a.moving_time / 60),
      elevation: Math.round(a.total_elevation_gain),
      avgSpeedKmh: Math.round(toKmh(a.average_speed) * 10) / 10,
      avgHr: a.average_heartrate ? Math.round(a.average_heartrate) : null,
      watts: a.weighted_average_watts ?? a.average_watts ?? null,
      sufferScore: a.suffer_score ?? null,
      kudos: a.kudos_count,
      prCount: a.pr_count,
    }))

    return NextResponse.json({
      athlete: {
        id: athlete.id,
        name: `${athlete.firstname} ${athlete.lastname}`,
        username: athlete.username,
        city: athlete.city,
        country: athlete.country,
        sex: athlete.sex,
        weight: athlete.weight,
        premium: athlete.premium,
        memberSince: new Date(athlete.created_at).getFullYear(),
        followers: athlete.follower_count,
        following: athlete.friend_count,
        bikes: athlete.bikes.map((b) => ({
          id: b.id,
          name: b.name,
          brand: b.brand_name,
          model: b.model_name,
          km: Math.round(b.distance / 1000),
          primary: b.primary,
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
      heatmap,
      weeklyLoad,
      sportBreakdown: sportCount,
      speedBuckets,
      hrZones,
      streak: { current: currentStreak, longest: longestStreak },
      records: {
        longestRide: records.longestRide ? {
          name: records.longestRide.name,
          km: Math.round(records.longestRide.distance / 1000),
          date: records.longestRide.start_date_local,
        } : null,
        mostElevation: records.mostElevation ? {
          name: records.mostElevation.name,
          elevation: Math.round(records.mostElevation.total_elevation_gain),
          date: records.mostElevation.start_date_local,
        } : null,
        fastestRide: records.fastestRide ? {
          name: records.fastestRide.name,
          kmh: Math.round(toKmh(records.fastestRide.average_speed) * 10) / 10,
          km: Math.round(records.fastestRide.distance / 1000),
          date: records.fastestRide.start_date_local,
        } : null,
        mostSuffering: records.mostSuffering ? {
          name: records.mostSuffering.name,
          score: records.mostSuffering.suffer_score,
          date: records.mostSuffering.start_date_local,
        } : null,
      },
      monthlyKm,
      recentActivities,
      fetchedAt: new Date().toISOString(),
      totalActivitiesLoaded: allActivities.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[strava dashboard]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
