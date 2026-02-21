'use client'

import { useEffect, useState } from 'react'

const TARGET = new Date('2026-06-07T07:30:00+02:00')

type CDLang = 'de' | 'en'
const cdLabels = {
  de: { days: 'Tage', hrs: 'Std', min: 'Min', sec: 'Sek' },
  en: { days: 'Days', hrs: 'Hrs', min: 'Min', sec: 'Sec' },
}

export default function CountdownTimer() {
  const [diff, setDiff] = useState(TARGET.getTime() - Date.now())
  const [lang, setLang] = useState<CDLang>('de')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nordcup-prefs')
      if (saved) { const p = JSON.parse(saved); if (p.lang === 'en' || p.lang === 'de') setLang(p.lang) }
    } catch { /* ignore */ }
    const id = setInterval(() => setDiff(TARGET.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const t = cdLabels[lang]

  if (diff <= 0) {
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        <CountItem num="🎉" label="" />
      </div>
    )
  }

  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  return (
    <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
      <CountItem num={d} label={t.days} />
      <CountItem num={String(h).padStart(2, '0')} label={t.hrs} />
      <CountItem num={String(m).padStart(2, '0')} label={t.min} />
      <CountItem num={String(s).padStart(2, '0')} label={t.sec} />
    </div>
  )
}

function CountItem({ num, label }: { num: number | string; label: string }) {
  return (
    <div style={{
      textAlign: 'center',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8,
      padding: '14px 18px',
      minWidth: 72,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#e6eef8', lineHeight: 1 }}>{num}</div>
      {label && <div style={{ fontSize: 11, color: '#7a8599', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>{label}</div>}
    </div>
  )
}
