'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, logout } from '@/lib/auth'

/* ─── Design tokens ─────────────────────────────────────────────────── */
const c = {
  bg: '#04080f', bg2: '#070e1a', card: '#0a1525', card2: '#0d1c30',
  border: 'rgba(99,179,255,0.08)', white: '#e8f4ff', text: '#b0cce8',
  muted: '#4a6080', accent: '#38bdf8', accent2: '#6366f1',
  green: '#34d399', red: '#f87171', orange: '#fb923c',
  purple: '#a78bfa', yellow: '#fbbf24', teal: '#2dd4bf', pink: '#f472b6',
}

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

const LS_BIKE = 'bike-extras-v2'
interface BikeExtra { photo?: string; nickname?: string; frameMaterial?: string; frameSize?: string; groupset?: string; drivetrain?: string; brakes?: string; wheelset?: string; tireSize?: string; weightKg?: string; purchaseYear?: string; priceEur?: string; useCase?: string[]; notes?: string }
const loadExtras = (): Record<string, BikeExtra> => { try { return JSON.parse(localStorage.getItem(LS_BIKE) ?? '{}') } catch { return {} } }
const saveExtras = (d: Record<string, BikeExtra>) => localStorage.setItem(LS_BIKE, JSON.stringify(d))

/* ─── Hooks ──────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, delay = 0): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf: number, start: number | null = null
    const t = setTimeout(() => {
      raf = requestAnimationFrame(function step(ts) {
        if (!start) start = ts
        const progress = Math.min((ts - start) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        setVal(Math.round(ease * target))
        if (progress < 1) raf = requestAnimationFrame(step)
      })
    }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [target, duration, delay])
  return val
}

function useInView(ref: React.RefObject<Element | null>): boolean {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

/* ─── Global CSS (injected once) ─────────────────────────────────────── */
const GLOBAL_CSS = `
@keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-60px) scale(1.1)} 66%{transform:translate(-30px,40px) scale(0.95)} }
@keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,30px) scale(1.05)} 66%{transform:translate(60px,-40px) scale(1.1)} }
@keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-50px)} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes spinReverse { to{transform:rotate(-360deg)} }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.05)} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 6px #38bdf8,0 0 12px #38bdf880} 50%{box-shadow:0 0 14px #38bdf8,0 0 28px #38bdf8,0 0 40px #38bdf840} }
@keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideLeft { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
@keyframes barFill { from{width:0} }
@keyframes shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
@keyframes countGlow { 0%,100%{text-shadow:none} 50%{text-shadow:0 0 20px #38bdf8,0 0 40px #38bdf880} }
@keyframes borderSpin { to{--angle:360deg} }
@keyframes dash { from{stroke-dashoffset:400} }
@keyframes heatIn { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
@keyframes fireflicker { 0%,100%{transform:scaleY(1) scaleX(1)} 25%{transform:scaleY(1.1) scaleX(.95)} 75%{transform:scaleY(.95) scaleX(1.05)} }
@keyframes typing { from{width:0} to{width:100%} }
@keyframes blink { 50%{opacity:0} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes flipIn { from{transform:rotateY(-90deg);opacity:0} to{transform:rotateY(0);opacity:1} }

.card-flip-inner { transition: transform .7s cubic-bezier(.4,0,.2,1); transform-style: preserve-3d; }
.card-flip:hover .card-flip-inner { transform: rotateY(180deg); }
.card-face { -webkit-backface-visibility:hidden; backface-visibility:hidden; position:absolute; inset:0; }
.card-back { transform: rotateY(180deg); }

.bar-animated { animation: barFill .9s cubic-bezier(.4,0,.2,1) both; }
.slide-up { animation: slideUp .6s cubic-bezier(.4,0,.2,1) both; }
.fade-in { animation: fadeIn .5s ease both; }

* { box-sizing: border-box; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #04080f; } ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
`

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const SPORT_COLORS: Record<string, string> = { Ride: c.accent, GravelRide: c.purple, VirtualRide: c.yellow, MountainBikeRide: c.green, EBikeRide: c.teal }
const SPORT_ICON: Record<string, string> = { Ride: '🚴', GravelRide: '🪨', VirtualRide: '⚡', MountainBikeRide: '🏔️', EBikeRide: '🔋', Run: '🏃', Walk: '🚶' }
const BIKE_COLORS = [c.accent, c.purple, c.yellow, c.green, c.teal, c.pink]

function fmt(n: number, dec = 0) { return n.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) }
function durStr(min: number) { const h = Math.floor(min / 60), m = min % 60; return h > 0 ? `${h}h${m > 0 ? ' ' + m + 'min' : ''}` : `${m}min` }
function dateDE(iso: string) { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) }

/* ─── Components ─────────────────────────────────────────────────────── */

function GlowDot({ color = c.green }: { color?: string }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}, 0 0 12px ${color}80`, animation: 'pulse 2s ease infinite' }} />
}

function SectionLabel({ tag, title, sub }: { tag: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: c.accent, marginBottom: 6 }}>{tag}</div>
      <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem,2.5vw,1.7rem)', fontWeight: 900, color: c.white, lineHeight: 1.2 }}>{title}</h2>
      {sub && <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function AnimNum({ value, unit, dec = 0, color = c.accent, size = '2.4rem', delay = 0 }: { value: number; unit?: string; dec?: number; color?: string; size?: string; delay?: number }) {
  const v = useCountUp(value, 1600, delay)
  return (
    <span style={{ fontSize: size, fontWeight: 900, color: c.white, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
      {dec > 0 ? (v / Math.pow(10, dec)).toFixed(dec) : fmt(v)}
      {unit && <span style={{ fontSize: '0.4em', color, marginLeft: 3, fontWeight: 700 }}>{unit}</span>}
    </span>
  )
}

function GlassCard({ children, style, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
  return (
    <div style={{
      background: `linear-gradient(135deg,rgba(10,21,37,0.95),rgba(13,28,48,0.9))`,
      border: `1px solid ${glow ? glow + '40' : c.border}`,
      borderRadius: 18, backdropFilter: 'blur(20px)',
      boxShadow: glow ? `0 0 0 1px ${glow}20, 0 8px 32px rgba(0,0,0,.4), inset 0 1px 0 ${glow}20` : '0 8px 32px rgba(0,0,0,.3)',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      {glow && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top left, ${glow}08, transparent 60%)`, pointerEvents: 'none' }} />}
      {children}
    </div>
  )
}

