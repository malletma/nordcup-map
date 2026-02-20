'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'

/* ───── Theme (same tokens as mein-bereich) ────────────────────────── */
const darkTheme = {
  bg: '#04080f', bg2: '#070e1a', card: '#0a1525', card2: '#0d1c30',
  border: 'rgba(99,179,255,0.08)', white: '#e8f4ff', text: '#b0cce8',
  muted: '#4a6080', accent: '#38bdf8', accent2: '#6366f1',
  green: '#34d399', red: '#f87171', orange: '#fb923c',
  purple: '#a78bfa', yellow: '#fbbf24', teal: '#2dd4bf', pink: '#f472b6',
  navBg: 'rgba(4,8,15,0.9)', cardGlass: 'rgba(10,21,37,0.95)', cardGlass2: 'rgba(13,28,48,0.9)',
  scrollTrack: '#04080f', scrollThumb: '#1e3a5f',
}
const lightTheme = {
  bg: '#f0f4f8', bg2: '#e8eef4', card: '#ffffff', card2: '#f5f8fc',
  border: 'rgba(30,60,100,0.1)', white: '#0f172a', text: '#334155',
  muted: '#64748b', accent: '#0284c7', accent2: '#4f46e5',
  green: '#059669', red: '#dc2626', orange: '#ea580c',
  purple: '#7c3aed', yellow: '#ca8a04', teal: '#0d9488', pink: '#db2777',
  navBg: 'rgba(240,244,248,0.95)', cardGlass: 'rgba(255,255,255,0.95)', cardGlass2: 'rgba(245,248,252,0.9)',
  scrollTrack: '#e2e8f0', scrollThumb: '#94a3b8',
}
type Theme = typeof darkTheme

function buildCSS(t: Theme, dark: boolean) { return `
@keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-30px)}}
@keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,20px)}}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.1)}}
@keyframes countFlip{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes tickLine{0%,100%{opacity:.3}50%{opacity:.9}}
* { box-sizing:border-box; }
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${t.scrollTrack}}::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:3px}
` }

/* ───── Race data ───────────────────────────────────────────────────── */
interface Race {
  id: string
  name: string
  subtitle: string
  date: string          // ISO target datetime (local →UTC planned start)
  location: string
  country: string
  flag: string
  distanceKm: number
  elevationM: number
  participantCount: string
  startTime: string
  url: string
  color: string
  icon: string
  description: string
  mapUrl: string        // OSM embed
  highlights: string[]
  elevationProfile: string   // SVG points (normalized 0-100 viewbox)
  series?: string
}

