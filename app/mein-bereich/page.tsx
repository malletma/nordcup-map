'use client'

import { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, logout } from '@/lib/auth'

/* ═══════════════════════════════════════════════════════════════════════
   i18n – Deutsch / English
   ═══════════════════════════════════════════════════════════════════════ */
const dict = {
  de: {
    map: 'Karte', logout: 'Logout', loading: 'STRAVA-DATEN LADEN…', retry: 'Erneut',
    since: 'seit', rides: 'Fahrten', followers: 'Follower',
    dashboard: 'Dashboard', training: 'Training', garage: 'Garage',
    ytdKm: 'YTD Kilometer', ytdH: 'YTD Stunden', ytdElev: 'YTD Höhenmeter', ytdRides: 'YTD Fahrten',
    recent4w: '4-Wochen km', totalKm: 'Gesamt km', longestRide: 'Längste Fahrt', everests: 'Everests ↑',
    daysInRow: 'Tage in Folge', bestStreak: 'Bestes Streak',
    recLongest: 'Längste Fahrt', recElev: 'Meiste Hm', recFast: 'Schnellste', recHard: 'Härteste',
    heatTitle: 'Heatmap — 365 Tage', heatSub: 'Hover über Kästchen für Details',
    activeDays: 'aktive Tage', in365: 'km in 365 Tagen', perActivity: 'km/Aktivität',
    less: 'Weniger', more: 'Mehr',
    wowTitle: 'Was du wirklich geleistet hast', wowTag: 'Wow-Faktor',
    earthTrips: 'Erdumrundungen', munichNYC: 'München → NYC', mtEverest: 'Mount Everest',
    daysInSaddle: 'Tage im Sattel', calories: 'Kalorien verbrannt', co2: 'CO₂ gespart',
    pizzas: 'Pizzen verdient', moonDist: 'Mondentfernung',
    lastRides: 'Letzte Fahrten', loaded: 'geladen', activities: 'Aktivitäten',
    weeklyTag: 'Training', weeklyTitle: 'Wöchentliche Belastung', bestWeek: 'Beste Woche',
    monthTag: '2026', monthTitle: 'Monatliche km', bestMonthLbl: 'Bester Monat',
    sportTag: 'Analyse', sportTitle: 'Sport-Verteilung',
    dayTag: 'Wochentag-Radar', dayTitle: 'Training nach Wochentag',
    speedTag: 'Speed', speedTitle: 'Geschwindigkeits-Verteilung',
    hrTag: 'Kondition', hrTitle: 'Herzfrequenz-Zonen', noHR: 'Keine HF-Daten',
    garageTag: 'Meine Garage', garageTitle: 'Cycling Garage',
    garageSub: '← → zum Navigieren · Klicken zum Editieren',
    bikeCount: 'Bikes', totalKmLabel: 'Gesamt km', configured: 'konfiguriert',
    mileage: 'Laufleistung', maintenance: 'Wartung!', soonDue: 'Bald fällig', topShape: 'Topzustand',
    primary: 'PRIMÄR', editBtn: 'Bearbeiten', fillBtn: 'Ausfüllen', techSpecs: 'Tech-Specs',
    noSpecs: 'Noch keine Specs', compareTag: 'Vergleich', compareTitle: 'Bikes nebeneinander',
    propLabel: 'Eigenschaft', kmLabel: 'Kilometer', groupsetL: 'Schaltgruppe', frameL: 'Rahmen',
    weightL: 'Gewicht', yearL: 'Kaufjahr', statusL: 'Status',
    configureBike: 'Bike konfigurieren', photo: 'Foto', nickname: 'Spitzname',
    frameMat: 'Rahmen', frameSize: 'Größe', groupset: 'Schaltgruppe',
    drivetrain: 'Antrieb', brakes: 'Bremsen', wheels: 'Laufräder', tires: 'Reifen',
    weightKg: 'Gewicht (kg)', purchaseYear: 'Kaufjahr', price: 'Preis (€)',
    useCase: 'Verwendung', notes: 'Notizen & Umbauten', save: 'Speichern', cancel: 'Abbrechen',
    uploadPhoto: 'Foto hochladen', clickPhoto: 'Klicken für Foto',
    of: 'von', reached: '% erreicht', times: '×', climbed: '× bestiegen', days: 'Tage',
    million: 'Mio. kcal', kgCO2: 'kg CO₂', pizzaUnit: 'Pizzen',
    roundTrip: '× Hin+Zurück',
    stand: 'Stand', vikingBike: 'Viking Bike',
    prev: '◀ Vorheriges', next: 'Nächstes ▶', selectBike: 'Bike auswählen',
    speedometer: 'Tacho', elevation: 'Höhe', power: 'Leistung',
    garageFloor: 'GARAGE FLOOR',
    bikeStatsTitle: 'Bike-Statistiken', distChart: 'Distanz pro Bike',
    saved: '✓ Gespeichert!', saveFail: '⚠ Speicher voll – Foto zu groß',
  },
  en: {
    map: 'Map', logout: 'Logout', loading: 'LOADING STRAVA DATA…', retry: 'Retry',
    since: 'since', rides: 'Rides', followers: 'Followers',
    dashboard: 'Dashboard', training: 'Training', garage: 'Garage',
    ytdKm: 'YTD Kilometers', ytdH: 'YTD Hours', ytdElev: 'YTD Elevation', ytdRides: 'YTD Rides',
    recent4w: '4-Week km', totalKm: 'Total km', longestRide: 'Longest Ride', everests: 'Everests ↑',
    daysInRow: 'Days in a Row', bestStreak: 'Best Streak',
    recLongest: 'Longest Ride', recElev: 'Most Elevation', recFast: 'Fastest', recHard: 'Hardest',
    heatTitle: 'Heatmap — 365 Days', heatSub: 'Hover cells for details',
    activeDays: 'active days', in365: 'km in 365 days', perActivity: 'km/activity',
    less: 'Less', more: 'More',
    wowTitle: 'What you really achieved', wowTag: 'Wow Factor',
    earthTrips: 'Earth Orbits', munichNYC: 'Munich → NYC', mtEverest: 'Mount Everest',
    daysInSaddle: 'Days in Saddle', calories: 'Calories Burned', co2: 'CO₂ Saved',
    pizzas: 'Pizzas Earned', moonDist: 'Moon Distance',
    lastRides: 'Recent Rides', loaded: 'loaded', activities: 'Activities',
    weeklyTag: 'Training', weeklyTitle: 'Weekly Load', bestWeek: 'Best Week',
    monthTag: '2026', monthTitle: 'Monthly km', bestMonthLbl: 'Best Month',
    sportTag: 'Analysis', sportTitle: 'Sport Distribution',
    dayTag: 'Weekday Radar', dayTitle: 'Training by Weekday',
    speedTag: 'Speed', speedTitle: 'Speed Distribution',
    hrTag: 'Fitness', hrTitle: 'Heart Rate Zones', noHR: 'No HR data',
    garageTag: 'My Garage', garageTitle: 'Cycling Garage',
    garageSub: '← → to navigate · Click to edit',
    bikeCount: 'Bikes', totalKmLabel: 'Total km', configured: 'configured',
    mileage: 'Mileage', maintenance: 'Maintenance!', soonDue: 'Check soon', topShape: 'Top shape',
    primary: 'PRIMARY', editBtn: 'Edit', fillBtn: 'Set up', techSpecs: 'Tech Specs',
    noSpecs: 'No specs yet', compareTag: 'Compare', compareTitle: 'Bikes side by side',
    propLabel: 'Property', kmLabel: 'Kilometers', groupsetL: 'Groupset', frameL: 'Frame',
    weightL: 'Weight', yearL: 'Year', statusL: 'Status',
    configureBike: 'Configure Bike', photo: 'Photo', nickname: 'Nickname',
    frameMat: 'Frame', frameSize: 'Size', groupset: 'Groupset',
    drivetrain: 'Drivetrain', brakes: 'Brakes', wheels: 'Wheels', tires: 'Tires',
    weightKg: 'Weight (kg)', purchaseYear: 'Year', price: 'Price (€)',
    useCase: 'Usage', notes: 'Notes & Mods', save: 'Save', cancel: 'Cancel',
    uploadPhoto: 'Upload photo', clickPhoto: 'Click for photo',
    of: 'of', reached: '% reached', times: '×', climbed: '× climbed', days: 'Days',
    million: 'M kcal', kgCO2: 'kg CO₂', pizzaUnit: 'Pizzas',
    roundTrip: '× round trip',
    stand: 'Updated', vikingBike: 'Viking Bike',
    prev: '◀ Previous', next: 'Next ▶', selectBike: 'Select Bike',
    speedometer: 'Speed', elevation: 'Elevation', power: 'Power',
    garageFloor: 'GARAGE FLOOR',
    bikeStatsTitle: 'Bike Statistics', distChart: 'Distance per Bike',
    saved: '✓ Saved!', saveFail: '⚠ Storage full – photo too large',
  },
} as const
type Lang = keyof typeof dict
type TKey = keyof typeof dict['de']

/* ═══════════════════════════════════════════════════════════════════════
   Themes – Dark & Light
   ═══════════════════════════════════════════════════════════════════════ */
