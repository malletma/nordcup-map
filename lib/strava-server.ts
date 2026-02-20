/**
 * lib/strava-server.ts
 * Server-only Strava API client with in-memory token caching + auto-refresh.
 * Import only in Next.js API routes (server components / route handlers).
 */

const BASE = 'https://www.strava.com/api/v3'

// Module-level token cache (survives across requests in the same process)
let cachedAccessToken = ''
let cachedExpiry = 0

async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedAccessToken && cachedExpiry > now + 300) return cachedAccessToken

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json()
  cachedAccessToken = data.access_token
  cachedExpiry = data.expires_at
  return cachedAccessToken
}

async function stravaGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const token = await getToken()
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 }, // Cache for 60s
  })
  if (!res.ok) throw new Error(`Strava API ${path} failed: ${res.status}`)
  return res.json()
}

// ── Public API ────────────────────────────────────────────

export interface StravaAthlete {
  id: number
  firstname: string
  lastname: string
  username: string
  city: string
  state: string
  country: string
  sex: string
  weight: number
  premium: boolean
  created_at: string
  profile_medium: string
  follower_count: number
  friend_count: number
  bikes: { id: string; name: string; brand_name: string; model_name: string; distance: number; primary: boolean }[]
}

export interface StravaTotals {
  count: number
  distance: number
  moving_time: number
  elapsed_time: number
  elevation_gain: number
  achievement_count?: number
}

export interface StravaStats {
  biggest_ride_distance: number
  biggest_climb_elevation_gain: number
  recent_ride_totals: StravaTotals
  ytd_ride_totals: StravaTotals
  all_ride_totals: StravaTotals
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
  weighted_average_watts?: number
  suffer_score?: number
  start_date: string
  start_date_local: string
  achievement_count: number
  kudos_count: number
  pr_count: number
  gear_id: string | null
}

export async function fetchAthlete() {
  return stravaGet<StravaAthlete>('/athlete')
}

export async function fetchStats(athleteId: number) {
  return stravaGet<StravaStats>(`/athletes/${athleteId}/stats`)
}

export async function fetchActivities(perPage = 100, page = 1) {
  return stravaGet<StravaActivity[]>('/athlete/activities', { per_page: perPage, page })
}