function AnimBar({ pct, color, height = 8, delay = 0 }: { pct: number; color: string; height?: number; delay?: number }) {
  const [go, setGo] = useState(false)
  useEffect(() => { const t = setTimeout(() => setGo(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: go ? `${pct}%` : '0%', borderRadius: 999,
        background: `linear-gradient(90deg,${color},${color}cc)`,
        transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 0 8px ${color}60`,
      }} />
    </div>
  )
}

/* ─── Heatmap ──────────────────────────────────────────────────────── */
function HeatmapGrid({ heatmap }: { heatmap: Record<string, number> }) {
  const maxKm = Math.max(...Object.values(heatmap), 1)
  const today = new Date()
  const startDay = new Date(today); startDay.setDate(today.getDate() - 364)
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

  function cellColor(km: number): string {
    if (km < 0) return 'rgba(255,255,255,0.02)'
    if (km === 0) return 'rgba(255,255,255,0.04)'
    const i = km / maxKm
    if (i < 0.2) return 'rgba(56,189,248,0.2)'
    if (i < 0.4) return 'rgba(56,189,248,0.4)'
    if (i < 0.6) return 'rgba(56,189,248,0.65)'
    if (i < 0.8) return 'rgba(56,189,248,0.85)'
    return '#38bdf8'
  }

  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((w, i) => { const d = new Date(w[0].date); if (d.getDate() <= 7) monthLabels.push({ label: d.toLocaleDateString('de-DE', { month: 'short' }), col: i }) })
  const DAYS = ['Mo', '', 'Mi', '', 'Fr', '', 'So']

  const total365 = Object.values(heatmap).filter(v => v > 0).length
  const total365km = Math.round(Object.values(heatmap).reduce((s, v) => s + Math.max(v, 0), 0))

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: c.accent }}>📅 {total365} aktive Tage</div>
        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: c.green }}>🚴 {fmt(total365km)} km in 365 Tagen</div>
        <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: c.yellow }}>🔥 Ø {Math.round(total365km / Math.max(total365, 1))} km/Aktivität</div>
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 2, marginBottom: 4, paddingLeft: 22 }}>
          {weeks.map((_, i) => { const ml = monthLabels.find(m => m.col === i); return <div key={i} style={{ width: 11, fontSize: 8, color: c.muted, flexShrink: 0, textAlign: 'center' }}>{ml?.label ?? ''}</div> })}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>
            {DAYS.map((l, i) => <div key={i} style={{ height: 11, fontSize: 8, color: c.muted, lineHeight: '11px', width: 16 }}>{l}</div>)}
          </div>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {wk.map((day, di) => (
                <div key={di} title={day.km >= 0 ? `${day.date}: ${Math.round(day.km)} km` : day.date}
                  style={{ width: 11, height: 11, borderRadius: 2, background: cellColor(day.km), cursor: day.km > 0 ? 'pointer' : 'default', transition: 'transform .1s', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.5)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, paddingLeft: 22 }}>
          <span style={{ fontSize: 9, color: c.muted }}>Weniger</span>
          {[0, 0.2, 0.5, 0.8, 1].map(v => <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: cellColor(v * maxKm || (v > 0 ? 0.01 : 0)) }} />)}
          <span style={{ fontSize: 9, color: c.muted }}>Mehr</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Day of week radar ─────────────────────────────────────────────── */
function DayRadar({ heatmap }: { heatmap: Record<string, number> }) {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const stats = Array(7).fill(0).map(() => ({ count: 0, km: 0 }))
  Object.entries(heatmap).forEach(([date, km]) => {
    if (km > 0) { let d = new Date(date).getDay(); d = d === 0 ? 6 : d - 1; stats[d].count++; stats[d].km += km }
  })
  const maxKm = Math.max(...stats.map(s => s.km), 1)
  const cx = 80, cy = 80, r = 60
  const points = stats.map((s, i) => {
    const angle = (i / 7) * Math.PI * 2 - Math.PI / 2
    const pct = s.km / maxKm
    return { x: cx + r * pct * Math.cos(angle), y: cy + r * pct * Math.sin(angle), lx: cx + (r + 16) * Math.cos(angle), ly: cy + (r + 16) * Math.sin(angle), label: days[i], km: s.km, count: s.count }
  })
  const polyStr = points.map(p => `${p.x},${p.y}`).join(' ')
  const gridPoints = (frac: number) => stats.map((_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2
    return `${cx + r * frac * Math.cos(a)},${cy + r * frac * Math.sin(a)}`
  }).join(' ')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {[0.25, 0.5, 0.75, 1].map(f => <polygon key={f} points={gridPoints(f)} fill="none" stroke={`rgba(56,189,248,${f * 0.12})`} strokeWidth={1} />)}
        {stats.map((_, i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="rgba(56,189,248,0.08)" strokeWidth={1} /> })}
        <polygon points={polyStr} fill="rgba(56,189,248,0.18)" stroke={c.accent} strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={c.accent} />)}
        {points.map((p, i) => <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fill={c.muted} fontSize={9} fontWeight={600}>{p.label}</text>)}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: s.km === Math.max(...stats.map(x => x.km)) ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '5px 8px', textAlign: 'center', border: `1px solid ${s.km === Math.max(...stats.map(x => x.km)) ? c.accent + '40' : c.border}` }}>
            <div style={{ fontSize: 9, color: c.muted }}>{days[i]}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: c.white }}>{Math.round(s.km)} km</div>
            <div style={{ fontSize: 9, color: c.muted }}>{s.count}×</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Circular goal ring ──────────────────────────────────────────── */
function GoalRing({ pct, km, goal }: { pct: number; km: number; goal: number }) {
  const [p, setP] = useState(0)
  useEffect(() => { const t = setTimeout(() => setP(pct), 300); return () => clearTimeout(t) }, [pct])
  const r = 70, circ = 2 * Math.PI * r
  const dash = (p / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={90} cy={90} r={r} fill="none" stroke="rgba(56,189,248,0.07)" strokeWidth={14} />
          <circle cx={90} cy={90} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={14}
            strokeLinecap="round" strokeDasharray={`${circ}`}
            strokeDashoffset={circ - dash} style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)' }} />
          {/* Tick marks every 10% */}
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2; const x1 = 90 + (r - 8) * Math.cos(a); const y1 = 90 + (r - 8) * Math.sin(a); const x2 = 90 + (r + 2) * Math.cos(a); const y2 = 90 + (r + 2) * Math.sin(a)
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
          })}
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={c.accent} />
              <stop offset="100%" stopColor={c.accent2} />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: c.white, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{Math.round(p)}%</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>von {fmt(goal)} km</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.accent, marginTop: 4 }}>{fmt(km)} km</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[25, 50, 75, 100].map(milestone => (
          <div key={milestone} style={{ width: 36, height: 36, borderRadius: '50%', background: pct >= milestone ? `radial-gradient(circle,${c.accent}40,${c.accent}10)` : 'rgba(255,255,255,0.04)', border: `1px solid ${pct >= milestone ? c.accent + '80' : c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: pct >= milestone ? c.accent : c.muted }}>
            {milestone}%
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Bike Flip Card ─────────────────────────────────────────────────── */
function BikeCard({ bike, extra, color, onEdit }: { bike: Bike; extra: BikeExtra; color: string; onEdit: () => void }) {
  const displayName = extra.nickname || bike.name || `${bike.brand} ${bike.model}`
  const kmPct = Math.min((bike.km / 20000) * 100, 100)
  const health = bike.km > 15000 ? { icon: '⚠️', text: 'Wartung!', col: c.red } : bike.km > 8000 ? { icon: '🔄', text: 'Bald fällig', col: c.orange } : { icon: '✅', text: 'Topzustand', col: c.green }
  const specs = [
    extra.groupset && { icon: '⚙️', v: extra.groupset },
    extra.frameMaterial && { icon: '🏗', v: extra.frameMaterial + (extra.frameSize ? ' ' + extra.frameSize : '') },
    extra.wheelset && { icon: '🔵', v: extra.wheelset },
    extra.weightKg && { icon: '⚖️', v: extra.weightKg + ' kg' },
    extra.brakes && { icon: '🛑', v: extra.brakes },
    extra.tireSize && { icon: '🔲', v: extra.tireSize },
  ].filter(Boolean) as { icon: string; v: string }[]

  return (
    <div className="card-flip" style={{ perspective: 1000, height: 360, cursor: 'pointer', position: 'relative' }}>
      <div className="card-flip-inner" style={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* FRONT */}
        <div className="card-face" style={{ borderRadius: 18, overflow: 'hidden', background: c.card, border: `1px solid ${color}30` }}>
          <div style={{ height: 4, background: `linear-gradient(90deg,${color},${color}66)` }} />
          {extra.photo
            ? <img src={extra.photo} alt={displayName} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
            : <div style={{ height: 160, background: `radial-gradient(ellipse at center,${color}15,transparent 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, cursor: 'pointer' }} onClick={onEdit}>
              <div style={{ fontSize: 48 }}>🚴</div>
              <div style={{ fontSize: 11, color: c.muted }}>Klicken für Foto</div>
            </div>}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: c.white }}>{displayName}</div>
                <div style={{ fontSize: 11, color: c.muted }}>{bike.brand} {bike.model}</div>
              </div>
              {bike.primary && <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: `${color}20`, color, border: `1px solid ${color}40`, flexShrink: 0 }}>PRIMÄR</span>}
            </div>
            {(extra.useCase ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {(extra.useCase ?? []).map(u => <span key={u} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: `${c.green}15`, color: c.green }}>{u}</span>)}
              </div>
            )}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: c.muted }}>Laufleistung</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: c.white }}>{fmt(bike.km)} km</span>
              </div>
              <AnimBar pct={kmPct} color={health.col} height={6} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: health.col }}>{health.icon} {health.text}</span>
              <span style={{ fontSize: 10, color: c.muted, fontStyle: 'italic' }}>Hover für Details →</span>
            </div>
          </div>
        </div>
        {/* BACK */}
        <div className="card-face card-back" style={{ borderRadius: 18, overflow: 'hidden', background: `linear-gradient(135deg,${c.card2},${c.card})`, border: `1px solid ${color}50` }}>
          <div style={{ height: 4, background: `linear-gradient(90deg,${color},${c.accent2})` }} />
          <div style={{ padding: '20px 18px', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: c.white, marginBottom: 4 }}>🔧 Tech-Specs</div>
            {specs.length > 0
              ? specs.map(s => (
                <div key={s.icon} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 10px' }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.v}</span>
                </div>
              ))
              : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: c.muted }}>
                <div style={{ fontSize: 28 }}>📋</div>
                <div style={{ fontSize: 12, textAlign: 'center' }}>Noch keine Specs eingetragen</div>
              </div>}
            {extra.notes && <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: c.text, lineHeight: 1.5, marginTop: 'auto' }}>📝 {extra.notes}</div>}
            <button onClick={onEdit} style={{ marginTop: 'auto', padding: '10px', background: `linear-gradient(90deg,${color}30,${color}10)`, border: `1px solid ${color}50`, color, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, fontFamily: 'inherit' }}>
              ✏️ {specs.length > 0 ? 'Bearbeiten' : 'Ausfüllen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Bike Modal ─────────────────────────────────────────────────────── */
function BikeModal({ bikeId, bikeName, bikeKm, bColor, init, onSave, onClose }: { bikeId: string; bikeName: string; bikeKm: number; bColor: string; init: BikeExtra; onSave: (d: BikeExtra) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<BikeExtra>(init)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof BikeExtra>(k: K, v: BikeExtra[K]) => setDraft(d => ({ ...d, [k]: v }))
  const toggleUse = (u: string) => { const cur = draft.useCase ?? []; set('useCase', cur.includes(u) ? cur.filter(x => x !== u) : [...cur, u]) }
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => set('photo', ev.target?.result as string); r.readAsDataURL(f) }

  const I = (s?: React.CSSProperties): React.CSSProperties => ({ background: c.card2, border: `1px solid ${c.border}`, borderRadius: 8, color: c.white, padding: '9px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit', ...s })
  const L = (): React.CSSProperties => ({ fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: c.muted, display: 'block', marginBottom: 6 })
  const CH = (on: boolean, col = bColor): React.CSSProperties => ({ padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${on ? col : c.border}`, background: on ? `${col}20` : 'transparent', color: on ? col : c.muted, transition: 'all .2s' })

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: c.bg2, border: `1px solid ${bColor}30`, borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp .3s ease' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${c.border}`, position: 'sticky', top: 0, background: c.bg2, borderRadius: '20px 20px 0 0', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: bColor, marginBottom: 4 }}>Bike konfigurieren</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: c.white }}>{bikeName}</h3>
              <div style={{ fontSize: 12, color: c.muted }}>{fmt(bikeKm)} km</div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, borderRadius: 10, padding: '6px 14px', cursor: 'pointer', fontSize: 18, fontFamily: 'inherit' }}>×</button>
          </div>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Photo */}
          <div>
            <label style={L()}>📷 Foto</label>
            <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${draft.photo ? bColor : c.border}`, borderRadius: 14, minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', background: c.card, transition: 'border-color .2s' }}>
              {draft.photo ? <img src={draft.photo} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: c.muted }}><div style={{ fontSize: 28, marginBottom: 6 }}>📸</div><div style={{ fontSize: 13 }}>Foto hochladen</div></div>}
              {draft.photo && <button onClick={e => { e.stopPropagation(); set('photo', undefined) }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>
          <div><label style={L()}>🏷 Spitzname</label><input style={I()} placeholder={bikeName} value={draft.nickname ?? ''} onChange={e => set('nickname', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={L()}>🏗 Rahmen</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{['Carbon', 'Alu', 'Stahl', 'Titan'].map(o => <button key={o} style={CH(draft.frameMaterial === o)} onClick={() => set('frameMaterial', draft.frameMaterial === o ? undefined : o)}>{o}</button>)}</div>
            </div>
            <div><label style={L()}>📐 Größe</label><input style={I()} placeholder="z.B. 54cm" value={draft.frameSize ?? ''} onChange={e => set('frameSize', e.target.value)} /></div>
          </div>
          <div><label style={L()}>⚙️ Schaltgruppe</label><input style={I()} placeholder="z.B. Shimano Dura-Ace 12-fach" value={draft.groupset ?? ''} onChange={e => set('groupset', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={L()}>🔧 Antrieb</label><div style={{ display: 'flex', gap: 5 }}>{['1x', '2x'].map(o => <button key={o} style={CH(draft.drivetrain === o, c.purple)} onClick={() => set('drivetrain', draft.drivetrain === o ? undefined : o)}>{o}</button>)}</div></div>
            <div><label style={L()}>🛑 Bremsen</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{['Scheibe Hyd.', 'Scheibe Mech.', 'Felge'].map(o => <button key={o} style={CH(draft.brakes === o, c.orange)} onClick={() => set('brakes', draft.brakes === o ? undefined : o)}>{o}</button>)}</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={L()}>🔵 Laufräder</label><input style={I()} placeholder="z.B. Zipp 303" value={draft.wheelset ?? ''} onChange={e => set('wheelset', e.target.value)} /></div>
            <div><label style={L()}>🔲 Reifen</label><input style={I()} placeholder="z.B. 28c" value={draft.tireSize ?? ''} onChange={e => set('tireSize', e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={L()}>⚖️ Gewicht (kg)</label><input style={I()} type="number" step="0.1" value={draft.weightKg ?? ''} onChange={e => set('weightKg', e.target.value)} /></div>
            <div><label style={L()}>📅 Kaufjahr</label><input style={I()} type="number" placeholder="2023" value={draft.purchaseYear ?? ''} onChange={e => set('purchaseYear', e.target.value)} /></div>
            <div><label style={L()}>💶 Preis (€)</label><input style={I()} type="number" placeholder="3500" value={draft.priceEur ?? ''} onChange={e => set('priceEur', e.target.value)} /></div>
          </div>
          <div><label style={L()}>🎯 Verwendung</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{['Road', 'Training', 'Rennen', 'Gravel', 'Commute', 'Indoor', 'Bergauf', 'TT'].map(u => <button key={u} style={CH(!!(draft.useCase ?? []).includes(u), c.green)} onClick={() => toggleUse(u)}>{u}</button>)}</div></div>
          <div><label style={L()}>📝 Notizen & Umbauten</label><textarea style={{ ...I(), minHeight: 80, resize: 'vertical' } as React.CSSProperties} placeholder="Power Meter, Sattel, Bar Tape..." value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onSave(draft)} style={{ flex: 1, padding: 12, background: `linear-gradient(90deg,${bColor},${c.accent2})`, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', boxShadow: `0 4px 20px ${bColor}40` }}>💾 Speichern</button>
            <button onClick={onClose} style={{ padding: '12px 20px', background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, borderRadius: 12, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Fun Facts ──────────────────────────────────────────────────────── */
function FunFacts({ stats }: { stats: DashboardData['stats'] }) {
  const km = stats.allTime.km
  const h = stats.allTime.hours
  const elev = stats.allTime.elevation
  const facts = [
    { icon: '🌍', label: 'Erdumrundungen', value: (km / 40075).toFixed(2), unit: '×', color: c.accent },
    { icon: '✈️', label: 'Strecke München → NYC', value: Math.floor(km / 6100), unit: '× Hin+Zurück', color: c.purple },
    { icon: '🏔️', label: 'Mount Everest', value: Math.floor(elev / 8849), unit: '× bestiegen', color: c.yellow },
    { icon: '⏰', label: 'Tage im Sattel', value: Math.round(h / 24), unit: 'Tage', color: c.green },
    { icon: '🔥', label: 'Verbrannte Kalorien', value: Math.round(km * 35 / 1000), unit: 'Mio. kcal', color: c.orange },
    { icon: '🌱', label: 'CO₂ gespart vs Auto', value: Math.round(km * 0.12), unit: 'kg CO₂', color: c.teal },
    { icon: '🍕', label: 'Pizzen verdient (800kcal)', value: Math.round(km * 35 / 800), unit: 'Pizzen', color: c.red },
    { icon: '🌙', label: 'Mondentfernung', value: ((km / 384400) * 100).toFixed(4), unit: '% erreicht', color: c.pink },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
      {facts.map((f, i) => (
        <div key={f.label} style={{ background: `linear-gradient(135deg,${c.card},${c.card2})`, border: `1px solid ${f.color}20`, borderRadius: 14, padding: '16px 18px', animation: `slideUp .4s ${i * 0.06}s both`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right, ${f.color}0a, transparent 60%)` }} />
          <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
          <div style={{ fontSize: 10, color: c.muted, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{f.label}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: f.color, lineHeight: 1 }}>{f.value}</div>
          <div style={{ fontSize: 10, color: c.muted, marginTop: 2 }}>{f.unit}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main page spinner ──────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ position: 'relative', width: 60, height: 60 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${c.accent}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `2px solid ${c.accent2}`, borderBottomColor: 'transparent', animation: 'spinReverse 1.1s linear infinite' }} />
      </div>
      <div style={{ color: c.muted, fontSize: 13, letterSpacing: '1px' }}>STRAVA-DATEN LADEN…</div>
      <style>{GLOBAL_CSS}</style>
    </div>
  )
}

