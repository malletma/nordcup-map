'use client'

import { useEffect, useState } from 'react'

const TARGET = new Date('2026-06-07T07:30:00+02:00')

export default function CountdownTimer() {
  const [diff, setDiff] = useState(TARGET.getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setDiff(TARGET.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

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
      <CountItem num={d} label="Tage" />
      <CountItem num={String(h).padStart(2, '0')} label="Std" />
      <CountItem num={String(m).padStart(2, '0')} label="Min" />
      <CountItem num={String(s).padStart(2, '0')} label="Sek" />
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