interface Theme {
  bg: string; bg2: string; card: string; card2: string; border: string; white: string
  text: string; muted: string; accent: string; accent2: string; green: string; red: string
  orange: string; purple: string; yellow: string; teal: string; pink: string
  navBg: string; scrollTrack: string; scrollThumb: string; cardGlass: string; cardGlass2: string
}
const darkTheme: Theme = {
  bg: '#04080f', bg2: '#070e1a', card: '#0a1525', card2: '#0d1c30',
  border: 'rgba(99,179,255,0.08)', white: '#e8f4ff', text: '#b0cce8',
  muted: '#4a6080', accent: '#38bdf8', accent2: '#6366f1',
  green: '#34d399', red: '#f87171', orange: '#fb923c',
  purple: '#a78bfa', yellow: '#fbbf24', teal: '#2dd4bf', pink: '#f472b6',
  navBg: 'rgba(4,8,15,0.9)', scrollTrack: '#04080f', scrollThumb: '#1e3a5f',
  cardGlass: 'rgba(10,21,37,0.95)', cardGlass2: 'rgba(13,28,48,0.9)',
}
const lightTheme: Theme = {
  bg: '#f0f4f8', bg2: '#e8eef4', card: '#ffffff', card2: '#f5f8fc',
  border: 'rgba(30,60,100,0.1)', white: '#0f172a', text: '#334155',
  muted: '#64748b', accent: '#0284c7', accent2: '#4f46e5',
  green: '#059669', red: '#dc2626', orange: '#ea580c',
  purple: '#7c3aed', yellow: '#ca8a04', teal: '#0d9488', pink: '#db2777',
  navBg: 'rgba(240,244,248,0.95)', scrollTrack: '#e2e8f0', scrollThumb: '#94a3b8',
  cardGlass: 'rgba(255,255,255,0.95)', cardGlass2: 'rgba(245,248,252,0.9)',
}

const ThemeCtx = createContext<{ t: Theme; dark: boolean; toggle: () => void; lang: Lang; setLang: (l: Lang) => void; T: (k: TKey) => string }>({
  t: darkTheme, dark: true, toggle: () => {}, lang: 'de', setLang: () => {}, T: (k) => k,
})
const useT = () => useContext(ThemeCtx)

/* ─── Types ──────────────────────────────────────────────────────────── */
interface Bike { id: string; name: string; brand: string; model: string; km: number; primary: boolean }
interface DashboardData {
  athlete: { name: string; username: string; city: string; country: string; weight: number; premium: boolean; memberSince: number; followers: number; following: number; bikes: Bike[] }
  stats: { ytd: { count: number; km: number; hours: number; elevation: number }; recent: { count: number; km: number; hours: number; elevation: number }; allTime: { count: number; km: number; hours: number; elevation: number; everests: string }; biggestRideKm: number; biggestClimbM: number }
  heatmap: Record<string, number>
  weeklyLoad: { label: string; km: number; rides: number; elevation: number }[]
  sportBreakdown: Record<string, { count: number; km: number }>
  speedBuckets: { label: string; min: number; max: number; count: number }[]
  hrZones: { label: string; max: number; count: number; color: string }[]
  streak: { current: number; longest: number }
  records: { longestRide: { name: string; km: number; date: string } | null; mostElevation: { name: string; elevation: number; date: string } | null; fastestRide: { name: string; kmh: number; km: number; date: string } | null; mostSuffering: { name: string; score: number; date: string } | null }
  monthlyKm: { month: string; km: number; rides: number }[]
  recentActivities: { id: number; name: string; sport_type: string; date: string; km: number; durationMin: number; elevation: number; avgSpeedKmh: number; avgHr: number | null; watts: number | null; sufferScore: number | null; kudos: number; prCount: number }[]
  fetchedAt: string
  totalActivitiesLoaded: number
}

/* ─── localStorage with robust persistence ──────────────────────────── */
const LS_KEY = 'bike-extras-v2'
const LS_KEY_OLD = 'bike-extras'
interface BikeExtra { photo?: string; nickname?: string; frameMaterial?: string; frameSize?: string; groupset?: string; drivetrain?: string; brakes?: string; wheelset?: string; tireSize?: string; weightKg?: string; purchaseYear?: string; priceEur?: string; useCase?: string[]; notes?: string }

/* ─── Hardcoded bike defaults (always shown even on fresh load) ───────── */
const DEFAULT_EXTRAS: Record<string, BikeExtra> = {
  'b15747194': { // Factor Ostro VAM
    nickname: 'Ostro VAM', frameMaterial: 'Carbon', frameSize: '56',
    groupset: 'Shimano Ultegra Di2 12-fach', drivetrain: '2x', brakes: 'Disc Hyd.',
    wheelset: 'Aerycs Aero CS DT-Swiss 240', tireSize: 'Pirelli P-Zero 30mm',
    weightKg: '7.4', purchaseYear: '2024', priceEur: '10000',
    useCase: ['Road', 'Race'], notes: 'Powermeter',
  },
  'b17314789': { // Factor O2 VAM
    nickname: 'O2 VAM', frameMaterial: 'Carbon', frameSize: '56',
    groupset: 'SRAM Force E1 12-fach', drivetrain: '2x', brakes: 'Disc Hyd.',
    wheelset: 'Black Inc Thirty', tireSize: 'Pirelli P-Zero 30mm',
    weightKg: '7.1', purchaseYear: '2025', priceEur: '11000',
    useCase: ['Road', 'Race'], notes: 'Powermeter',
  },
  'b15747190': { // Colnago G4-X
    nickname: 'G4-X', frameMaterial: 'Carbon', frameSize: '56',
    groupset: 'Shimano GRX 825 12-fach', drivetrain: '2x', brakes: 'Disc Hyd.',
    wheelset: 'Campagnolo Shamal 40', tireSize: 'Pirelli P-Zero 45mm',
    weightKg: '7.8', purchaseYear: '2025', priceEur: '8000',
    useCase: ['Gravel'], notes: 'Powermeter',
  },
  'b17300742': { // FARA GR4
    nickname: 'GR-4', frameMaterial: 'Carbon', frameSize: '56',
    groupset: 'SRAM Force E1 XPLR 13-fach', drivetrain: '1x', brakes: 'Disc Hyd.',
    wheelset: 'Zipp 303 XPLR', tireSize: 'Schwalbe Thunder Burt 57mm',
    weightKg: '7.8', purchaseYear: '2026', priceEur: '8900',
    useCase: ['Gravel'], notes: 'Powermeter',
  },
}

function loadExtras(): Record<string, BikeExtra> {
  try {
    let stored: Record<string, BikeExtra> = {}
    const v2 = localStorage.getItem(LS_KEY)
    if (v2) { stored = JSON.parse(v2) }
    else {
      // migrate from old key
      const v1 = localStorage.getItem(LS_KEY_OLD)
      if (v1) { stored = JSON.parse(v1); localStorage.setItem(LS_KEY, v1) }
    }
    // Merge: defaults as base, stored values override per-field
    const merged: Record<string, BikeExtra> = {}
    for (const [id, def] of Object.entries(DEFAULT_EXTRAS)) {
      const fromStorage = stored[id] ?? {}
      merged[id] = { ...def, ...Object.fromEntries(Object.entries(fromStorage).filter(([, v]) => v !== undefined)) }
    }
    // Include any stored bikes not in defaults (e.g. trainer bike)
    for (const [id, extra] of Object.entries(stored)) {
      if (!merged[id]) merged[id] = extra
    }
    return merged
  } catch { return { ...DEFAULT_EXTRAS } }
}

function saveExtras(d: Record<string, BikeExtra>): boolean {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)); return true }
  catch {
    // Storage full – try saving without photos
    try {
      const stripped: Record<string, BikeExtra> = {}
      for (const [k, v] of Object.entries(d)) { stripped[k] = { ...v, photo: undefined } }
      localStorage.setItem(LS_KEY, JSON.stringify(stripped))
      return false // partial save
    } catch { return false }
  }
}

// Compress photo to max 200KB before storing
function compressPhoto(dataUrl: string, maxW = 800): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxW / img.width, maxW / img.height, 1)
      canvas.width = img.width * ratio; canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/* ─── Hooks ──────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, delay = 0): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf: number, start: number | null = null
    const t = setTimeout(() => { raf = requestAnimationFrame(function step(ts) { if (!start) start = ts; const p = Math.min((ts - start) / duration, 1); setVal(Math.round((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) raf = requestAnimationFrame(step) }) }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [target, duration, delay])
  return val
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const SPORT_COLORS: Record<string, string> = { Ride: '#38bdf8', GravelRide: '#a78bfa', VirtualRide: '#fbbf24', MountainBikeRide: '#34d399', EBikeRide: '#2dd4bf' }
const SPORT_ICON: Record<string, string> = { Ride: '🚴', GravelRide: '🪨', VirtualRide: '⚡', MountainBikeRide: '🏔️', EBikeRide: '🔋', Run: '🏃', Walk: '🚶' }
const BIKE_COLORS = ['#38bdf8', '#a78bfa', '#fbbf24', '#34d399', '#2dd4bf', '#f472b6']
function fmt(n: number, dec = 0) { return n.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) }
function durStr(min: number) { const h = Math.floor(min / 60), m = min % 60; return h > 0 ? `${h}h${m > 0 ? ' ' + m + 'min' : ''}` : `${m}min` }
function dateDE(iso: string) { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) }

/* ─── Global CSS ─────────────────────────────────────────────────────── */
function buildCSS(t: Theme) { return `
@keyframes float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-60px) scale(1.1)}66%{transform:translate(-30px,40px) scale(.95)}}
@keyframes float2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,30px) scale(1.05)}66%{transform:translate(60px,-40px) scale(1.1)}}
@keyframes float3{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-50px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinReverse{to{transform:rotate(-360deg)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 6px ${t.accent},0 0 12px ${t.accent}80}50%{box-shadow:0 0 14px ${t.accent},0 0 28px ${t.accent},0 0 40px ${t.accent}40}}
@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fireflicker{0%,100%{transform:scaleY(1) scaleX(1)}25%{transform:scaleY(1.1) scaleX(.95)}75%{transform:scaleY(.95) scaleX(1.05)}}
@keyframes spotlight{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes garageSlide{from{opacity:0;transform:scale(.9) translateX(40px)}to{opacity:1;transform:scale(1) translateX(0)}}
@keyframes neonPulse{0%,100%{opacity:.3}50%{opacity:.8}}
@keyframes revealBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes savedToast{0%{opacity:0;transform:translateY(10px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-10px)}}
* { box-sizing:border-box; }
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${t.scrollTrack}}::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:3px}
.garage-scroll::-webkit-scrollbar{height:4px}.garage-scroll::-webkit-scrollbar-thumb{background:${t.accent}40;border-radius:2px}
` }