const RACES: Race[] = [
  {
    id: 'vatternrundan',
    name: 'Vätternrundan',
    subtitle: '315 km rund um den Vätternsee',
    date: '2026-06-12T17:30:00Z',   // 19:30 CEST = 17:30 UTC
    location: 'Motala, Schweden',
    country: 'Schweden',
    flag: '🇸🇪',
    distanceKm: 315,
    elevationM: 2800,
    participantCount: '~23.000',
    startTime: '19:30 Uhr',
    url: 'https://vatternrundan.se/vatternrundan/en/',
    color: '#005B99',
    icon: '🌊',
    description: 'Eines der größten Radrennen der Welt – 315 km rund um den See Vättern in einer Nacht-Etappe. Teil der „En Svensk Klassiker" Serie. Du startest am Abend und fährst die ganze Nacht durch – ein unvergessliches Erlebnis.',
    mapUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=13.60,57.50,15.80,59.00&layer=mapnik&marker=58.541,15.042',
    highlights: ['Nacht-Start 19:30 Uhr', '23.000 Teilnehmer', 'En Svensk Klassiker', '315 km am Stück', 'Überquerung von 4 Provinzen'],
    elevationProfile: '0,100 15,85 30,90 50,75 70,88 90,82 110,70 130,78 160,88 190,82 220,90 250,85 280,88 315,100',
    series: 'En Svensk Klassiker',
  },
  {
    id: 'letape-dk',
    name: "L'Étape Denmark",
    subtitle: '300 km – Flensburg → Viborg',
    date: '2026-06-27T04:30:00Z',   // 06:30 CEST = 04:30 UTC
    location: 'Flensburg → Viborg',
    country: 'Deutschland / Dänemark',
    flag: '🇩🇪🇩🇰',
    distanceKm: 300,
    elevationM: 2500,
    participantCount: '~7.500',
    startTime: '06:30 Uhr',
    url: 'https://denmark.letapeseries.com',
    color: '#FFD700',
    icon: '🏆',
    description: 'Der offizielle L\'Étape Denmark – Teil der legendären Tour de France L\'Étape-Serie. 300 km entlang des uralten Hærvejen-Pfads von Flensburg gen Norden bis nach Viborg. Geschichte in jedem Pedaltritt.',
    mapUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=8.80,54.50,10.20,56.80&layer=mapnik&marker=54.796,9.437',
    highlights: ['L\'Étape by Tour de France', 'Historischer Hærvejen-Weg', '7.500 Teilnehmer 2025', 'Grenzüberschreitend DE→DK', '2.500 Hm Gesamtsteigung'],
    elevationProfile: '0,100 20,88 50,82 80,78 110,85 140,75 170,80 200,72 230,78 260,82 300,100',
    series: "L'Étape by Tour de France",
  },
  {
    id: 'msr300',
    name: 'Mecklenburger Seen Runde 300',
    subtitle: '300 km durch die Mecklenburger Seenplatte',
    date: '2026-09-05T06:00:00Z',   // 08:00 CEST = 06:00 UTC (estimated)
    location: 'Mecklenburgische Seenplatte, DE',
    country: 'Deutschland',
    flag: '🇩🇪',
    distanceKm: 300,
    elevationM: 2200,
    participantCount: 'Individuell',
    startTime: '~08:00 Uhr (geplant)',
    url: 'https://www.mecklenburger-seen-runde.de/de/msr300',
    color: '#34d399',
    icon: '🌲',
    description: 'Die Mecklenburger Seen Runde 300 führt durch die traumhafte Seenlandschaft Norddeutschlands. Flache bis leicht hügelige Strecke über 300 km durch Wälder, an Seen entlang und durch kleine Dörfer – perfekt für Ausdauerfahrer.',
    mapUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=11.80,53.00,13.80,54.20&layer=mapnik&marker=53.450,12.680',
    highlights: ['Einmalige Seenlandschaft', 'Flaches Nord-Deutschland', 'GPX-Track verfügbar', 'Einzel oder Gruppe', '300 km Norddeutschland'],
    elevationProfile: '0,100 40,95 80,92 120,96 160,92 200,95 240,90 280,94 300,100',
    series: undefined,
  },
]

/* ───── Countdown helper ────────────────────────────────────────────── */
function useCountdown(targetISO: string) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0, past: false })
  useEffect(() => {
    function calc() {
      const diff = new Date(targetISO).getTime() - Date.now()
      if (diff <= 0) { setParts({ d: 0, h: 0, m: 0, s: 0, past: true }); return }
      const total = Math.floor(diff / 1000)
      setParts({ d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60, past: false })
    }
    calc()
    const iv = setInterval(calc, 1000)
    return () => clearInterval(iv)
  }, [targetISO])
  return parts
}

