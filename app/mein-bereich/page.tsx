'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, logout } from '@/lib/auth'

const t = {
  bg: '#060d18', bg2: '#0b1424', card: '#0e1929', card2: '#0c1624',
  border: 'rgba(255,255,255,0.07)', white: '#e8f0fc', text: '#c0cdea',
  muted: '#6b7a96', accent: '#3b82f6', green: '#10b981', red: '#f43f5e',
  orange: '#f97316', purple: '#a855f7', yellow: '#eab308', teal: '#14b8a6',
}

const SPORT_COLORS: Record<string, string> = {
  Ride: t.accent, GravelRide: t.purple, VirtualRide: t.yellow,
  MountainBikeRide: t.green, EBikeRide: t.teal,
}
const SPORT_ICONS: Record<string, string> = {
  Ride: '🚴', GravelRide: '🪨', VirtualRide: '⚡', MountainBikeRide: '🏔️',
  EBikeRide: '🔋', Run: '🏃', Walk: '🚶',
}

function durStr(min: number) {
  const h = Math.floor(min / 60), m = min % 60
  return h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}`.trim() : `${m}min`
}
function dateFmt(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface DashboardData {
  athlete: {
    name: string; username: string; city: string; country: string
    weight: number; premium: boolean; memberSince: number
    followers: number; following: number
    bikes: { id: string; name: string; brand: string; model: string; km: number; primary: boolean }[]
  }
  stats: {
    ytd: { count: number; km: number; hours: number; elevation: number }
    recent: { count: number; km: number; hours: number; elevation: number }
    allTime: { count: number; km: number; hours: number; elevation: number; everests: string }
    biggestRideKm: number; biggestClimbM: number
  }
  heatmap: Record<string, number>
  weeklyLoad: { label: string; km: number; rides: number; elevation: number }[]
  sportBreakdown: Record<string, { count: number; km: number }>
  speedBuckets: { label: string; min: number; max: number; count: number }[]
  hrZones: { label: string; max: number; count: number; color: string }[]
  streak: { current: number; longest: number }
  records: {
    longestRide: { name: string; km: number; date: string } | null
    mostElevation: { name: string; elevation: number; date: string } | null
    fastestRide: { name: string; kmh: number; km: number; date: string } | null
    mostSuffering: { name: string; score: number; date: string } | null
  }
  monthlyKm: { month: string; km: number; rides: number }[]
  recentActivities: {
    id: number; name: string; sport_type: string; date: string
    km: number; durationMin: number; elevation: number; avgSpeedKmh: number
    avgHr: number | null; watts: number | null; sufferScore: number | null
    kudos: number; prCount: number
  }[]
  fetchedAt: string
  totalActivitiesLoaded: number
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: t.accent, marginBottom: 5 }}>{label}</div>
      <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem,2.2vw,1.5rem)', fontWeight: 800, color: t.white }}>{title}</h2>
    </div>
  )
}

function StatPill({ value, unit, label, color = t.accent, sub }: {
  value: string | number; unit?: string; label: string; color?: string; sub?: string
}) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right,${color}18,transparent 65%)` }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: t.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 'clamp(1.6rem,2.8vw,2.2rem)', fontWeight: 900, color: t.white, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}{unit && <span style={{ fontSize: '0.45em', fontWeight: 600, color, marginLeft: 4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ActivityHeatmap({ heatmap }: { heatmap: Record<string, number> }) {
  const maxKm = Math.max(...Object.values(heatmap), 1)
  const today = new Date()
  const startDay = new Date(today)
  startDay.setDate(today.getDate() - 364)
  while (startDay.getDay() !== 1) startDay.setDate(startDay.getDate() - 1)
  const weeks: { date: string; km: number }[][] = []
  let week: { date: string; km: number }[] = []
  const cur = new Date(startDay)
  while (cur <= today) {
    const key = cur.toISOString().slice(0, 10)
    week.push({ date: key, km: heatmap[key] ?? -1 })
    if (week.length === 7) { weeks.push(week); week = [] }
    cur.setDate(cur.getDate() + 1)
  }
  if (week.length) weeks.push(week)
  function cellColor(km: number) {
    if (km < 0) return 'rgba(255,255,255,0.03)'
    if (km === 0) return 'rgba(255,255,255,0.04)'
    const intensity = Math.min(km / maxKm, 1)
    if (intensity < 0.25) return 'rgba(59,130,246,0.25)'
    if (intensity < 0.5) return 'rgba(59,130,246,0.5)'
    if (intensity < 0.75) return 'rgba(59,130,246,0.75)'
    return '#3b82f6'
  }
  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((w, i) => {
    const d = new Date(w[0].date)
    if (d.getDate() <= 7) monthLabels.push({ label: d.toLocaleDateString('de-DE', { month: 'short' }), col: i })
  })
  const DAY = ['Mo', '', 'Mi', '', 'Fr', '', 'So']
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        <div style={{ width: 20 }} />
        {weeks.map((_, i) => {
          const ml = monthLabels.find(m => m.col === i)
          return <div key={i} style={{ width: 12, fontSize: 9, color: t.muted, textAlign: 'center', flexShrink: 0 }}>{ml?.label ?? ''}</div>
        })}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4 }}>
          {DAY.map((l, i) => <div key={i} style={{ height: 12, fontSize: 9, color: t.muted, lineHeight: '12px', width: 16 }}>{l}</div>)}
        </div>
        {weeks.map((wk, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {wk.map((day, di) => (
              <div key={di} title={day.km >= 0 ? `${day.date}: ${day.km.toFixed(1)} km` : day.date}
                style={{ width: 12, height: 12, borderRadius: 2, background: cellColor(day.km) }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 10, color: t.muted }}>Weniger</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: cellColor(v * maxKm || (v > 0 ? 1 : 0)) }} />
        ))}
        <span style={{ fontSize: 10, color: t.muted }}>Mehr</span>
      </div>
    </div>
  )
}