/* ─── Components ─────────────────────────────────────────────────────── */
function GlowDot({ color }: { color?: string }) {
  const { t } = useT()
  const col = color ?? t.green
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col},0 0 12px ${col}80`, animation: 'pulse 2s ease infinite' }} />
}

function SectionLabel({ tag, title, sub }: { tag: string; title: string; sub?: string }) {
  const { t } = useT()
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: t.accent, marginBottom: 6 }}>{tag}</div>
      <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem,2.5vw,1.7rem)', fontWeight: 900, color: t.white, lineHeight: 1.2 }}>{title}</h2>
      {sub && <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function AnimNum({ value, unit, dec = 0, color, size = '2.4rem', delay = 0 }: { value: number; unit?: string; dec?: number; color?: string; size?: string; delay?: number }) {
  const { t } = useT()
  const col = color ?? t.accent
  const v = useCountUp(value, 1600, delay)
  return (
    <span style={{ fontSize: size, fontWeight: 900, color: t.white, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
      {dec > 0 ? (v / Math.pow(10, dec)).toFixed(dec) : fmt(v)}
      {unit && <span style={{ fontSize: '0.4em', color: col, marginLeft: 3, fontWeight: 700 }}>{unit}</span>}
    </span>
  )
}

function GlassCard({ children, style, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
  const { t } = useT()
  return (
    <div style={{
      background: `linear-gradient(135deg,${t.cardGlass},${t.cardGlass2})`,
      border: `1px solid ${glow ? glow + '40' : t.border}`,
      borderRadius: 18, backdropFilter: 'blur(20px)',
      boxShadow: glow ? `0 0 0 1px ${glow}20,0 8px 32px rgba(0,0,0,.25),inset 0 1px 0 ${glow}20` : '0 8px 32px rgba(0,0,0,.15)',
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      {glow && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top left,${glow}08,transparent 60%)`, pointerEvents: 'none' }} />}
      {children}
    </div>
  )
}

function AnimBar({ pct, color, height = 8, delay = 0 }: { pct: number; color: string; height?: number; delay?: number }) {
  const [go, setGo] = useState(false)
  useEffect(() => { const tm = setTimeout(() => setGo(true), delay); return () => clearTimeout(tm) }, [delay])
  return (
    <div style={{ background: 'rgba(128,128,128,0.12)', borderRadius: 999, height, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: go ? `${pct}%` : '0%', borderRadius: 999, background: `linear-gradient(90deg,${color},${color}cc)`, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)', boxShadow: `0 0 8px ${color}60` }} />
    </div>
  )
}

/* ─── Heatmap ──────────────────────────────────────────────────────── */
function HeatmapGrid({ heatmap }: { heatmap: Record<string, number> }) {
  const { t, T, dark } = useT()
  const maxKm = Math.max(...Object.values(heatmap), 1)
  const today = new Date()
  const startDay = new Date(today); startDay.setDate(today.getDate() - 364)
  while (startDay.getDay() !== 1) startDay.setDate(startDay.getDate() - 1)
  const weeks: { date: string; km: number }[][] = []; let week: { date: string; km: number }[] = []
  const cur = new Date(startDay)
  while (cur <= today) { const key = cur.toISOString().slice(0, 10); week.push({ date: key, km: heatmap[key] ?? -1 }); if (week.length === 7) { weeks.push(week); week = [] }; cur.setDate(cur.getDate() + 1) }
  if (week.length) weeks.push(week)

  function cellColor(km: number): string {
    if (km < 0) return dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'
    if (km === 0) return dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
    const i = km / maxKm
    if (i < 0.2) return t.accent + '33'; if (i < 0.4) return t.accent + '66'
    if (i < 0.6) return t.accent + 'aa'; if (i < 0.8) return t.accent + 'dd'
    return t.accent
  }

  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((w, i) => { const d = new Date(w[0].date); if (d.getDate() <= 7) monthLabels.push({ label: d.toLocaleDateString('de-DE', { month: 'short' }), col: i }) })
  const DAYS = ['Mo', '', 'Mi', '', 'Fr', '', 'So']
  const total365 = Object.values(heatmap).filter(v => v > 0).length
  const total365km = Math.round(Object.values(heatmap).reduce((s, v) => s + Math.max(v, 0), 0))

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        {[{ s: `📅 ${total365} ${T('activeDays')}`, col: t.accent }, { s: `🚴 ${fmt(total365km)} ${T('in365')}`, col: t.green }, { s: `🔥 Ø ${Math.round(total365km / Math.max(total365, 1))} ${T('perActivity')}`, col: t.yellow }].map(p => (
          <div key={p.s} style={{ background: p.col + '15', border: `1px solid ${p.col}30`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: p.col }}>{p.s}</div>
        ))}
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 2, marginBottom: 4, paddingLeft: 22 }}>
          {weeks.map((_, i) => { const ml = monthLabels.find(m => m.col === i); return <div key={i} style={{ width: 11, fontSize: 8, color: t.muted, flexShrink: 0, textAlign: 'center' }}>{ml?.label ?? ''}</div> })}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>{DAYS.map((l, i) => <div key={i} style={{ height: 11, fontSize: 8, color: t.muted, lineHeight: '11px', width: 16 }}>{l}</div>)}</div>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {wk.map((day, di) => (
                <div key={di} title={day.km >= 0 ? `${day.date}: ${Math.round(day.km)} km` : day.date}
                  style={{ width: 11, height: 11, borderRadius: 2, background: cellColor(day.km), cursor: day.km > 0 ? 'pointer' : 'default', transition: 'transform .1s', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.5)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, paddingLeft: 22 }}>
          <span style={{ fontSize: 9, color: t.muted }}>{T('less')}</span>
          {[0, 0.2, 0.5, 0.8, 1].map(v => <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: cellColor(v * maxKm || (v > 0 ? 0.01 : 0)) }} />)}
          <span style={{ fontSize: 9, color: t.muted }}>{T('more')}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Day radar ──────────────────────────────────────────────────────── */
function DayRadar({ heatmap }: { heatmap: Record<string, number> }) {
  const { t, dark } = useT()
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const stats = Array(7).fill(0).map(() => ({ count: 0, km: 0 }))
  Object.entries(heatmap).forEach(([date, km]) => { if (km > 0) { let d = new Date(date).getDay(); d = d === 0 ? 6 : d - 1; stats[d].count++; stats[d].km += km } })
  const maxKm = Math.max(...stats.map(s => s.km), 1)
  const cx = 80, cy = 80, r = 60
  const pts = stats.map((s, i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; const pct = s.km / maxKm; return { x: cx + r * pct * Math.cos(a), y: cy + r * pct * Math.sin(a), lx: cx + (r + 16) * Math.cos(a), ly: cy + (r + 16) * Math.sin(a) } })
  const gridPts = (f: number) => stats.map((_, i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; return `${cx + r * f * Math.cos(a)},${cy + r * f * Math.sin(a)}` }).join(' ')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {[.25, .5, .75, 1].map(f => <polygon key={f} points={gridPts(f)} fill="none" stroke={t.accent + Math.round(f * 30).toString(16).padStart(2, '0')} strokeWidth={1} />)}
        {stats.map((_, i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={t.accent + '14'} strokeWidth={1} /> })}
        <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill={t.accent + '30'} stroke={t.accent} strokeWidth={2} strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={t.accent} />)}
        {pts.map((p, i) => <text key={`l${i}`} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fill={t.muted} fontSize={9} fontWeight={600}>{days[i]}</text>)}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%' }}>
        {stats.map((s, i) => { const best = s.km === Math.max(...stats.map(x => x.km)); return (
          <div key={i} style={{ background: best ? t.accent + '15' : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'), borderRadius: 8, padding: '5px 8px', textAlign: 'center', border: `1px solid ${best ? t.accent + '40' : t.border}` }}>
            <div style={{ fontSize: 9, color: t.muted }}>{days[i]}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: t.white }}>{Math.round(s.km)} km</div>
            <div style={{ fontSize: 9, color: t.muted }}>{s.count}×</div>
          </div>
        )})}
      </div>
    </div>
  )
}