/* ───── Sub-components ──────────────────────────────────────────────── */
function GlassCard({ children, style, glow, dark, t }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string; dark: boolean; t: Theme }) {
  return (
    <div style={{
      background: `linear-gradient(135deg,${t.cardGlass},${t.cardGlass2})`,
      border: `1px solid ${glow ? glow + '40' : t.border}`,
      borderRadius: 18, backdropFilter: 'blur(20px)',
      boxShadow: glow ? `0 0 0 1px ${glow}15,0 8px 32px rgba(0,0,0,.2),inset 0 1px 0 ${glow}15` : '0 8px 32px rgba(0,0,0,.1)',
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      {glow && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top left,${glow}08,transparent 60%)`, pointerEvents: 'none' }} />}
      {children}
    </div>
  )
}

function CountdownBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 56 }}>
      <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', animation: 'countFlip .2s ease', fontFamily: 'inherit' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: color + 'aa' }}>{label}</div>
    </div>
  )
}

function RaceCard({ race, dark, t }: { race: Race; dark: boolean; t: Theme }) {
  const cd = useCountdown(race.date)
  const [mapVisible, setMapVisible] = useState(false)

  useEffect(() => { const tm = setTimeout(() => setMapVisible(true), 300); return () => clearTimeout(tm) }, [])

  const raceDate = new Date(race.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  const daysLeft = cd.d

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, animation: 'slideUp .5s ease both' }}>
      {/* Header strip */}
      <div style={{ background: `linear-gradient(90deg, ${race.color}20, ${race.color}08)`, borderRadius: '18px 18px 0 0', border: `1px solid ${race.color}30`, borderBottom: 'none', padding: '24px 28px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, fontSize: 120, opacity: 0.08, lineHeight: 1 }}>{race.icon}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: race.color + '25', color: race.color, border: `1px solid ${race.color}40`, letterSpacing: '1px', textTransform: 'uppercase' }}>{race.flag} {race.country}</span>
              {race.series && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: t.purple + '20', color: t.purple, border: `1px solid ${t.purple}30` }}>{race.series}</span>}
            </div>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: t.white, lineHeight: 1.1 }}>{race.name}</h2>
            <div style={{ fontSize: 13, color: t.muted, marginTop: 4 }}>{race.subtitle}</div>
          </div>
          <div style={{ background: race.color + '15', border: `1px solid ${race.color}30`, borderRadius: 14, padding: '12px 18px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 4 }}>📅 Datum</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: race.color }}>{raceDate}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>⏰ {race.startTime}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <GlassCard dark={dark} t={t} glow={race.color} style={{ borderRadius: '0 0 18px 18px', padding: 0, border: `1px solid ${race.color}30`, borderTop: 'none' }}>
        <div style={{ padding: '24px 28px' }}>
          {/* Countdown */}
          <div style={{ background: dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)', borderRadius: 16, padding: '18px 24px', marginBottom: 24, display: 'flex', gap: 0, alignItems: 'center', justifyContent: 'center', border: `1px solid ${race.color}20` }}>
            {cd.past
              ? <div style={{ fontSize: 18, fontWeight: 900, color: race.color }}>🏁 Rennen hat stattgefunden</div>
              : (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <CountdownBlock label="Tage" value={cd.d} color={race.color} />
                  <div style={{ fontSize: 32, fontWeight: 900, color: race.color + '60', marginBottom: 18, padding: '0 4px' }}>:</div>
                  <CountdownBlock label="Std" value={cd.h} color={race.color} />
                  <div style={{ fontSize: 32, fontWeight: 900, color: race.color + '60', marginBottom: 18, padding: '0 4px' }}>:</div>
                  <CountdownBlock label="Min" value={cd.m} color={race.color} />
                  <div style={{ fontSize: 32, fontWeight: 900, color: race.color + '60', marginBottom: 18, padding: '0 4px' }}>:</div>
                  <CountdownBlock label="Sek" value={cd.s} color={race.color} />
                  {daysLeft > 0 && <div style={{ marginLeft: 16, fontSize: 11, color: t.muted, maxWidth: 100 }}>bis zum Start in {race.location}</div>}
                </div>
              )}
          </div>

          {/* Stats + Map side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Key stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon: '📏', label: 'Distanz', value: `${race.distanceKm} km`, col: race.color },
                  { icon: '⛰️', label: 'Höhenmeter', value: `~${race.elevationM.toLocaleString('de-DE')} m`, col: t.yellow },
                  { icon: '👥', label: 'Teilnehmer', value: race.participantCount, col: t.purple },
                  { icon: '📍', label: 'Start', value: race.location.split(',')[0], col: t.teal },
                ].map(s => (
                  <div key={s.label} style={{ background: s.col + '12', border: `1px solid ${s.col}25`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: s.col }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ fontSize: 13, color: t.text, lineHeight: 1.7 }}>{race.description}</div>

              {/* Highlights */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: t.muted, marginBottom: 8 }}>Highlights</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {race.highlights.map(h => (
                    <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.text }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: race.color, flexShrink: 0 }} />
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              {/* Elevation profile */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: t.muted, marginBottom: 8 }}>Höhenprofil (schematisch)</div>
                <svg viewBox={`0 0 ${race.distanceKm} 100`} style={{ width: '100%', height: 60, display: 'block' }} preserveAspectRatio="none">
                  {/* Area fill */}
                  <polygon
                    points={`0,100 ${race.elevationProfile} ${race.distanceKm},100`}
                    fill={race.color + '25'}
                  />
                  {/* Line */}
                  <polyline
                    points={race.elevationProfile}
                    fill="none"
                    stroke={race.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: t.muted, marginTop: 2 }}>
                  <span>0 km</span>
                  <span>{race.distanceKm / 2} km</span>
                  <span>{race.distanceKm} km</span>
                </div>
              </div>

              <a href={race.url} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', padding: '11px 0', background: `linear-gradient(90deg,${race.color},${race.color}cc)`, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', boxShadow: `0 4px 16px ${race.color}40` }}>
                🔗 Zur offiziellen Website →
              </a>
            </div>

            {/* Right: Map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: t.muted, marginBottom: 8 }}>Streckengebiet</div>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${race.color}30`, flex: 1, minHeight: 340 }}>
                {mapVisible && (
                  <iframe
                    src={race.mapUrl}
                    style={{ width: '100%', height: '100%', minHeight: 340, border: 'none', display: 'block' }}
                    title={`Karte: ${race.name}`}
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

/* ───── Season summary ────────────────────────────────────────────────── */
function SeasonSummary({ dark, t }: { dark: boolean; t: Theme }) {
  const totalKm = RACES.reduce((s, r) => s + r.distanceKm, 0)
  const totalElev = RACES.reduce((s, r) => s + r.elevationM, 0)
  const firstRace = new Date(RACES[0].date)
  const lastRace = new Date(RACES[RACES.length - 1].date)
  const spanDays = Math.round((lastRace.getTime() - firstRace.getTime()) / 86400000)

  return (
    <GlassCard dark={dark} t={t} glow={t.accent} style={{ padding: 28 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: t.accent, marginBottom: 6 }}>Saison-Übersicht</div>
      <h2 style={{ margin: '0 0 4px', fontSize: 'clamp(1.2rem,2.5vw,1.7rem)', fontWeight: 900, color: t.white }}>Deine 3 Highlight-Rennen 2026</h2>
      <div style={{ fontSize: 13, color: t.muted, marginBottom: 24 }}>Wenn du alle drei absolvierst: {totalKm} km Wettkampf-Distanz</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        {[
          { label: 'Gesamt-km', value: `${totalKm}`, unit: 'km', col: t.accent },
          { label: 'Gesamt Hm', value: `~${totalElev.toLocaleString('de-DE')}`, unit: 'm', col: t.yellow },
          { label: 'Rennen', value: '3', unit: 'Events', col: t.purple },
          { label: 'Zeitraum', value: `${spanDays}`, unit: 'Tage', col: t.green },
        ].map(s => (
          <div key={s.label} style={{ background: s.col + '15', border: `1px solid ${s.col}30`, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.col, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.col + 'aa', marginTop: 2 }}>{s.unit}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ───── Timeline ─────────────────────────────────────────────────────── */
function Timeline({ dark, t }: { dark: boolean; t: Theme }) {
  return (
    <GlassCard dark={dark} t={t} style={{ padding: 28 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: t.muted, marginBottom: 6 }}>Kalender</div>
      <h2 style={{ margin: '0 0 24px', fontSize: '1.3rem', fontWeight: 900, color: t.white }}>Rennsaison 2026</h2>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical timeline line */}
        <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg,${t.accent},${RACES[1].color},${RACES[2].color})`, borderRadius: 1 }} />
        {RACES.map((r, i) => {
          const d = new Date(r.date)
          return (
            <div key={r.id} style={{ display: 'flex', gap: 16, marginBottom: i < RACES.length - 1 ? 28 : 0, position: 'relative', animation: `slideUp .4s ${i * .1}s both` }}>
              {/* Dot */}
              <div style={{ position: 'absolute', left: -24, top: 4, width: 14, height: 14, borderRadius: '50%', background: r.color, border: `3px solid ${dark ? '#04080f' : '#f0f4f8'}`, boxShadow: `0 0 12px ${r.color}60`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: t.white }}>{r.flag} {r.name}</span>
                </div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{r.location} · {r.distanceKm} km · {r.startTime}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: r.color }}>~{r.elevationM.toLocaleString('de-DE')} Hm</div>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

/* ───── Main Page ────────────────────────────────────────────────────── */
export default function RennenPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [dark, setDark] = useState(true)
  const [lang, setLang] = useState<'de' | 'en'>('de')

  const theme = dark ? darkTheme : lightTheme

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    setAuthed(true)
    try {
      const p = JSON.parse(localStorage.getItem('nordcup-prefs') ?? '{}')
      if (p.dark !== undefined) setDark(p.dark)
      if (p.lang) setLang(p.lang)
    } catch { /* */ }
  }, [router])

  useEffect(() => {
    try { localStorage.setItem('nordcup-prefs', JSON.stringify({ dark, lang })) } catch { /* */ }
  }, [dark, lang])

  if (authed === null) return null

  const t = theme

  return (
    <div style={{ fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", background: t.bg, color: t.text, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', transition: 'background .3s,color .3s' }}>
      <style>{buildCSS(t, dark)}</style>

      {/* ─── NAV ──────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 54, background: t.navBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/mein-bereich" style={{ color: t.muted, fontSize: 12, textDecoration: 'none' }}>← Dashboard</Link>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: t.white }}>🏁 Highlight Rennen 2026</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setLang(l => l === 'de' ? 'en' : 'de')} style={{ padding: '4px 10px', background: t.accent + '15', border: `1px solid ${t.accent}30`, color: t.accent, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              {lang === 'de' ? '🇩🇪' : '🇬🇧'}
            </button>
            <button onClick={() => setDark(d => !d)} style={{ padding: '4px 10px', background: t.accent + '15', border: `1px solid ${t.accent}30`, color: t.accent, borderRadius: 8, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '52px 20px 44px', background: dark ? `linear-gradient(180deg,#060e1e,${t.bg})` : `linear-gradient(180deg,#dde6f0,${t.bg})` }}>
        {[
          [t.accent, -40, -30, 280, 280, 'float1 18s ease infinite'],
          [RACES[1].color, '80%', 10, 240, 240, 'float2 22s ease infinite -5s'],
        ].map(([col, l, tp, w, h, anim], i) => (
          <div key={i} style={{ position: 'absolute', left: l as string | number, top: tp as string | number, width: w as number, height: h as number, borderRadius: '50%', background: `radial-gradient(circle,${col}12,transparent 70%)`, animation: anim as string, pointerEvents: 'none' }} />
        ))}
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '4px', textTransform: 'uppercase', color: t.accent, marginBottom: 12 }}>🏁 Saison 2026</div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, color: t.white, lineHeight: 1.1 }}>
            Meine Highlight-Rennen
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: t.muted, maxWidth: 600 }}>
            Drei der härtesten und schönsten Ultradistanz-Radrennen Europas – insgesamt {RACES.reduce((s, r) => s + r.distanceKm, 0)} km Wettkampf in einer Saison.
          </p>

          {/* Quick legend */}
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            {RACES.map(r => (
              <a key={r.id} href={`#${r.id}`} style={{ padding: '8px 18px', background: r.color + '18', border: `1px solid ${r.color}40`, borderRadius: 10, color: r.color, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                {r.icon} {r.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px 80px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Season summary + timeline side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <SeasonSummary dark={dark} t={t} />
          <Timeline dark={dark} t={t} />
        </div>

        {/* Individual race cards */}
        {RACES.map((race, i) => (
          <div key={race.id} id={race.id} style={{ animationDelay: `${i * .1}s` }}>
            <RaceCard race={race} dark={dark} t={t} />
          </div>
        ))}
      </div>

      {/* ─── FOOTER ────────────────────────────────────────────────── */}
      <footer style={{ padding: '20px 0', borderTop: `1px solid ${t.border}`, textAlign: 'center', color: t.muted, fontSize: 11, background: t.bg2 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
          <Link href="/" style={{ color: t.muted }}>Karte</Link>{' · '}
          <Link href="/mein-bereich" style={{ color: t.muted }}>Dashboard</Link>{' · '}
          <Link href="/viking-bike-challenge" style={{ color: t.muted }}>Viking Bike</Link>
        </div>
      </footer>
    </div>
  )
}