function WeeklyLoadChart({ data }: { data: { label: string; km: number; rides: number; elevation: number }[] }) {
  const maxKm = Math.max(...data.map(d => d.km), 1)
  const nonZero = data.filter(d => d.km > 0)
  const avgKm = nonZero.length ? Math.round(nonZero.reduce((s, d) => s + d.km, 0) / nonZero.length) : 0
  const cur = data[data.length - 1]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 6 }}>
        {data.map((w, i) => {
          const isCurrent = i === data.length - 1
          const pct = (w.km / maxKm) * 100
          return (
            <div key={i} title={`${w.label}: ${w.km} km, ${w.rides} Fahrten`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              {w.km > 0 && <div style={{ fontSize: 9, color: isCurrent ? t.accent : t.muted, fontWeight: isCurrent ? 700 : 400 }}>{w.km}</div>}
              <div style={{
                width: '100%', height: `${Math.max(pct, w.km > 0 ? 3 : 0)}%`, minHeight: w.km > 0 ? 3 : 0,
                background: isCurrent ? `linear-gradient(180deg,${t.accent},#1d4ed8)` : w.km > avgKm ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.25)',
                borderRadius: '4px 4px 2px 2px',
              }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {data.map((w, i) => (
          <div key={i} style={{ flex: 1, fontSize: 8, color: i === data.length - 1 ? t.accent : t.muted, textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {i % 2 === 0 || i === data.length - 1 ? w.label : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: t.muted }}>
        <span>Ø {avgKm} km/Woche</span>
        <span>Diese Woche: <strong style={{ color: t.white }}>{cur.km} km</strong></span>
      </div>
    </div>
  )
}

function SpeedDistribution({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(...buckets.map(b => b.count), 1)
  const total = buckets.reduce((s, b) => s + b.count, 0)
  const colors = ['#6b7a96', '#14b8a6', '#3b82f6', '#a855f7', '#f97316', '#f43f5e']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {buckets.map((b, i) => {
        const pct = total > 0 ? Math.round((b.count / total) * 100) : 0
        return (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 60, fontSize: 11, color: t.muted, textAlign: 'right', flexShrink: 0 }}>{b.label} km/h</div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(b.count / max) * 100}%`, background: colors[i] ?? t.accent, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                {pct > 5 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{pct}%</span>}
              </div>
            </div>
            <div style={{ width: 28, fontSize: 11, color: t.muted, textAlign: 'right', flexShrink: 0 }}>{b.count}</div>
          </div>
        )
      })}
    </div>
  )
}

function HrZones({ zones }: { zones: { label: string; count: number; color: string }[] }) {
  const total = zones.reduce((s, z) => s + z.count, 0)
  if (total === 0) return <div style={{ color: t.muted, fontSize: 13 }}>Keine Herzfrequenzdaten vorhanden.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ height: 20, borderRadius: 10, overflow: 'hidden', display: 'flex', gap: 1 }}>
        {zones.map(z => z.count > 0 ? <div key={z.label} title={`${z.label}: ${z.count}`} style={{ flex: z.count, background: z.color }} /> : null)}
      </div>
      {zones.map(z => {
        const pct = Math.round((z.count / total) * 100)
        return (
          <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: z.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: t.text }}>{z.label}</div>
            <div style={{ fontSize: 12, color: t.muted }}>{z.count}</div>
            <div style={{ width: 34, fontSize: 12, fontWeight: 700, color: z.count > 0 ? z.color : t.muted, textAlign: 'right' }}>{pct}%</div>
          </div>
        )
      })}
    </div>
  )
}

function SportBreakdown({ data }: { data: Record<string, { count: number; km: number }> }) {
  const entries = Object.entries(data).sort((a, b) => b[1].count - a[1].count)
  const totalCount = entries.reduce((s, [, v]) => s + v.count, 0)
  const svgColors = [t.accent, t.purple, t.yellow, t.green, t.teal, t.orange, t.red]
  const size = 100, cx = 50, cy = 50, r = 38, stroke = 14
  const circ = 2 * Math.PI * r
  let off = 0
  const slices = entries.map(([label, v], i) => {
    const pct = v.count / totalCount
    const dash = pct * circ
    const s = { label, pct, dash, gap: circ - dash, offset: off, color: svgColors[i % svgColors.length] }
    off += dash
    return s
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {slices.map(s => (
          <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset + circ * 0.25}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fill={t.white} fontSize="14" fontWeight="800">{totalCount}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill={t.muted} fontSize="8">Aktivitäten</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {slices.slice(0, 6).map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: t.text }}>{s.label}</div>
            <div style={{ fontSize: 11, color: t.muted }}>{Math.round(s.pct * 100)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────────── Bike Extras ───────────── */
interface BikeExtra {
  photo?: string
  nickname?: string
  frameMaterial?: string
  frameSize?: string
  groupset?: string
  drivetrain?: string
  brakes?: string
  wheelset?: string
  tireSize?: string
  weightKg?: string
  purchaseYear?: string
  priceEur?: string
  useCase?: string[]
  notes?: string
}

const USE_CASES = ['Road', 'Training', 'Rennen', 'Gravel', 'Commute', 'Indoor']
const FRAME_OPTIONS = ['Carbon', 'Aluminium', 'Stahl', 'Titan', 'Sonstiges']
const DRIVETRAIN_OPTIONS = ['1x', '2x']
const BRAKE_OPTIONS = ['Scheibe Hydraulisch', 'Scheibe Mechanisch', 'Felge']

const LS_KEY = 'bike-extras'
function loadExtras(): Record<string, BikeExtra> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}
function saveExtras(data: Record<string, BikeExtra>) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function BikeModal({ bikeId, bikeName, bikeKm, bikeColor, initialData, onSave, onClose }: {
  bikeId: string; bikeName: string; bikeKm: number; bikeColor: string
  initialData: BikeExtra; onSave: (data: BikeExtra) => void; onClose: () => void
}) {
  const [draft, setDraft] = useState<BikeExtra>(initialData)
  const fileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof BikeExtra>(key: K, value: BikeExtra[K]) {
    setDraft(d => ({ ...d, [key]: value }))
  }
  function toggleUse(u: string) {
    const cur = draft.useCase ?? []
    set('useCase', cur.includes(u) ? cur.filter(x => x !== u) : [...cur, u])
  }
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => set('photo', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
    background: t.card2, border: `1px solid ${t.border}`, borderRadius: 8,
    color: t.white, padding: '9px 12px', fontSize: 13, width: '100%',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', ...style,
  })
  const lbl = (): React.CSSProperties => ({
    fontSize: 11, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: t.muted, display: 'block', marginBottom: 6,
  })
  const chip = (active: boolean, color = t.accent): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: `1px solid ${active ? color : t.border}`,
    background: active ? `${color}20` : 'transparent', color: active ? color : t.muted,
  })

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${t.border}`, paddingBottom: 16, position: 'sticky', top: 0, background: t.bg2, zIndex: 1, borderRadius: '18px 18px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: bikeColor, marginBottom: 4 }}>Bike konfigurieren</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: t.white }}>{bikeName}</h3>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{bikeKm.toLocaleString('de-DE')} km gefahren</div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.muted, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Photo upload */}
          <div>
            <label style={lbl()}>📷 Foto</label>
            <div onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${draft.photo ? bikeColor : t.border}`, borderRadius: 12, minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', background: t.card }}>
              {draft.photo
                ? <img src={draft.photo} alt="Bike" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', color: t.muted }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>📸</div>
                    <div style={{ fontSize: 13 }}>Foto hochladen</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG, WEBP</div>
                  </div>}
              {draft.photo && (
                <button onClick={e => { e.stopPropagation(); set('photo', undefined) }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Entfernen</button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>

          {/* Nickname */}
          <div>
            <label style={lbl()}>🏷 Spitzname</label>
            <input style={inp()} placeholder={bikeName} value={draft.nickname ?? ''} onChange={e => set('nickname', e.target.value)} />
          </div>

          {/* Row: Frame material + size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl()}>🏗 Rahmenmaterial</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FRAME_OPTIONS.map(o => (
                  <button key={o} style={chip(draft.frameMaterial === o, t.accent)} onClick={() => set('frameMaterial', draft.frameMaterial === o ? undefined : o)}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl()}>📐 Rahmengröße</label>
              <input style={inp()} placeholder="z.B. 54cm oder M" value={draft.frameSize ?? ''} onChange={e => set('frameSize', e.target.value)} />
            </div>
          </div>

          {/* Groupset */}
          <div>
            <label style={lbl()}>⚙️ Schaltgruppe</label>
            <input style={inp()} placeholder="z.B. Shimano Dura-Ace 12-fach" value={draft.groupset ?? ''} onChange={e => set('groupset', e.target.value)} />
          </div>

          {/* Drivetrain + Brakes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl()}>🔧 Antrieb</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {DRIVETRAIN_OPTIONS.map(o => (
                  <button key={o} style={chip(draft.drivetrain === o, t.purple)} onClick={() => set('drivetrain', draft.drivetrain === o ? undefined : o)}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl()}>🛑 Bremsen</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BRAKE_OPTIONS.map(o => (
                  <button key={o} style={chip(draft.brakes === o, t.orange)} onClick={() => set('brakes', draft.brakes === o ? undefined : o)}>{o}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Wheels + Tire size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl()}>🔵 Laufräder</label>
              <input style={inp()} placeholder="z.B. Zipp 303 Firecrest" value={draft.wheelset ?? ''} onChange={e => set('wheelset', e.target.value)} />
            </div>
            <div>
              <label style={lbl()}>🔲 Reifenbreite</label>
              <input style={inp()} placeholder="z.B. 28c oder 40c" value={draft.tireSize ?? ''} onChange={e => set('tireSize', e.target.value)} />
            </div>
          </div>

          {/* Weight + Year + Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl()}>⚖️ Gewicht (kg)</label>
              <input style={inp()} type="number" step="0.1" placeholder="7.8" value={draft.weightKg ?? ''} onChange={e => set('weightKg', e.target.value)} />
            </div>
            <div>
              <label style={lbl()}>📅 Kaufjahr</label>
              <input style={inp()} type="number" placeholder="2023" min={1990} max={2030} value={draft.purchaseYear ?? ''} onChange={e => set('purchaseYear', e.target.value)} />
            </div>
            <div>
              <label style={lbl()}>💶 Preis (€)</label>
              <input style={inp()} type="number" placeholder="3499" value={draft.priceEur ?? ''} onChange={e => set('priceEur', e.target.value)} />
            </div>
          </div>

          {/* Use case */}
          <div>
            <label style={lbl()}>🎯 Verwendung (Mehrfach)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {USE_CASES.map(u => (
                <button key={u} style={chip(!!(draft.useCase ?? []).includes(u), t.green)} onClick={() => toggleUse(u)}>{u}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl()}>📝 Notizen & Umbauten</label>
            <textarea style={{ ...inp(), minHeight: 90, resize: 'vertical' }} placeholder="z.B. Sattel getauscht, Power Meter verbaut..." value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={() => { onSave(draft) }} style={{ flex: 1, padding: '12px', background: `linear-gradient(90deg,${t.accent},#2563eb)`, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>💾 Speichern</button>
            <button onClick={onClose} style={{ padding: '12px 20px', background: 'transparent', border: `1px solid ${t.border}`, color: t.muted, borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${t.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: t.muted, fontSize: 14 }}>Strava-Daten werden geladen…</div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export default function MeinBereichPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [bikeExtras, setBikeExtras] = useState<Record<string, BikeExtra>>({})
  const [editBikeId, setEditBikeId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    setAuthed(true)
    setBikeExtras(loadExtras())
  }, [router])

  const DATA_URL = process.env.NEXT_PUBLIC_DATA_URL ?? '/api/strava/dashboard'

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' })
      if (!res.ok) throw new Error(`API-Fehler ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json); setError(null); setLastUpdated(new Date()); setCountdown(60)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchDashboard()
    intervalRef.current = setInterval(fetchDashboard, 60_000)
    cdRef.current = setInterval(() => setCountdown(c => Math.max(c - 1, 0)), 1_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (cdRef.current) clearInterval(cdRef.current)
    }
  }, [authed, fetchDashboard])

  if (authed === null || loading) return <Spinner />
  if (error) return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: t.white }}>⚠️ Strava-Fehler</div>
      <div style={{ fontSize: 14, color: t.muted, maxWidth: 400, textAlign: 'center' }}>{error}</div>
      <button onClick={fetchDashboard} style={{ padding: '10px 20px', background: t.accent, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>Nochmal versuchen</button>
    </div>
  )
  if (!data) return null

  const { athlete, stats, heatmap, weeklyLoad, sportBreakdown, speedBuckets, hrZones, streak, records, monthlyKm, recentActivities } = data
  const ytdGoalKm = 8000
  const ytdPct = Math.min((stats.ytd.km / ytdGoalKm) * 100, 100).toFixed(0)
  const maxMonthKm = Math.max(...monthlyKm.map(m => m.km), 1)

  return (
    <div style={{ fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", background: t.bg, color: t.text, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', fontSize: 14 }}>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,13,24,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${t.border}`, height: 52, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px', width: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: t.muted, fontSize: 12 }}>← Karte</Link>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: t.white }}>🚴 {athlete.name}</span>
            {athlete.premium && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#FC4C02', color: '#fff' }}>SUMMIT</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: t.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.green, display: 'inline-block', boxShadow: `0 0 6px ${t.green}` }} />
                Live · {countdown}s
              </span>
            )}
            <button onClick={() => fetchDashboard()} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.2)`, color: t.accent, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ↻ Aktualisieren
            </button>
            <button onClick={() => { logout(); router.push('/') }} style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${t.border}`, color: t.muted, borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <section style={{ background: `linear-gradient(160deg,#0c1e38 0%,${t.bg} 70%)`, padding: '36px 0 28px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, background: `linear-gradient(135deg,#1e3a6e,${t.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff', boxShadow: `0 0 0 3px ${t.bg},0 0 0 5px rgba(59,130,246,0.4)` }}>
              {athlete.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 900, color: t.white }}>{athlete.name}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 6 }}>
                {([
                  `📍 ${athlete.city}, ${athlete.country}`,
                  `📅 Dabei seit ${athlete.memberSince}`,
                  `👥 ${athlete.followers} Follower`,
                  athlete.weight ? `⚖️ ${athlete.weight} kg` : null,
                  `🏅 ${stats.allTime.count} Aktivitäten gesamt`,
                ] as (string | null)[]).filter((x): x is string => x !== null).map(m => <span key={m} style={{ fontSize: 12, color: t.muted }}>{m}</span>)}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <a href="https://www.strava.com" target="_blank" rel="noopener" style={{ padding: '7px 14px', background: '#FC4C02', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Strava 🏃</a>
              <Link href="/viking-bike-challenge" style={{ padding: '7px 14px', background: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.2)`, color: t.accent, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Viking Bike →</Link>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 20px 80px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 32 }}>
          <StatPill value={stats.ytd.km.toLocaleString('de-DE')} unit="km" label="Kilometer YTD" color={t.accent} sub={`Ziel: ${ytdGoalKm.toLocaleString('de-DE')} km (${ytdPct}%)`} />
          <StatPill value={stats.ytd.count} unit="Fahrten" label="Aktivitäten YTD" color={t.green} />
          <StatPill value={stats.ytd.hours} unit="h" label="Stunden YTD" color={t.purple} />
          <StatPill value={(stats.ytd.elevation / 1000).toFixed(1)} unit="km ↑" label="Höhenmeter YTD" color={t.yellow} />
          <StatPill value={stats.recent.km.toLocaleString('de-DE')} unit="km" label="Letzte 4 Wochen" color={t.orange} sub={`${stats.recent.count} Fahrten`} />
          <StatPill value={stats.allTime.everests} unit="× Everest" label="Alle Höhenmeter" color={t.red} sub={`${stats.allTime.elevation.toLocaleString('de-DE')} m`} />
          <StatPill value={stats.biggestRideKm} unit="km" label="Längste Fahrt je" color={t.teal} />
          <StatPill value={stats.allTime.km.toLocaleString('de-DE')} unit="km" label="Gesamt-km" color={t.accent} sub={`${stats.allTime.count} Fahrten`} />
        </div>

        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.white }}>Jahresziel 2026: {ytdGoalKm.toLocaleString('de-DE')} km</div>
            <div style={{ fontSize: 13, color: t.muted }}>{stats.ytd.km.toLocaleString('de-DE')} km · {ytdPct}%</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${ytdPct}%`, borderRadius: 999, background: `linear-gradient(90deg,${t.accent},#60a5fa)`, position: 'relative' }}>
              <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: `0 0 8px ${t.accent}` }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: t.muted }}>Jan</span>
            <span style={{ fontSize: 10, color: t.muted }}>Dez</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 14, marginBottom: 32 }}>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 6 }}>
            <div style={{ fontSize: 36 }}>🔥</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: streak.current > 0 ? t.orange : t.muted, lineHeight: 1 }}>{streak.current}</div>
            <div style={{ fontSize: 12, color: t.muted }}>Tage in Folge</div>
            <div style={{ width: '100%', height: 1, background: t.border, margin: '8px 0' }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: t.white }}>{streak.longest}</div>
            <div style={{ fontSize: 11, color: t.muted }}>Bestes Streak</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {([
              { icon: '📏', label: 'Längste Fahrt', val: records.longestRide ? `${records.longestRide.km} km` : '—', sub: records.longestRide?.name, color: t.accent },
              { icon: '⛰', label: 'Meiste Höhenmeter', val: records.mostElevation ? `${records.mostElevation.elevation.toLocaleString('de-DE')} m` : '—', sub: records.mostElevation?.name, color: t.yellow },
              { icon: '⚡', label: 'Schnellste Fahrt', val: records.fastestRide ? `${records.fastestRide.kmh} km/h` : '—', sub: records.fastestRide ? `${records.fastestRide.name} (${records.fastestRide.km} km)` : undefined, color: t.green },
              { icon: '😣', label: 'Härteste Fahrt', val: records.mostSuffering ? `${records.mostSuffering.score} Pain` : '—', sub: records.mostSuffering?.name, color: t.red },
            ] as { icon: string; label: string; val: string; sub?: string; color: string }[]).map(r => (
              <div key={r.label} style={{ background: t.card2, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: r.color }}>{r.val}</div>
                {r.sub && <div style={{ fontSize: 11, color: t.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 32 }}>
          <SectionTitle label="Aktivitäten 2025–2026" title="Aktivitäts-Heatmap" />
          <ActivityHeatmap heatmap={heatmap} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24 }}>
            <SectionTitle label="Training" title="Wöchentliche Belastung" />
            <WeeklyLoadChart data={weeklyLoad} />
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24 }}>
            <SectionTitle label="Statistik 2026" title="Monatliche Kilometer" />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, marginBottom: 6 }}>
              {monthlyKm.map((m, i) => {
                const pct = m.km > 0 ? (m.km / maxMonthKm) * 100 : 0
                const isCur = i === new Date().getMonth()
                return (
                  <div key={m.month} title={`${m.month}: ${m.km} km, ${m.rides} Fahrten`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    {m.km > 0 && <div style={{ fontSize: 9, color: isCur ? t.accent : t.muted, fontWeight: 700 }}>{m.km}</div>}
                    <div style={{ width: '100%', height: `${Math.max(pct, m.km > 0 ? 3 : 0)}%`, minHeight: m.km > 0 ? 3 : 0, background: isCur ? `linear-gradient(180deg,${t.accent},#1d4ed8)` : m.km > 0 ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.04)', borderRadius: '4px 4px 2px 2px' }} />
                    <div style={{ fontSize: 9, color: isCur ? t.accent : t.muted, fontWeight: isCur ? 700 : 400 }}>{m.month}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 32 }}>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24 }}>
            <SectionTitle label="Analyse" title="Sport-Verteilung" />
            <SportBreakdown data={sportBreakdown} />
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24 }}>
            <SectionTitle label="Analyse" title="Geschwindigkeit" />
            <SpeedDistribution buckets={speedBuckets} />
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24 }}>
            <SectionTitle label="Kondition" title="Herzfrequenz-Zonen" />
            <HrZones zones={hrZones} />
          </div>
        </div>

        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 32 }}>
          <SectionTitle label="All-time" title="Karriere-Statistiken" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            {([
              { label: 'Gesamte Distanz', val: `${stats.allTime.km.toLocaleString('de-DE')} km`, sub: `≈ ${(stats.allTime.km / 40075).toFixed(2)}× Erdumfang` },
              { label: 'Gesamte Stunden', val: `${stats.allTime.hours.toLocaleString('de-DE')} h`, sub: `${(stats.allTime.hours / 24).toFixed(0)} Tage im Sattel` },
              { label: 'Gesamte Höhenmeter', val: `${stats.allTime.elevation.toLocaleString('de-DE')} m`, sub: `${stats.allTime.everests}× Mount Everest` },
              { label: 'Gesamte Fahrten', val: stats.allTime.count.toLocaleString('de-DE'), sub: `Ø ${(stats.allTime.km / Math.max(stats.allTime.count, 1)).toFixed(0)} km/Fahrt` },
              { label: 'Bikes in Garage', val: String(athlete.bikes.length), sub: athlete.bikes.find((b: { primary: boolean; name: string }) => b.primary)?.name ?? '—' },
            ] as { label: string; val: string; sub: string }[]).map(s => (
              <div key={s.label} style={{ background: t.card2, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: t.white }}>{s.val}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <SectionTitle label="Aktivitäten" title="Letzte Fahrten" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActivities.map(act => {
              const color = SPORT_COLORS[act.sport_type] ?? t.accent
              const icon = SPORT_ICONS[act.sport_type] ?? '🚴'
              return (
                <div key={act.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '3px 0 0 3px' }} />
                  <div style={{ paddingLeft: 6, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span>{icon}</span>
                        <span style={{ fontWeight: 700, color: t.white, fontSize: 14 }}>{act.name}</span>
                        {act.prCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(234,179,8,0.15)', color: t.yellow }}>🏆 {act.prCount} PR</span>}
                        {(act.sufferScore ?? 0) > 100 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(244,63,94,0.12)', color: t.red }}>🔥</span>}
                      </div>
                      <span style={{ fontSize: 11, color: t.muted, flexShrink: 0 }}>{dateFmt(act.date)}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                      {([
                        { v: `${act.km} km`, i: '📏' },
                        { v: durStr(act.durationMin), i: '⏱' },
                        { v: `${act.avgSpeedKmh} km/h`, i: '⚡' },
                        ...(act.elevation > 0 ? [{ v: `${act.elevation.toLocaleString('de-DE')}m`, i: '⛰' }] : []),
                        ...(act.avgHr ? [{ v: `${act.avgHr} bpm`, i: '❤️' }] : []),
                        ...(act.watts ? [{ v: `${act.watts}W`, i: '💪' }] : []),
                        ...(act.sufferScore ? [{ v: `${act.sufferScore}`, i: '😣' }] : []),
                        ...(act.kudos > 0 ? [{ v: `${act.kudos}`, i: '👍' }] : []),
                      ] as { v: string; i: string }[]).map(s => (
                        <span key={s.i + s.v} style={{ fontSize: 12, color: t.text, display: 'flex', alignItems: 'center', gap: 4 }}>{s.i} {s.v}</span>
                      ))}
                    </div>
                  </div>
                  <a href={`https://www.strava.com/activities/${act.id}`} target="_blank" rel="noopener"
                    style={{ fontSize: 11, color: t.muted, border: `1px solid ${t.border}`, padding: '4px 10px', borderRadius: 7, flexShrink: 0 }}>Strava ↗</a>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
            <SectionTitle label="Garage" title="Meine Bikes" />
            <div style={{ fontSize: 11, color: t.muted, marginBottom: 24 }}>Klicke auf «Bearbeiten» um Fotos & Details hinzuzufügen</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {athlete.bikes.map((bike: { id: string; name: string; brand: string; model: string; km: number; primary: boolean }, i: number) => {
              const color = ([t.accent, t.purple, t.yellow, t.green] as string[])[i % 4]
              const extra = bikeExtras[bike.id] ?? {}
              const displayName = extra.nickname || bike.name || `${bike.brand} ${bike.model}`
              const kmPct = Math.min((bike.km / 20000) * 100, 100)
              const kmColor = bike.km > 15000 ? t.red : bike.km > 8000 ? t.orange : color
              const specs: { icon: string; label: string; value: string }[] = [
                ...(extra.frameMaterial ? [{ icon: '🏗', label: 'Rahmen', value: extra.frameMaterial + (extra.frameSize ? ' · ' + extra.frameSize : '') }] : []),
                ...(extra.groupset ? [{ icon: '⚙️', label: 'Schaltgruppe', value: extra.groupset }] : []),
                ...(extra.drivetrain ? [{ icon: '🔧', label: 'Antrieb', value: extra.drivetrain }] : []),
                ...(extra.brakes ? [{ icon: '🛑', label: 'Bremsen', value: extra.brakes }] : []),
                ...(extra.wheelset ? [{ icon: '🔵', label: 'Laufräder', value: extra.wheelset }] : []),
                ...(extra.tireSize ? [{ icon: '🔲', label: 'Reifen', value: extra.tireSize }] : []),
                ...(extra.weightKg ? [{ icon: '⚖️', label: 'Gewicht', value: extra.weightKg + ' kg' }] : []),
                ...(extra.purchaseYear ? [{ icon: '📅', label: 'Kaufjahr', value: extra.purchaseYear + (extra.priceEur ? ' · ' + Number(extra.priceEur).toLocaleString('de-DE') + ' €' : '') }] : []),
              ]
              return (
                <div key={bike.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Photo */}
                  {extra.photo
                    ? <img src={extra.photo} alt={displayName} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                    : (
                      <div onClick={() => setEditBikeId(bike.id)} style={{ width: '100%', height: 100, background: `linear-gradient(135deg,${color}18,${color}05)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderBottom: `1px solid ${t.border}`, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                        <div style={{ textAlign: 'center', color: t.muted }}>
                          <div style={{ fontSize: 28 }}>🚲</div>
                          <div style={{ fontSize: 11, marginTop: 4 }}>Foto hinzufügen</div>
                        </div>
                      </div>
                    )}
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: t.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                        <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{bike.brand} {bike.model}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                        {bike.primary && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${color}20`, color }}>Primär</span>}
                      </div>
                    </div>

                    {/* Use case badges */}
                    {(extra.useCase ?? []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(extra.useCase ?? []).map(u => (
                          <span key={u} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${t.green}15`, color: t.green }}>{u}</span>
                        ))}
                      </div>
                    )}

                    {/* KM progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: t.muted }}>Gefahrene Kilometer</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: t.white }}>{bike.km.toLocaleString('de-DE')} km</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 7, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${kmPct}%`, background: `linear-gradient(90deg,${kmColor},${kmColor}cc)`, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>
                        {bike.km > 15000 ? '⚠️ Wartung empfohlen' : bike.km > 8000 ? '🔄 Bald Wartung' : '✅ In gutem Zustand'} · Basis: 20.000 km
                      </div>
                    </div>

                    {/* Spec grid */}
                    {specs.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {specs.map(s => (
                          <div key={s.label} style={{ background: t.card2, borderRadius: 8, padding: '8px 10px' }}>
                            <div style={{ fontSize: 10, color: t.muted, marginBottom: 2 }}>{s.icon} {s.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: t.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {extra.notes && (
                      <div style={{ background: t.card2, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: t.text, lineHeight: 1.5 }}>
                        <span style={{ color: t.muted, marginRight: 6 }}>📝</span>{extra.notes}
                      </div>
                    )}

                    {/* Edit button */}
                    <button onClick={() => setEditBikeId(bike.id)}
                      style={{ marginTop: 'auto', padding: '10px', background: `${color}12`, border: `1px solid ${color}30`, color, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', width: '100%' }}>
                      ✏️ {specs.length > 0 ? 'Details bearbeiten' : 'Details ausfüllen'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bike modal */}
          {editBikeId && (() => {
            const bike = athlete.bikes.find((b: { id: string }) => b.id === editBikeId)
            if (!bike) return null
            const i = athlete.bikes.indexOf(bike)
            const color = ([t.accent, t.purple, t.yellow, t.green] as string[])[i % 4]
            return (
              <BikeModal
                bikeId={bike.id}
                bikeName={bikeExtras[bike.id]?.nickname || bike.name || `${bike.brand} ${bike.model}`}
                bikeKm={bike.km}
                bikeColor={color}
                initialData={bikeExtras[bike.id] ?? {}}
                onSave={d => {
                  const next = { ...bikeExtras, [bike.id]: d }
                  setBikeExtras(next)
                  saveExtras(next)
                  setEditBikeId(null)
                }}
                onClose={() => setEditBikeId(null)}
              />
            )
          })()}
        </div>
      </div>

      <footer style={{ padding: '20px 0', borderTop: `1px solid ${t.border}`, textAlign: 'center', color: t.muted, fontSize: 11 }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px' }}>
          {lastUpdated && `Zuletzt: ${lastUpdated.toLocaleTimeString('de-DE')} · `}
          {data.totalActivitiesLoaded} Aktivitäten via Strava API ·{' '}
          <Link href="/" style={{ color: t.muted }}>NordCup Karte</Link>
          {' · '}
          <Link href="/viking-bike-challenge" style={{ color: t.muted }}>Viking Bike Challenge</Link>
        </div>
      </footer>
    </div>
  )
}