/* ─── Goal ring ──────────────────────────────────────────────────────── */
function GoalRing({ pct, km, goal }: { pct: number; km: number; goal: number }) {
  const { t, T, dark } = useT()
  const [p, setP] = useState(0)
  useEffect(() => { const tm = setTimeout(() => setP(pct), 300); return () => clearTimeout(tm) }, [pct])
  const r = 70, circ = 2 * Math.PI * r, dash = (p / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={90} cy={90} r={r} fill="none" stroke={t.accent + '12'} strokeWidth={14} />
          <circle cx={90} cy={90} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={14} strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={circ - dash} style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)' }} />
          {Array.from({ length: 10 }).map((_, i) => { const a = (i / 10) * Math.PI * 2; return <line key={i} x1={90 + (r - 8) * Math.cos(a)} y1={90 + (r - 8) * Math.sin(a)} x2={90 + (r + 2) * Math.cos(a)} y2={90 + (r + 2) * Math.sin(a)} stroke={t.muted + '30'} strokeWidth={1.5} /> })}
          <defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={t.accent} /><stop offset="100%" stopColor={t.accent2} /></linearGradient></defs>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: t.white, lineHeight: 1 }}>{Math.round(p)}%</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 3 }}>{T('of')} {fmt(goal)} km</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.accent, marginTop: 4 }}>{fmt(km)} km</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[25, 50, 75, 100].map(m => (
          <div key={m} style={{ width: 36, height: 36, borderRadius: '50%', background: pct >= m ? `radial-gradient(circle,${t.accent}40,${t.accent}10)` : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), border: `1px solid ${pct >= m ? t.accent + '80' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: pct >= m ? t.accent : t.muted }}>{m}%</div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   FORZA-STYLE GARAGE CAROUSEL
   ═══════════════════════════════════════════════════════════════════════ */
function GarageCarousel({ bikes, bikeExtras, onEdit }: { bikes: Bike[]; bikeExtras: Record<string, BikeExtra>; onEdit: (id: string) => void }) {
  const { t, T, dark } = useT()
  const [selected, setSelected] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current; if (!el) return
    const target = el.children[selected] as HTMLElement
    if (target) target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selected])

  const bike = bikes[selected]; if (!bike) return null
  const extra = bikeExtras[bike.id] ?? {}
  const color = BIKE_COLORS[selected % BIKE_COLORS.length]
  const displayName = extra.nickname || bike.name || `${bike.brand} ${bike.model}`
  const health = bike.km > 15000 ? { icon: '⚠️', text: T('maintenance'), col: t.red } : bike.km > 8000 ? { icon: '🔄', text: T('soonDue'), col: t.orange } : { icon: '✅', text: T('topShape'), col: t.green }
  const specs = [
    extra.groupset && { icon: '⚙️', v: extra.groupset },
    extra.frameMaterial && { icon: '🏗', v: extra.frameMaterial + (extra.frameSize ? ' ' + extra.frameSize : '') },
    extra.wheelset && { icon: '🔵', v: extra.wheelset },
    extra.weightKg && { icon: '⚖️', v: extra.weightKg + ' kg' },
    extra.brakes && { icon: '🛑', v: extra.brakes },
    extra.tireSize && { icon: '🔲', v: extra.tireSize },
    extra.purchaseYear && { icon: '📅', v: extra.purchaseYear },
    extra.priceEur && { icon: '💶', v: extra.priceEur + ' €' },
  ].filter(Boolean) as { icon: string; v: string }[]
  const totalBikeKm = bikes.reduce((s, b) => s + b.km, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Garage environment */}
      <div style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        background: dark
          ? `linear-gradient(180deg,#080e18 0%,#0c1628 40%,#101e36 70%,#0a1424 100%)`
          : `linear-gradient(180deg,#dde6f0 0%,#c8d6e8 40%,#b0c4dc 70%,#e0e8f2 100%)`,
        minHeight: 520, border: `1px solid ${color}30`,
      }}>
        {/* Neon ceiling lights */}
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 2, background: `linear-gradient(90deg,transparent,${color}80,transparent)`, animation: 'neonPulse 3s ease infinite' }} />
        <div style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: 1, background: `linear-gradient(90deg,transparent,${t.accent2}60,transparent)`, animation: 'neonPulse 3s ease infinite 1.5s' }} />

        {/* Spotlight cone */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 400, height: '100%', background: `radial-gradient(ellipse at top center, ${color}15, transparent 70%)`, animation: 'spotlight 4s ease infinite', pointerEvents: 'none' }} />

        {/* Garage floor grid */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: dark ? 'linear-gradient(180deg,transparent,rgba(0,0,0,0.4))' : 'linear-gradient(180deg,transparent,rgba(0,0,0,0.1))', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 10, letterSpacing: '6px', color: t.muted + '40', fontWeight: 900 }}>{T('garageFloor')}</div>
        </div>

        {/* Header bar */}
        <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color, marginBottom: 4 }}>{T('garageTag')}</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 900, color: t.white }}>{T('garageTitle')}</h2>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{T('garageSub')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[{ icon: '🚲', v: `${bikes.length} ${T('bikeCount')}` }, { icon: '📏', v: `${fmt(totalBikeKm)} km` }].map(s => (
              <div key={s.v} style={{ background: t.card + '80', border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 14px', fontSize: 12, color: t.text, display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(10px)' }}>{s.icon} {s.v}</div>
            ))}
          </div>
        </div>

        {/* Bike selector strip (Forza style) */}
        <div style={{ padding: '20px 28px 0', position: 'relative', zIndex: 2 }}>
          <div ref={scrollRef} className="garage-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, scrollSnapType: 'x mandatory' }}>
            {bikes.map((b, i) => {
              const bColor = BIKE_COLORS[i % BIKE_COLORS.length]
              const bExtra = bikeExtras[b.id] ?? {}
              const active = i === selected
              return (
                <button key={b.id} onClick={() => setSelected(i)} style={{
                  flex: '0 0 auto', width: active ? 110 : 90, height: active ? 88 : 72,
                  borderRadius: 14, border: `2px solid ${active ? bColor : t.border}`,
                  background: active ? `linear-gradient(135deg,${bColor}25,${bColor}08)` : t.card + '80',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  transition: 'all .3s cubic-bezier(.4,0,.2,1)', transform: active ? 'scale(1)' : 'scale(0.92)',
                  boxShadow: active ? `0 0 20px ${bColor}30, 0 4px 16px rgba(0,0,0,.3)` : 'none',
                  scrollSnapAlign: 'center', overflow: 'hidden', fontFamily: 'inherit', position: 'relative',
                }}>
                  {active && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at center,${bColor}15,transparent 70%)` }} />}
                  {bExtra.photo
                    ? <img src={bExtra.photo} alt="" style={{ width: '100%', height: '60%', objectFit: 'cover', borderRadius: 10, position: 'relative' }} />
                    : <div style={{ fontSize: active ? 28 : 22, lineHeight: 1 }}>🚴</div>}
                  <div style={{ fontSize: active ? 10 : 9, fontWeight: 800, color: active ? bColor : t.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%', position: 'relative' }}>
                    {bExtra.nickname || b.name || b.brand}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected bike showcase */}
        <div style={{ padding: '16px 28px 28px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, position: 'relative', zIndex: 2, minHeight: 280 }}>
          {/* Left: Big photo / placeholder */}
          <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'garageSlide .4s ease' }} onClick={() => onEdit(bike.id)}>
            {extra.photo
              ? <img src={extra.photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 240 }} />
              : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
                <div style={{ fontSize: 72, filter: dark ? 'drop-shadow(0 0 30px rgba(56,189,248,0.3))' : 'none' }}>🚴</div>
                <div style={{ fontSize: 13, color: t.muted, fontWeight: 600 }}>{T('clickPhoto')}</div>
              </div>}
            {/* Gradient overlay at bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(transparent,${dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)'})` }} />
            {/* Name plate */}
            <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.5)' }}>{displayName}</div>
                {bike.primary && <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: color + '40', color: '#fff', border: `1px solid ${color}60` }}>{T('primary')}</span>}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{bike.brand} {bike.model}</div>
            </div>
          </div>

          {/* Right: Stats panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'garageSlide .4s ease .1s both' }}>
            {/* KM + health */}
            <div style={{ background: dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)', borderRadius: 16, padding: 20, border: `1px solid ${color}25`, backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: t.muted, fontWeight: 700 }}>{T('mileage')}</span>
                <span style={{ fontSize: 11, color: health.col, fontWeight: 800 }}>{health.icon} {health.text}</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: t.white, marginBottom: 8 }}>{fmt(bike.km)} <span style={{ fontSize: 14, color }}>km</span></div>
              <AnimBar pct={Math.min((bike.km / 20000) * 100, 100)} color={health.col} height={8} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 9, color: t.muted }}>0 km</span>
                <span style={{ fontSize: 9, color: t.muted }}>20.000 km</span>
              </div>
            </div>

            {/* Km share donut */}
            <div style={{ background: dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)', borderRadius: 16, padding: 16, border: `1px solid ${t.border}`, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <svg width={60} height={60} viewBox="0 0 60 60">
                {bikes.map((b, i) => {
                  const pctBefore = bikes.slice(0, i).reduce((s, x) => s + x.km, 0) / Math.max(totalBikeKm, 1) * 100
                  const pctThis = (b.km / Math.max(totalBikeKm, 1)) * 100
                  const circ = 2 * Math.PI * 24
                  return <circle key={b.id} cx={30} cy={30} r={24} fill="none" stroke={BIKE_COLORS[i % BIKE_COLORS.length] + (b.id === bike.id ? '' : '60')} strokeWidth={b.id === bike.id ? 8 : 5} strokeDasharray={`${(pctThis / 100) * circ} ${circ}`} strokeDashoffset={-(pctBefore / 100) * circ} style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
                })}
              </svg>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color }}>{Math.round((bike.km / Math.max(totalBikeKm, 1)) * 100)}%</div>
                <div style={{ fontSize: 10, color: t.muted }}>{T('distChart')}</div>
              </div>
            </div>

            {/* Specs mini-list */}
            <div style={{ background: dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)', borderRadius: 16, padding: 16, border: `1px solid ${t.border}`, backdropFilter: 'blur(10px)', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: t.white, marginBottom: 10 }}>🔧 {T('techSpecs')}</div>
              {specs.length > 0
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {specs.slice(0, 5).map(s => (
                    <div key={s.icon} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.text }}>
                      <span style={{ fontSize: 13 }}>{s.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.v}</span>
                    </div>
                  ))}
                  {specs.length > 5 && <div style={{ fontSize: 10, color: t.muted }}>+{specs.length - 5} more…</div>}
                </div>
                : <div style={{ color: t.muted, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>📋 {T('noSpecs')}</div>}
            </div>

            {/* Edit button */}
            <button onClick={() => onEdit(bike.id)} style={{
              padding: 14, background: `linear-gradient(90deg,${color},${t.accent2})`, color: '#fff',
              border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: 14, fontWeight: 800,
              fontFamily: 'inherit', boxShadow: `0 4px 20px ${color}40`, transition: 'transform .15s',
            }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              ✏️ {specs.length > 0 ? T('editBtn') : T('fillBtn')}
            </button>
          </div>
        </div>

        {/* Nav arrows */}
        <div style={{ position: 'absolute', top: '55%', left: 12, zIndex: 5 }}>
          <button onClick={() => setSelected(s => Math.max(0, s - 1))} disabled={selected === 0} style={{ width: 44, height: 44, borderRadius: '50%', background: dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', border: `1px solid ${t.border}`, color: selected === 0 ? t.muted + '40' : t.white, fontSize: 18, cursor: selected === 0 ? 'default' : 'pointer', backdropFilter: 'blur(8px)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</button>
        </div>
        <div style={{ position: 'absolute', top: '55%', right: 12, zIndex: 5 }}>
          <button onClick={() => setSelected(s => Math.min(bikes.length - 1, s + 1))} disabled={selected === bikes.length - 1} style={{ width: 44, height: 44, borderRadius: '50%', background: dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', border: `1px solid ${t.border}`, color: selected === bikes.length - 1 ? t.muted + '40' : t.white, fontSize: 18, cursor: selected === bikes.length - 1 ? 'default' : 'pointer', backdropFilter: 'blur(8px)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
        </div>

        {/* Bike counter */}
        <div style={{ position: 'absolute', bottom: 16, right: 28, zIndex: 5, fontSize: 12, color: t.muted, fontWeight: 700 }}>
          {selected + 1} / {bikes.length}
        </div>
      </div>

      {/* Use case tags */}
      {(extra.useCase ?? []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {(extra.useCase ?? []).map(u => <span key={u} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: t.green + '15', color: t.green, border: `1px solid ${t.green}30` }}>{u}</span>)}
        </div>
      )}
    </div>
  )
}

/* ─── Bike Modal (with save feedback) ─────────────────────────────── */
function BikeModal({ bikeId, bikeName, bikeKm, bColor, init, onSave, onClose }: { bikeId: string; bikeName: string; bikeKm: number; bColor: string; init: BikeExtra; onSave: (d: BikeExtra) => void; onClose: () => void }) {
  const { t, T } = useT()
  const [draft, setDraft] = useState<BikeExtra>(init)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof BikeExtra>(k: K, v: BikeExtra[K]) => setDraft(d => ({ ...d, [k]: v }))
  const toggleUse = (u: string) => { const cur = draft.useCase ?? []; set('useCase', cur.includes(u) ? cur.filter(x => x !== u) : [...cur, u]) }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string
      const compressed = await compressPhoto(raw, 800) // compress to max 800px
      set('photo', compressed)
    }
    reader.readAsDataURL(f)
  }

  const I = (s?: React.CSSProperties): React.CSSProperties => ({ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, color: t.white, padding: '9px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit', ...s })
  const L = (): React.CSSProperties => ({ fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.muted, display: 'block', marginBottom: 6 })
  const CH = (on: boolean, col = bColor): React.CSSProperties => ({ padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${on ? col : t.border}`, background: on ? col + '20' : 'transparent', color: on ? col : t.muted, transition: 'all .2s' })

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: t.bg2, border: `1px solid ${bColor}30`, borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp .3s ease' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, background: t.bg2, borderRadius: '20px 20px 0 0', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: bColor, marginBottom: 4 }}>{T('configureBike')}</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: t.white }}>{bikeName}</h3>
              <div style={{ fontSize: 12, color: t.muted }}>{fmt(bikeKm)} km</div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.muted, borderRadius: 10, padding: '6px 14px', cursor: 'pointer', fontSize: 18, fontFamily: 'inherit' }}>×</button>
          </div>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={L()}>📷 {T('photo')}</label>
            <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${draft.photo ? bColor : t.border}`, borderRadius: 14, minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', background: t.card, transition: 'border-color .2s' }}>
              {draft.photo ? <img src={draft.photo} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: t.muted }}><div style={{ fontSize: 28, marginBottom: 6 }}>📸</div><div style={{ fontSize: 13 }}>{T('uploadPhoto')}</div></div>}
              {draft.photo && <button onClick={e => { e.stopPropagation(); set('photo', undefined) }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>
          <div><label style={L()}>🏷 {T('nickname')}</label><input style={I()} placeholder={bikeName} value={draft.nickname ?? ''} onChange={e => set('nickname', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={L()}>🏗 {T('frameMat')}</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{['Carbon', 'Alu', 'Stahl', 'Titan'].map(o => <button key={o} style={CH(draft.frameMaterial === o)} onClick={() => set('frameMaterial', draft.frameMaterial === o ? undefined : o)}>{o}</button>)}</div></div>
            <div><label style={L()}>📐 {T('frameSize')}</label><input style={I()} placeholder="z.B. 54cm" value={draft.frameSize ?? ''} onChange={e => set('frameSize', e.target.value)} /></div>
          </div>
          <div><label style={L()}>⚙️ {T('groupset')}</label><input style={I()} placeholder="z.B. Shimano Dura-Ace" value={draft.groupset ?? ''} onChange={e => set('groupset', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={L()}>🔧 {T('drivetrain')}</label><div style={{ display: 'flex', gap: 5 }}>{['1x', '2x'].map(o => <button key={o} style={CH(draft.drivetrain === o, t.purple)} onClick={() => set('drivetrain', draft.drivetrain === o ? undefined : o)}>{o}</button>)}</div></div>
            <div><label style={L()}>🛑 {T('brakes')}</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{['Disc Hyd.', 'Disc Mech.', 'Rim'].map(o => <button key={o} style={CH(draft.brakes === o, t.orange)} onClick={() => set('brakes', draft.brakes === o ? undefined : o)}>{o}</button>)}</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={L()}>🔵 {T('wheels')}</label><input style={I()} placeholder="z.B. Zipp 303" value={draft.wheelset ?? ''} onChange={e => set('wheelset', e.target.value)} /></div>
            <div><label style={L()}>🔲 {T('tires')}</label><input style={I()} placeholder="z.B. 28c" value={draft.tireSize ?? ''} onChange={e => set('tireSize', e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={L()}>⚖️ {T('weightKg')}</label><input style={I()} type="number" step="0.1" value={draft.weightKg ?? ''} onChange={e => set('weightKg', e.target.value)} /></div>
            <div><label style={L()}>📅 {T('purchaseYear')}</label><input style={I()} type="number" placeholder="2023" value={draft.purchaseYear ?? ''} onChange={e => set('purchaseYear', e.target.value)} /></div>
            <div><label style={L()}>💶 {T('price')}</label><input style={I()} type="number" placeholder="3500" value={draft.priceEur ?? ''} onChange={e => set('priceEur', e.target.value)} /></div>
          </div>
          <div><label style={L()}>🎯 {T('useCase')}</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{['Road', 'Training', 'Race', 'Gravel', 'Commute', 'Indoor', 'Climbing', 'TT'].map(u => <button key={u} style={CH(!!(draft.useCase ?? []).includes(u), t.green)} onClick={() => toggleUse(u)}>{u}</button>)}</div></div>
          <div><label style={L()}>📝 {T('notes')}</label><textarea style={{ ...I(), minHeight: 80, resize: 'vertical' } as React.CSSProperties} placeholder="Power Meter, Saddle, Bar Tape..." value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onSave(draft)} style={{ flex: 1, padding: 12, background: `linear-gradient(90deg,${bColor},${t.accent2})`, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', boxShadow: `0 4px 20px ${bColor}40` }}>💾 {T('save')}</button>
            <button onClick={onClose} style={{ padding: '12px 20px', background: 'transparent', border: `1px solid ${t.border}`, color: t.muted, borderRadius: 12, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>{T('cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Fun Facts ──────────────────────────────────────────────────────── */
function FunFacts({ stats }: { stats: DashboardData['stats'] }) {
  const { t, T } = useT()
  const km = stats.allTime.km, h = stats.allTime.hours, elev = stats.allTime.elevation
  const facts = [
    { icon: '🌍', label: T('earthTrips'), value: (km / 40075).toFixed(2), unit: T('times'), color: t.accent },
    { icon: '✈️', label: T('munichNYC'), value: Math.floor(km / 6100), unit: T('roundTrip'), color: t.purple },
    { icon: '🏔️', label: T('mtEverest'), value: Math.floor(elev / 8849), unit: T('climbed'), color: t.yellow },
    { icon: '⏰', label: T('daysInSaddle'), value: Math.round(h / 24), unit: T('days'), color: t.green },
    { icon: '🔥', label: T('calories'), value: Math.round(km * 35 / 1000), unit: T('million'), color: t.orange },
    { icon: '🌱', label: T('co2'), value: Math.round(km * 0.12), unit: T('kgCO2'), color: t.teal },
    { icon: '🍕', label: T('pizzas'), value: Math.round(km * 35 / 800), unit: T('pizzaUnit'), color: t.red },
    { icon: '🌙', label: T('moonDist'), value: ((km / 384400) * 100).toFixed(4), unit: T('reached'), color: t.pink },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
      {facts.map((f, i) => (
        <div key={f.label} style={{ background: `linear-gradient(135deg,${t.card},${t.card2})`, border: `1px solid ${f.color}20`, borderRadius: 14, padding: '16px 18px', animation: `slideUp .4s ${i * .06}s both`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right,${f.color}0a,transparent 60%)` }} />
          <div style={{ fontSize: 22, marginBottom: 6, position: 'relative' }}>{f.icon}</div>
          <div style={{ fontSize: 10, color: t.muted, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', position: 'relative' }}>{f.label}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: f.color, lineHeight: 1, position: 'relative' }}>{f.value}</div>
          <div style={{ fontSize: 10, color: t.muted, marginTop: 2, position: 'relative' }}>{f.unit}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Spinner ─────────────────────────────────────────────────────────── */
function Spinner() {
  const { t, T } = useT()
  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ position: 'relative', width: 60, height: 60 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${t.accent}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `2px solid ${t.accent2}`, borderBottomColor: 'transparent', animation: 'spinReverse 1.1s linear infinite' }} />
      </div>
      <div style={{ color: t.muted, fontSize: 13, letterSpacing: '1px' }}>{T('loading')}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function MeinBereichPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [bikeExtras, setBikeExtras] = useState<Record<string, BikeExtra>>({})
  const [editBikeId, setEditBikeId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'training' | 'garage'>('stats')
  const [dark, setDark] = useState(true)
  const [lang, setLang] = useState<Lang>('de')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const iRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const theme = dark ? darkTheme : lightTheme
  const T = (k: TKey) => dict[lang][k]

  const DATA_URL = process.env.NEXT_PUBLIC_DATA_URL ?? '/api/strava/dashboard'

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    setAuthed(true); setBikeExtras(loadExtras())
    // Restore preferences
    try {
      const saved = localStorage.getItem('nordcup-prefs')
      if (saved) { const p = JSON.parse(saved); if (p.dark !== undefined) setDark(p.dark); if (p.lang) setLang(p.lang) }
    } catch { /* ignore */ }
  }, [router])

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem('nordcup-prefs', JSON.stringify({ dark, lang })) } catch { /* */ }
  }, [dark, lang])

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json); setError(null); setLastUpdated(new Date()); setCountdown(60)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setLoading(false) }
  }, [DATA_URL])

  useEffect(() => {
    if (!authed) return
    fetchDashboard()
    iRef.current = setInterval(fetchDashboard, 60_000)
    cdRef.current = setInterval(() => setCountdown(x => Math.max(x - 1, 0)), 1000)
    return () => { if (iRef.current) clearInterval(iRef.current); if (cdRef.current) clearInterval(cdRef.current) }
  }, [authed, fetchDashboard])

  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500) }

  const handleBikeSave = (bikeId: string, d: BikeExtra) => {
    const n = { ...bikeExtras, [bikeId]: d }
    const ok = saveExtras(n)
    setBikeExtras(n)
    setEditBikeId(null)
    showToast(ok ? T('saved') : T('saveFail'), ok)
  }

  const ctxValue = { t: theme, dark, toggle: () => setDark(d => !d), lang, setLang, T }

  if (authed === null || loading) return (
    <ThemeCtx.Provider value={ctxValue}>
      <style>{buildCSS(theme)}</style>
      <Spinner />
    </ThemeCtx.Provider>
  )
  if (error) return (
    <ThemeCtx.Provider value={ctxValue}>
      <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, fontFamily: 'Inter,system-ui,sans-serif' }}>
        <style>{buildCSS(theme)}</style>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.white }}>{error}</div>
        <button onClick={fetchDashboard} style={{ padding: '10px 24px', background: theme.accent, color: dark ? '#000' : '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit' }}>{T('retry')}</button>
      </div>
    </ThemeCtx.Provider>
  )
  if (!data) return null

  const { athlete, stats, heatmap, weeklyLoad, sportBreakdown, speedBuckets, hrZones, streak, records, monthlyKm, recentActivities } = data
  const ytdGoal = 8000
  const ytdPct = Math.min((stats.ytd.km / ytdGoal) * 100, 100)
  const maxWeekKm = Math.max(...weeklyLoad.map(w => w.km), 1)
  const maxMonthKm = Math.max(...monthlyKm.map(m => m.km), 1)
  const bestWeek = weeklyLoad.reduce((b, w) => w.km > b.km ? w : b, weeklyLoad[0])
  const bestMonth = monthlyKm.reduce((b, m) => m.km > b.km ? m : b, monthlyKm[0])
  const totalSportCount = Object.values(sportBreakdown).reduce((s, v) => s + v.count, 0)
  const editBike = editBikeId ? athlete.bikes.find((b: Bike) => b.id === editBikeId) : null

  return (
    <ThemeCtx.Provider value={ctxValue}>
      <div style={{ fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", background: theme.bg, color: theme.text, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', transition: 'background .3s,color .3s' }}>
        <style>{buildCSS(theme)}</style>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '12px 28px', borderRadius: 14, background: toast.ok ? theme.green : theme.red, color: '#fff', fontWeight: 800, fontSize: 14, animation: 'savedToast 2.5s ease both', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            {toast.msg}
          </div>
        )}

        {/* ── NAV ─────────────────────────────────────────────────── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 54, background: theme.navBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ color: theme.muted, fontSize: 12, textDecoration: 'none' }}>← {T('map')}</Link>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 14, color: theme.white }}>🚴 {athlete.name}</span>
              {athlete.premium && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#FC4C02', color: '#fff' }}>SUMMIT</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {lastUpdated && <span style={{ fontSize: 11, color: theme.muted, display: 'flex', alignItems: 'center', gap: 6 }}><GlowDot />{countdown}s</span>}

              {/* Language toggle */}
              <button onClick={() => setLang(l => l === 'de' ? 'en' : 'de')} title="Language" style={{ padding: '4px 10px', background: theme.accent + '15', border: `1px solid ${theme.accent}30`, color: theme.accent, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {lang === 'de' ? '🇩🇪' : '🇬🇧'}
              </button>

              {/* Theme toggle */}
              <button onClick={() => setDark(d => !d)} title="Theme" style={{ padding: '4px 10px', background: theme.accent + '15', border: `1px solid ${theme.accent}30`, color: theme.accent, borderRadius: 8, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>
                {dark ? '☀️' : '🌙'}
              </button>

              <button onClick={fetchDashboard} style={{ padding: '5px 12px', background: theme.accent + '15', border: `1px solid ${theme.accent}30`, color: theme.accent, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>↻</button>
              <button onClick={() => { logout(); router.push('/') }} style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${theme.border}`, color: theme.muted, borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{T('logout')}</button>
            </div>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '52px 20px 44px', background: dark ? `linear-gradient(180deg,#060e1e,${theme.bg})` : `linear-gradient(180deg,#dde6f0,${theme.bg})` }}>
          {[[theme.accent, -60, -40, 300, 300, 'float1 18s ease infinite'], [theme.accent2, '80%', 20, 250, 250, 'float2 22s ease infinite -5s'], [theme.purple, '50%', '60%', 180, 180, 'float3 15s ease infinite -8s']].map(([col, l, tp, w, h, anim], i) => (
            <div key={i} style={{ position: 'absolute', left: l as string | number, top: tp as string | number, width: w as number, height: h as number, borderRadius: '50%', background: `radial-gradient(circle,${col}15,transparent 70%)`, animation: anim as string, pointerEvents: 'none' }} />
          ))}
          <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg,${theme.accent2},${theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff', boxShadow: `0 0 0 3px ${theme.bg},0 0 0 5px ${theme.accent}50,0 0 30px ${theme.accent}30`, animation: 'pulseGlow 3s ease infinite', flexShrink: 0 }}>
                {athlete.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: theme.white, lineHeight: 1.1 }}>{athlete.name}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                  {[`📍 ${athlete.city}`, `📅 ${T('since')} ${athlete.memberSince}`, `👥 ${athlete.followers}`, `🚴 ${stats.allTime.count} ${T('rides')}`].map(tx => <span key={tx} style={{ fontSize: 12, color: theme.muted, display: 'flex', alignItems: 'center', gap: 4 }}>{tx}</span>)}
                </div>
              </div>
              <GoalRing pct={ytdPct} km={stats.ytd.km} goal={ytdGoal} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginTop: 32 }}>
              {([
                { l: T('ytdKm'), v: stats.ytd.km, u: 'km', col: theme.accent },
                { l: T('ytdH'), v: stats.ytd.hours, u: 'h', col: theme.purple },
                { l: T('ytdElev'), v: stats.ytd.elevation, u: 'm', col: theme.yellow },
                { l: T('ytdRides'), v: stats.ytd.count, u: '', col: theme.green },
                { l: T('recent4w'), v: stats.recent.km, u: 'km', col: theme.orange },
                { l: T('totalKm'), v: stats.allTime.km, u: 'km', col: theme.teal },
                { l: T('longestRide'), v: stats.biggestRideKm, u: 'km', col: theme.pink },
                { l: T('everests'), v: parseFloat(stats.allTime.everests), u: '×', col: theme.red },
              ] as { l: string; v: number; u: string; col: string }[]).map((s, i) => (
                <GlassCard key={s.l} glow={s.col} style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: theme.muted, marginBottom: 6 }}>{s.l}</div>
                  <AnimNum value={s.v} unit={s.u || undefined} color={s.col} delay={i * 60} />
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── TABS ────────────────────────────────────────────────── */}
        <div style={{ background: theme.bg2, borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 54, zIndex: 90 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '8px 20px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {([['stats', `📊 ${T('dashboard')}`], ['training', `🏋️ ${T('training')}`], ['garage', `🚲 ${T('garage')}`]] as [typeof activeTab, string][]).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '9px 20px',
                background: activeTab === tab ? theme.accent : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'),
                border: `1px solid ${activeTab === tab ? 'transparent' : theme.border}`,
                borderRadius: 12,
                color: activeTab === tab ? (dark ? '#020c1b' : '#fff') : theme.text,
                fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s',
                boxShadow: activeTab === tab ? `0 4px 16px ${theme.accent}50` : 'none',
              }}>{label}</button>
            ))}
            <Link href="/rennen" style={{ marginLeft: 'auto', padding: '9px 18px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 12, color: theme.muted, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>🏁 Rennen</Link>
          </div>
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px 80px' }}>

          {/* ══ STATS TAB ══════════════════════════════════════════ */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Streak + Records */}
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, alignItems: 'stretch' }}>
                <GlassCard glow={streak.current > 0 ? theme.orange : theme.muted} style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 6 }}>
                  <div style={{ fontSize: 48, animation: streak.current > 0 ? 'fireflicker 1s ease infinite' : undefined }}>🔥</div>
                  <AnimNum value={streak.current} color={theme.orange} size="3.5rem" />
                  <div style={{ fontSize: 11, color: theme.muted }}>{T('daysInRow')}</div>
                  <div style={{ height: 1, width: '80%', background: theme.border, margin: '6px 0' }} />
                  <div style={{ fontSize: 20, fontWeight: 900, color: theme.white }}>{streak.longest}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>{T('bestStreak')}</div>
                </GlassCard>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  {([
                    { icon: '📏', tl: T('recLongest'), v: records.longestRide ? `${records.longestRide.km} km` : '—', sub: records.longestRide?.name, col: theme.accent },
                    { icon: '⛰', tl: T('recElev'), v: records.mostElevation ? `${fmt(records.mostElevation.elevation)} m` : '—', sub: records.mostElevation?.name, col: theme.yellow },
                    { icon: '⚡', tl: T('recFast'), v: records.fastestRide ? `${records.fastestRide.kmh} km/h` : '—', sub: records.fastestRide?.name, col: theme.green },
                    { icon: '😣', tl: T('recHard'), v: records.mostSuffering ? `${records.mostSuffering.score} Pain` : '—', sub: records.mostSuffering?.name, col: theme.red },
                  ] as { icon: string; tl: string; v: string; sub?: string; col: string }[]).map(r => (
                    <GlassCard key={r.tl} glow={r.col} style={{ padding: 18 }}>
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{r.icon}</div>
                      <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: theme.muted, marginBottom: 4 }}>{r.tl}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: r.col }}>{r.v}</div>
                      {r.sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>}
                    </GlassCard>
                  ))}
                </div>
              </div>

              <GlassCard style={{ padding: 28 }}>
                <SectionLabel tag={T('activities') ?? 'Activities'} title={T('heatTitle')} sub={T('heatSub')} />
                <HeatmapGrid heatmap={heatmap} />
              </GlassCard>

              <div>
                <SectionLabel tag={T('wowTag')} title={T('wowTitle')} />
                <FunFacts stats={stats} />
              </div>

              {/* Recent Activities */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                  <SectionLabel tag={T('activities') ?? 'Activities'} title={T('lastRides')} />
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 24 }}>{data.totalActivitiesLoaded} {T('loaded')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentActivities.map((act, i) => {
                    const col = SPORT_COLORS[act.sport_type] ?? theme.accent
                    const icon = SPORT_ICON[act.sport_type] ?? '🚴'
                    return (
                      <div key={act.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', animation: `slideUp .4s ${i * .04}s both`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg,${col},${col}40)`, borderRadius: '3px 0 0 3px' }} />
                        <div style={{ paddingLeft: 6, flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span>{icon}</span>
                              <span style={{ fontWeight: 800, color: theme.white, fontSize: 13 }}>{act.name}</span>
                              {act.prCount > 0 && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: theme.yellow + '20', color: theme.yellow, border: `1px solid ${theme.yellow}30` }}>🏆 {act.prCount} PR</span>}
                              {(act.sufferScore ?? 0) > 100 && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: theme.red + '15', color: theme.red }}>🔥 {act.sufferScore}</span>}
                            </div>
                            <span style={{ fontSize: 11, color: theme.muted, flexShrink: 0 }}>{dateDE(act.date)}</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {[
                              { i: '📏', v: `${act.km} km` }, { i: '⏱', v: durStr(act.durationMin) }, { i: '⚡', v: `${act.avgSpeedKmh} km/h` },
                              act.elevation > 0 ? { i: '⛰', v: `${fmt(act.elevation)} m` } : null,
                              act.avgHr ? { i: '❤️', v: `${act.avgHr} bpm` } : null,
                              act.watts ? { i: '💪', v: `${act.watts} W` } : null,
                              act.kudos > 0 ? { i: '👍', v: String(act.kudos) } : null,
                            ].filter(Boolean).map(s => s && <span key={s.i} style={{ fontSize: 12, color: theme.text, display: 'flex', alignItems: 'center', gap: 4 }}>{s.i} {s.v}</span>)}
                          </div>
                        </div>
                        <a href={`https://www.strava.com/activities/${act.id}`} target="_blank" rel="noopener" style={{ fontSize: 11, color: theme.muted, border: `1px solid ${theme.border}`, padding: '4px 10px', borderRadius: 7, flexShrink: 0, textDecoration: 'none' }}>Strava ↗</a>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ TRAINING TAB ═════════════════════════════════════════ */}
          {activeTab === 'training' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <GlassCard style={{ padding: 28 }}>
                  <SectionLabel tag={T('weeklyTag')} title={T('weeklyTitle')} sub={`${T('bestWeek')}: ${bestWeek.label} · ${bestWeek.km} km`} />
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 110, marginBottom: 8 }}>
                    {weeklyLoad.map((w, i) => {
                      const pct = (w.km / maxWeekKm) * 100; const isCur = i === weeklyLoad.length - 1; const isBest = w.km === bestWeek.km
                      const col = isBest ? theme.yellow : isCur ? theme.accent : w.km > 0 ? theme.accent + '60' : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')
                      return (
                        <div key={i} title={`${w.label}: ${w.km} km, ${w.rides} Rides`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                          {w.km > 0 && <div style={{ fontSize: 8, color: isBest ? theme.yellow : isCur ? theme.accent : theme.muted, fontWeight: 700 }}>{w.km}</div>}
                          <div style={{ width: '100%', height: `${Math.max(pct, 2)}%`, background: `linear-gradient(180deg,${col},${col}99)`, borderRadius: '4px 4px 2px 2px', boxShadow: (isBest || isCur) ? `0 0 8px ${col}60` : 'none', transition: 'height 1s ease', minHeight: w.km > 0 ? 3 : 0 }} />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>{weeklyLoad.map((w, i) => <div key={i} style={{ flex: 1, fontSize: 7, color: i === weeklyLoad.length - 1 ? theme.accent : theme.muted, textAlign: 'center', overflow: 'hidden' }}>{i % 3 === 0 || i === weeklyLoad.length - 1 ? w.label : ''}</div>)}</div>
                </GlassCard>

                <GlassCard style={{ padding: 28 }}>
                  <SectionLabel tag={T('monthTag')} title={T('monthTitle')} sub={`${T('bestMonthLbl')}: ${bestMonth.month} · ${bestMonth.km} km`} />
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, marginBottom: 8 }}>
                    {monthlyKm.map((m, i) => {
                      const pct = (m.km / maxMonthKm) * 100; const isCur = i === new Date().getMonth(); const isBest = m.km === bestMonth.km && m.km > 0
                      const col = isBest ? theme.yellow : isCur ? theme.accent : m.km > 0 ? theme.purple + '80' : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
                      return (
                        <div key={m.month} title={`${m.month}: ${m.km} km, ${m.rides} Rides`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          {m.km > 0 && <div style={{ fontSize: 8, color: isBest ? theme.yellow : isCur ? theme.accent : theme.muted, fontWeight: 700 }}>{m.km}</div>}
                          <div style={{ width: '100%', height: `${Math.max(pct, 2)}%`, background: `linear-gradient(180deg,${col},${col}80)`, borderRadius: '4px 4px 2px 2px', minHeight: m.km > 0 ? 3 : 0 }} />
                          <div style={{ fontSize: 8, color: isCur ? theme.accent : theme.muted, fontWeight: isCur ? 800 : 400 }}>{m.month}</div>
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
              </div>

              {/* ── Trend Analysis ─────────────────────────────────── */}
              <GlassCard style={{ padding: 28 }}>
                <SectionLabel tag="Trend" title="Trainingsform &amp; Belastungstrend" sub="Rollender 4-Wochen-Schnitt (lila) über wöchentliche Belastung (blau)" />
                {(() => {
                  const recent = weeklyLoad.slice(-16)
                  const maxKm = Math.max(...recent.map(w => w.km), 1)
                  const rolling = recent.map((_, i, arr) => {
                    const sl = arr.slice(Math.max(0, i - 3), i + 1).filter(w => w.km > 0)
                    return sl.length > 0 ? sl.reduce((s, w) => s + w.km, 0) / sl.length : 0
                  })
                  const maxAll = Math.max(maxKm, Math.max(...rolling), 1)
                  const last4Avg = weeklyLoad.slice(-4).filter(w => w.km > 0).reduce((s, w, _, a) => s + w.km / a.length, 0)
                  const prev4Avg = weeklyLoad.slice(-8, -4).filter(w => w.km > 0).reduce((s, w, _, a) => s + w.km / a.length, 0)
                  const trendPct = prev4Avg > 0 ? Math.round(((last4Avg - prev4Avg) / prev4Avg) * 100) : 0
                  const W = 460, H = 100
                  const barW = Math.max((W / recent.length) - 3, 2)
                  const linePoints = rolling.map((v, i) => {
                    const x = (i / Math.max(recent.length - 1, 1)) * W
                    const y = H - (v / maxAll) * H
                    return `${x.toFixed(1)},${y.toFixed(1)}`
                  }).join(' ')
                  return (
                    <div>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Ø Letzte 4 Wochen', value: `${Math.round(last4Avg)} km/W`, color: theme.accent },
                          { label: 'Trend vs. Vorperiode', value: `${trendPct > 0 ? '+' : ''}${trendPct}%`, color: trendPct >= 5 ? theme.green : trendPct <= -5 ? theme.red : theme.yellow },
                          { label: 'Beste Woche', value: `${Math.max(...weeklyLoad.map(w => w.km))} km`, color: theme.yellow },
                          { label: 'Wochen aktiv', value: `${weeklyLoad.filter(w => w.km > 0).length}`, color: theme.purple },
                        ].map(s => (
                          <div key={s.label} style={{ background: s.color + '18', border: `1px solid ${s.color}35`, borderRadius: 10, padding: '10px 16px', flex: 1, minWidth: 120 }}>
                            <div style={{ fontSize: 9, color: theme.muted, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', minWidth: 320, height: 'auto', display: 'block' }}>
                          {/* Grid lines */}
                          {[0.25, 0.5, 0.75, 1].map(f => (
                            <line key={f} x1={0} y1={H - f * H} x2={W} y2={H - f * H} stroke={dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} strokeWidth={1} />
                          ))}
                          {/* Bars */}
                          {recent.map((w, i) => {
                            const bh = (w.km / maxAll) * H
                            const x = (i / recent.length) * W + 1
                            const isBest = w.km === Math.max(...recent.map(x => x.km)) && w.km > 0
                            const isCur = i === recent.length - 1
                            const col = isBest ? theme.yellow : isCur ? theme.accent : theme.accent + '50'
                            return bh > 0 ? <rect key={i} x={x} y={H - bh} width={barW} height={bh} rx={3} fill={col} /> : null
                          })}
                          {/* Rolling avg line */}
                          {rolling.some(v => v > 0) && (
                            <>
                              <polyline points={linePoints} fill="none" stroke={theme.purple} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                              {rolling.map((v, i) => v > 0 ? (
                                <circle key={i} cx={(i / Math.max(recent.length - 1, 1)) * W} cy={H - (v / maxAll) * H} r={3} fill={theme.purple} />
                              ) : null)}
                            </>
                          )}
                          {/* X labels */}
                          {recent.map((w, i) => i % 4 === 0 || i === recent.length - 1 ? (
                            <text key={i} x={(i / recent.length) * W + barW / 2} y={H + 16} textAnchor="middle" fill={i === recent.length - 1 ? theme.accent : theme.muted} fontSize={8} fontWeight={i === recent.length - 1 ? '800' : '400'}>{w.label}</text>
                          ) : null)}
                          <text x={W} y={H + 16} textAnchor="end" fill={theme.purple} fontSize={8} fontWeight="700">── Ø 4W</text>
                        </svg>
                      </div>
                    </div>
                  )
                })()}
              </GlassCard>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <GlassCard style={{ padding: 28 }}>
                  <SectionLabel tag={T('sportTag')} title={T('sportTitle')} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(sportBreakdown).sort((a, b) => b[1].count - a[1].count).map(([label, val], i) => {
                      const pct = Math.round((val.count / totalSportCount) * 100)
                      const cols = [theme.accent, theme.purple, theme.yellow, theme.green, theme.teal, theme.orange]
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>{label}</span>
                            <span style={{ fontSize: 11, color: theme.muted }}>{val.count}× · {Math.round(val.km)} km · {pct}%</span>
                          </div>
                          <AnimBar pct={pct} color={cols[i % cols.length]} delay={i * 80} />
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
                <GlassCard style={{ padding: 28 }}>
                  <SectionLabel tag={T('dayTag')} title={T('dayTitle')} />
                  <DayRadar heatmap={heatmap} />
                </GlassCard>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <GlassCard style={{ padding: 28 }}>
                  <SectionLabel tag={T('speedTag')} title={T('speedTitle')} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {speedBuckets.map((b, i) => {
                      const total = speedBuckets.reduce((s, x) => s + x.count, 0)
                      const pct = total > 0 ? Math.round((b.count / total) * 100) : 0
                      const maxC = Math.max(...speedBuckets.map(x => x.count), 1)
                      const cols = [theme.muted, theme.teal, theme.accent, theme.purple, theme.orange, theme.red]
                      return (
                        <div key={b.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: theme.text }}>{b.label} km/h</span>
                            <span style={{ fontSize: 11, color: theme.muted }}>{b.count} · {pct}%</span>
                          </div>
                          <AnimBar pct={(b.count / maxC) * 100} color={cols[i] ?? theme.accent} height={12} delay={i * 80} />
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
                <GlassCard style={{ padding: 28 }}>
                  <SectionLabel tag={T('hrTag')} title={T('hrTitle')} />
                  {hrZones.reduce((s, z) => s + z.count, 0) === 0
                    ? <div style={{ color: theme.muted, fontSize: 13, textAlign: 'center', paddingTop: 20 }}>{T('noHR')}</div>
                    : <>
                      <div style={{ height: 18, borderRadius: 9, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 20 }}>{hrZones.map(z => z.count > 0 && <div key={z.label} style={{ flex: z.count, background: z.color }} />)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {hrZones.map((z, i) => {
                          const total = hrZones.reduce((s, x) => s + x.count, 0); const pct = Math.round((z.count / total) * 100); const max = Math.max(...hrZones.map(x => x.count), 1)
                          return (
                            <div key={z.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: z.color }} /><span style={{ fontSize: 12, color: theme.text }}>{z.label}</span></div>
                                <span style={{ fontSize: 11, color: z.color, fontWeight: 700 }}>{pct}%</span>
                              </div>
                              <AnimBar pct={(z.count / max) * 100} color={z.color} height={8} delay={i * 80} />
                            </div>
                          )
                        })}
                      </div>
                    </>}
                </GlassCard>
              </div>
            </div>
          )}

          {/* ══ GARAGE TAB ═══════════════════════════════════════════ */}
          {activeTab === 'garage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <GarageCarousel bikes={athlete.bikes} bikeExtras={bikeExtras} onEdit={id => setEditBikeId(id)} />

              {/* Comparison table */}
              {athlete.bikes.length > 1 && (
                <GlassCard style={{ padding: 24, marginTop: 8 }}>
                  <SectionLabel tag={T('compareTag')} title={T('compareTitle')} />
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: theme.muted, fontWeight: 700 }}>{T('propLabel')}</th>
                          {athlete.bikes.map((bike: Bike, i: number) => <th key={bike.id} style={{ textAlign: 'center', padding: '8px 12px', color: BIKE_COLORS[i % BIKE_COLORS.length], fontWeight: 800 }}>{bikeExtras[bike.id]?.nickname || bike.name || `${bike.brand} ${bike.model}`}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { k: T('kmLabel'), fn: (b: Bike) => `${fmt(b.km)} km` },
                          { k: T('groupsetL'), fn: (b: Bike) => bikeExtras[b.id]?.groupset ?? '—' },
                          { k: T('frameL'), fn: (b: Bike) => bikeExtras[b.id]?.frameMaterial ?? '—' },
                          { k: T('weightL'), fn: (b: Bike) => bikeExtras[b.id]?.weightKg ? bikeExtras[b.id].weightKg + ' kg' : '—' },
                          { k: T('yearL'), fn: (b: Bike) => bikeExtras[b.id]?.purchaseYear ?? '—' },
                          { k: T('statusL'), fn: (b: Bike) => b.km > 15000 ? '⚠️ Maintenance' : b.km > 8000 ? '🔄 Check' : '✅ Top' },
                        ].map((row, ri) => (
                          <tr key={row.k} style={{ borderBottom: `1px solid ${theme.border}`, background: ri % 2 === 0 ? (dark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.02)') : 'transparent' }}>
                            <td style={{ padding: '9px 12px', color: theme.muted, fontWeight: 600 }}>{row.k}</td>
                            {athlete.bikes.map((bike: Bike) => <td key={bike.id} style={{ padding: '9px 12px', color: theme.text, textAlign: 'center' }}>{row.fn(bike)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}
            </div>
          )}
        </div>

        {/* ── BIKE MODAL ─────────────────────────────────────────── */}
        {editBike && (
          <BikeModal
            bikeId={editBike.id}
            bikeName={bikeExtras[editBike.id]?.nickname || editBike.name || `${editBike.brand} ${editBike.model}`}
            bikeKm={editBike.km}
            bColor={BIKE_COLORS[athlete.bikes.indexOf(editBike) % BIKE_COLORS.length]}
            init={bikeExtras[editBike.id] ?? {}}
            onSave={d => handleBikeSave(editBike.id, d)}
            onClose={() => setEditBikeId(null)}
          />
        )}

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer style={{ padding: '20px 0', borderTop: `1px solid ${theme.border}`, textAlign: 'center', color: theme.muted, fontSize: 11, background: theme.bg2 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
            {lastUpdated && `${T('stand')}: ${lastUpdated.toLocaleTimeString('de-DE')} · `}
            {data.totalActivitiesLoaded} {T('activities')} · {' '}
            <Link href="/" style={{ color: theme.muted }}>{T('map')}</Link>{' · '}
            <Link href="/viking-bike-challenge" style={{ color: theme.muted }}>{T('vikingBike')}</Link>{' · '}
            <Link href="/rennen" style={{ color: theme.muted }}>🏁 Rennen</Link>
          </div>
        </footer>
      </div>
    </ThemeCtx.Provider>
  )
}