/* ═══ MAIN PAGE ════════════════════════════════════════════════════════ */
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
  const iRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const DATA_URL = process.env.NEXT_PUBLIC_DATA_URL ?? '/api/strava/dashboard'

  useEffect(() => { if (!isAuthenticated()) { router.replace('/login'); return }; setAuthed(true); setBikeExtras(loadExtras()) }, [router])

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json); setError(null); setLastUpdated(new Date()); setCountdown(60)
    } catch (e) { setError(e instanceof Error ? e.message : 'Fehler') } finally { setLoading(false) }
  }, [DATA_URL])

  useEffect(() => {
    if (!authed) return
    fetchDashboard()
    iRef.current = setInterval(fetchDashboard, 60_000)
    cdRef.current = setInterval(() => setCountdown(x => Math.max(x - 1, 0)), 1000)
    return () => { if (iRef.current) clearInterval(iRef.current); if (cdRef.current) clearInterval(cdRef.current) }
  }, [authed, fetchDashboard])

  if (authed === null || loading) return <Spinner />
  if (error) return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, fontFamily: 'Inter,system-ui,sans-serif' }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: c.white }}>{error}</div>
      <button onClick={fetchDashboard} style={{ padding: '10px 24px', background: c.accent, color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit' }}>Retry</button>
    </div>
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
    <div style={{ fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", background: c.bg, color: c.text, minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 54, background: 'rgba(4,8,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', width: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: c.muted, fontSize: 12, textDecoration: 'none' }}>← Karte</Link>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: c.white }}>🚴 {athlete.name}</span>
            {athlete.premium && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#FC4C02', color: '#fff' }}>SUMMIT</span>}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {lastUpdated && <span style={{ fontSize: 11, color: c.muted, display: 'flex', alignItems: 'center', gap: 6 }}><GlowDot />{countdown}s</span>}
            <button onClick={fetchDashboard} style={{ padding: '5px 12px', background: `${c.accent}15`, border: `1px solid ${c.accent}30`, color: c.accent, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>↻</button>
            <button onClick={() => { logout(); router.push('/') }} style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${c.border}`, color: c.muted, borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Logout</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '52px 20px 44px', background: `linear-gradient(180deg,#060e1e 0%,${c.bg} 100%)` }}>
        {/* floating orbs */}
        {[[c.accent, -60, -40, 300, 300, 'float1 18s ease infinite'], [c.accent2, '80%', 20, 250, 250, 'float2 22s ease infinite -5s'], [c.purple, '50%', '60%', 180, 180, 'float3 15s ease infinite -8s']].map(([col, l, t, w, h, anim], i) => (
          <div key={i} style={{ position: 'absolute', left: l as string | number, top: t as string | number, width: w as number, height: h as number, borderRadius: '50%', background: `radial-gradient(circle,${col}15,transparent 70%)`, animation: anim as string, pointerEvents: 'none' }} />
        ))}
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg,#1a3d6e,${c.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff', boxShadow: `0 0 0 3px ${c.bg},0 0 0 5px ${c.accent}50, 0 0 30px ${c.accent}30`, animation: 'pulseGlow 3s ease infinite', flexShrink: 0 }}>
              {athlete.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: c.white, lineHeight: 1.1 }}>{athlete.name}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                {[`📍 ${athlete.city}`, `📅 seit ${athlete.memberSince}`, `👥 ${athlete.followers}`, `🚴 ${stats.allTime.count} Rides`].map(t => (
                  <span key={t} style={{ fontSize: 12, color: c.muted, display: 'flex', alignItems: 'center', gap: 4 }}>{t}</span>
                ))}
              </div>
            </div>
            {/* Big KM ring inline */}
            <GoalRing pct={ytdPct} km={stats.ytd.km} goal={ytdGoal} />
          </div>

          {/* Quick stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginTop: 32 }}>
            {([
              { l: 'YTD Kilometer', v: stats.ytd.km, u: 'km', col: c.accent, d: 0 },
              { l: 'YTD Stunden', v: stats.ytd.hours, u: 'h', col: c.purple, d: 0 },
              { l: 'YTD Höhenmeter', v: stats.ytd.elevation, u: 'm', col: c.yellow, d: 0 },
              { l: 'YTD Fahrten', v: stats.ytd.count, u: '', col: c.green, d: 0 },
              { l: '4-Wochen km', v: stats.recent.km, u: 'km', col: c.orange, d: 0 },
              { l: 'Gesamt km', v: stats.allTime.km, u: 'km', col: c.teal, d: 0 },
              { l: 'Längste Fahrt', v: stats.biggestRideKm, u: 'km', col: c.pink, d: 0 },
              { l: 'Everests ↑', v: parseFloat(stats.allTime.everests), u: '×', col: c.red, d: 1 },
            ] as { l: string; v: number; u: string; col: string; d: number }[]).map((s, i) => (
              <GlassCard key={s.l} glow={s.col} style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: c.muted, marginBottom: 6 }}>{s.l}</div>
                <AnimNum value={s.v} unit={s.u || undefined} color={s.col} delay={i * 60} />
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAGE TABS ────────────────────────────────────────────────── */}
      <div style={{ background: c.bg2, borderBottom: `1px solid ${c.border}`, position: 'sticky', top: 54, zIndex: 90 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 0 }}>
          {([['stats', '📊 Dashboard'], ['training', '🏋️ Training'], ['garage', '🚲 Garage']] as [typeof activeTab, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab ? c.accent : 'transparent'}`, color: activeTab === tab ? c.accent : c.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ══ STATS TAB ══════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Streak + Records */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, alignItems: 'stretch' }}>
              <GlassCard glow={streak.current > 0 ? c.orange : c.muted} style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 6 }}>
                <div style={{ fontSize: 48, animation: streak.current > 0 ? 'fireflicker 1s ease infinite' : undefined }}>🔥</div>
                <AnimNum value={streak.current} color={c.orange} size="3.5rem" />
                <div style={{ fontSize: 11, color: c.muted }}>Tage in Folge</div>
                <div style={{ height: 1, width: '80%', background: c.border, margin: '6px 0' }} />
                <div style={{ fontSize: 20, fontWeight: 900, color: c.white }}>{streak.longest}</div>
                <div style={{ fontSize: 11, color: c.muted }}>Bestes Streak</div>
              </GlassCard>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {([
                  { icon: '📏', t: 'Längste Fahrt', v: records.longestRide ? `${records.longestRide.km} km` : '—', sub: records.longestRide?.name, col: c.accent },
                  { icon: '⛰', t: 'Meiste Höhenmeter', v: records.mostElevation ? `${fmt(records.mostElevation.elevation)} m` : '—', sub: records.mostElevation?.name, col: c.yellow },
                  { icon: '⚡', t: 'Schnellste Fahrt', v: records.fastestRide ? `${records.fastestRide.kmh} km/h` : '—', sub: records.fastestRide?.name, col: c.green },
                  { icon: '😣', t: 'Härteste Fahrt', v: records.mostSuffering ? `${records.mostSuffering.score} Pain` : '—', sub: records.mostSuffering?.name, col: c.red },
                ] as { icon: string; t: string; v: string; sub?: string; col: string }[]).map(r => (
                  <GlassCard key={r.t} glow={r.col} style={{ padding: 18 }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{r.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: c.muted, marginBottom: 4 }}>{r.t}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: r.col }}>{r.v}</div>
                    {r.sub && <div style={{ fontSize: 11, color: c.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>}
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Heatmap */}
            <GlassCard style={{ padding: 28 }}>
              <SectionLabel tag="Aktivitäten" title="Heatmap — 365 Tage" sub="Hover über Kästchen für Details" />
              <HeatmapGrid heatmap={heatmap} />
            </GlassCard>

            {/* Fun Facts */}
            <div>
              <SectionLabel tag="Wow-Faktor" title="Was du wirklich geleistet hast" />
              <FunFacts stats={stats} />
            </div>

            {/* Recent Activities */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                <SectionLabel tag="Aktivitäten" title="Letzte Fahrten" />
                <div style={{ fontSize: 11, color: c.muted, marginBottom: 24 }}>{data.totalActivitiesLoaded} geladen</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentActivities.map((act, i) => {
                  const col = SPORT_COLORS[act.sport_type] ?? c.accent
                  const icon = SPORT_ICON[act.sport_type] ?? '🚴'
                  return (
                    <div key={act.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', animation: `slideUp .4s ${i * 0.04}s both`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg,${col},${col}40)`, borderRadius: '3px 0 0 3px' }} />
                      <div style={{ paddingLeft: 6, flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span>{icon}</span>
                            <span style={{ fontWeight: 800, color: c.white, fontSize: 13 }}>{act.name}</span>
                            {act.prCount > 0 && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: `${c.yellow}20`, color: c.yellow, border: `1px solid ${c.yellow}30` }}>🏆 {act.prCount} PR</span>}
                            {(act.sufferScore ?? 0) > 100 && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: `${c.red}15`, color: c.red }}>🔥 {act.sufferScore}</span>}
                          </div>
                          <span style={{ fontSize: 11, color: c.muted, flexShrink: 0 }}>{dateDE(act.date)}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {[
                            { i: '📏', v: `${act.km} km` }, { i: '⏱', v: durStr(act.durationMin) }, { i: '⚡', v: `${act.avgSpeedKmh} km/h` },
                            act.elevation > 0 && { i: '⛰', v: `${fmt(act.elevation)} m` },
                            act.avgHr && { i: '❤️', v: `${act.avgHr} bpm` },
                            act.watts && { i: '💪', v: `${act.watts} W` },
                            act.kudos > 0 && { i: '👍', v: String(act.kudos) },
                          ].filter(Boolean).map(s => s && <span key={s.i} style={{ fontSize: 12, color: c.text, display: 'flex', alignItems: 'center', gap: 4 }}>{s.i} {s.v}</span>)}
                        </div>
                      </div>
                      <a href={`https://www.strava.com/activities/${act.id}`} target="_blank" rel="noopener" style={{ fontSize: 11, color: c.muted, border: `1px solid ${c.border}`, padding: '4px 10px', borderRadius: 7, flexShrink: 0, textDecoration: 'none' }}>Strava ↗</a>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ TRAINING TAB ═══════════════════════════════════════════ */}
        {activeTab === 'training' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Weekly + Monthly side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <GlassCard style={{ padding: 28 }}>
                <SectionLabel tag="Training" title="Wöchentliche Belastung" sub={`Beste Woche: ${bestWeek.label} · ${bestWeek.km} km`} />
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 110, marginBottom: 8 }}>
                  {weeklyLoad.map((w, i) => {
                    const pct = (w.km / maxWeekKm) * 100
                    const isCur = i === weeklyLoad.length - 1
                    const isBest = w.km === bestWeek.km
                    const col = isBest ? c.yellow : isCur ? c.accent : w.km > 0 ? `${c.accent}60` : 'rgba(255,255,255,0.04)'
                    return (
                      <div key={i} title={`${w.label}: ${w.km} km, ${w.rides} Rides`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                        {w.km > 0 && <div style={{ fontSize: 8, color: isBest ? c.yellow : isCur ? c.accent : c.muted, fontWeight: 700 }}>{w.km}</div>}
                        <div style={{ width: '100%', height: `${Math.max(pct, 2)}%`, background: `linear-gradient(180deg,${col},${col}99)`, borderRadius: '4px 4px 2px 2px', boxShadow: (isBest || isCur) ? `0 0 8px ${col}60` : 'none', transition: 'height 1s ease', minHeight: w.km > 0 ? 3 : 0 }} />
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {weeklyLoad.map((w, i) => <div key={i} style={{ flex: 1, fontSize: 7, color: i === weeklyLoad.length - 1 ? c.accent : c.muted, textAlign: 'center', overflow: 'hidden' }}>{i % 3 === 0 || i === weeklyLoad.length - 1 ? w.label : ''}</div>)}
                </div>
              </GlassCard>

              <GlassCard style={{ padding: 28 }}>
                <SectionLabel tag="2026" title="Monatliche km" sub={`Bestes Monat: ${bestMonth.month} · ${bestMonth.km} km`} />
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, marginBottom: 8 }}>
                  {monthlyKm.map((m, i) => {
                    const pct = (m.km / maxMonthKm) * 100
                    const isCur = i === new Date().getMonth()
                    const isBest = m.km === bestMonth.km && m.km > 0
                    const col = isBest ? c.yellow : isCur ? c.accent : m.km > 0 ? `${c.purple}80` : 'rgba(255,255,255,0.03)'
                    return (
                      <div key={m.month} title={`${m.month}: ${m.km} km, ${m.rides} Rides`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        {m.km > 0 && <div style={{ fontSize: 8, color: isBest ? c.yellow : isCur ? c.accent : c.muted, fontWeight: 700 }}>{m.km}</div>}
                        <div style={{ width: '100%', height: `${Math.max(pct, 2)}%`, background: `linear-gradient(180deg,${col},${col}80)`, borderRadius: '4px 4px 2px 2px', minHeight: m.km > 0 ? 3 : 0 }} />
                        <div style={{ fontSize: 8, color: isCur ? c.accent : c.muted, fontWeight: isCur ? 800 : 400 }}>{m.month}</div>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            </div>

            {/* Sport breakdown + Speed + HR + Day radar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <GlassCard style={{ padding: 28 }}>
                <SectionLabel tag="Analyse" title="Sport-Verteilung" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(sportBreakdown).sort((a, b) => b[1].count - a[1].count).map(([label, val], i) => {
                    const pct = Math.round((val.count / totalSportCount) * 100)
                    const cols = [c.accent, c.purple, c.yellow, c.green, c.teal, c.orange]
                    const col = cols[i % cols.length]
                    return (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: c.text, fontWeight: 600 }}>{label}</span>
                          <span style={{ fontSize: 11, color: c.muted }}>{val.count}× · {Math.round(val.km)} km · {pct}%</span>
                        </div>
                        <AnimBar pct={pct} color={col} delay={i * 80} />
                      </div>
                    )
                  })}
                </div>
              </GlassCard>

              <GlassCard style={{ padding: 28 }}>
                <SectionLabel tag="Wochentag-Radar" title="Training nach Wochentag" />
                <DayRadar heatmap={heatmap} />
              </GlassCard>
            </div>

            {/* Speed + HR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <GlassCard style={{ padding: 28 }}>
                <SectionLabel tag="Speed" title="Geschwindigkeits-Verteilung" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {speedBuckets.map((b, i) => {
                    const total = speedBuckets.reduce((s, x) => s + x.count, 0)
                    const pct = total > 0 ? Math.round((b.count / total) * 100) : 0
                    const maxCount = Math.max(...speedBuckets.map(x => x.count), 1)
                    const barPct = (b.count / maxCount) * 100
                    const cols = [c.muted, c.teal, c.accent, c.purple, c.orange, c.red]
                    return (
                      <div key={b.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: c.text }}>{b.label} km/h</span>
                          <span style={{ fontSize: 11, color: c.muted }}>{b.count} · {pct}%</span>
                        </div>
                        <AnimBar pct={barPct} color={cols[i] ?? c.accent} height={12} delay={i * 80} />
                      </div>
                    )
                  })}
                </div>
              </GlassCard>

              <GlassCard style={{ padding: 28 }}>
                <SectionLabel tag="Kondition" title="Herzfrequenz-Zonen" />
                {hrZones.reduce((s, z) => s + z.count, 0) === 0
                  ? <div style={{ color: c.muted, fontSize: 13, textAlign: 'center', paddingTop: 20 }}>Keine HF-Daten</div>
                  : <>
                    <div style={{ height: 18, borderRadius: 9, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 20 }}>
                      {hrZones.map(z => z.count > 0 && <div key={z.label} style={{ flex: z.count, background: z.color }} />)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {hrZones.map((z, i) => {
                        const total = hrZones.reduce((s, x) => s + x.count, 0)
                        const pct = Math.round((z.count / total) * 100)
                        const max = Math.max(...hrZones.map(x => x.count), 1)
                        return (
                          <div key={z.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: z.color }} />
                                <span style={{ fontSize: 12, color: c.text }}>{z.label}</span>
                              </div>
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

        {/* ══ GARAGE TAB ═════════════════════════════════════════════ */}
        {activeTab === 'garage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <SectionLabel tag="Meine Bikes" title="Fahrzeug-Garage" sub="Hover für Tech-Specs · Klicken für Details" />
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {([{ icon: '🚲', label: `${athlete.bikes.length} Bikes` }, { icon: '📏', label: `${fmt(stats.allTime.km)} km` }, { icon: '⚙️', label: `${Object.values(bikeExtras).filter(e => e.groupset).length} konfiguriert` }] as {icon:string;label:string}[]).map(s => (
                  <div key={s.label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '8px 14px', fontSize: 12, color: c.text, display: 'flex', alignItems: 'center', gap: 6 }}>{s.icon} {s.label}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
              {athlete.bikes.map((bike: Bike, i: number) => (
                <BikeCard key={bike.id} bike={bike} extra={bikeExtras[bike.id] ?? {}} color={BIKE_COLORS[i % BIKE_COLORS.length]} onEdit={() => setEditBikeId(bike.id)} />
              ))}
            </div>

            {/* Bike comparison table */}
            {athlete.bikes.length > 1 && (
              <GlassCard style={{ padding: 24, marginTop: 8 }}>
                <SectionLabel tag="Vergleich" title="Bikes nebeneinander" />
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: c.muted, fontWeight: 700 }}>Eigenschaft</th>
                        {athlete.bikes.map((bike: Bike, i: number) => <th key={bike.id} style={{ textAlign: 'center', padding: '8px 12px', color: BIKE_COLORS[i % BIKE_COLORS.length], fontWeight: 800 }}>{bikeExtras[bike.id]?.nickname || bike.name || `${bike.brand} ${bike.model}`}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { k: 'Kilometer', fn: (b: Bike) => `${fmt(b.km)} km` },
                        { k: 'Schaltgruppe', fn: (b: Bike) => bikeExtras[b.id]?.groupset ?? '—' },
                        { k: 'Rahmen', fn: (b: Bike) => bikeExtras[b.id]?.frameMaterial ?? '—' },
                        { k: 'Gewicht', fn: (b: Bike) => bikeExtras[b.id]?.weightKg ? bikeExtras[b.id].weightKg + ' kg' : '—' },
                        { k: 'Kaufjahr', fn: (b: Bike) => bikeExtras[b.id]?.purchaseYear ?? '—' },
                        { k: 'Status', fn: (b: Bike) => b.km > 15000 ? '⚠️ Wartung' : b.km > 8000 ? '🔄 Bald' : '✅ Top' },
                      ].map((row, ri) => (
                        <tr key={row.k} style={{ borderBottom: `1px solid ${c.border}`, background: ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                          <td style={{ padding: '9px 12px', color: c.muted, fontWeight: 600 }}>{row.k}</td>
                          {athlete.bikes.map((bike: Bike) => <td key={bike.id} style={{ padding: '9px 12px', color: c.text, textAlign: 'center' }}>{row.fn(bike)}</td>)}
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

      {/* ── BIKE MODAL ───────────────────────────────────────────────── */}
      {editBike && (
        <BikeModal
          bikeId={editBike.id}
          bikeName={bikeExtras[editBike.id]?.nickname || editBike.name || `${editBike.brand} ${editBike.model}`}
          bikeKm={editBike.km}
          bColor={BIKE_COLORS[athlete.bikes.indexOf(editBike) % BIKE_COLORS.length]}
          init={bikeExtras[editBike.id] ?? {}}
          onSave={d => { const n = { ...bikeExtras, [editBike.id]: d }; setBikeExtras(n); saveExtras(n); setEditBikeId(null) }}
          onClose={() => setEditBikeId(null)}
        />
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ padding: '20px 0', borderTop: `1px solid ${c.border}`, textAlign: 'center', color: c.muted, fontSize: 11, background: c.bg2 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
          {lastUpdated && `Stand: ${lastUpdated.toLocaleTimeString('de-DE')} · `}
          {data.totalActivitiesLoaded} Aktivitäten · {' '}
          <Link href="/" style={{ color: c.muted }}>Karte</Link>{' · '}
          <Link href="/viking-bike-challenge" style={{ color: c.muted }}>Viking Bike</Link>
        </div>
      </footer>
    </div>
  )
}
