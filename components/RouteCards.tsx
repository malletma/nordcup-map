'use client'

import { routes } from '@/lib/data/routes'

export default function RouteCards() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: 16,
    }}>
      {routes.map((r) => {
        const pts = r.profile
        const maxH = Math.max(...pts)
        const w = 300, h = 50
        const step = w / (pts.length - 1)

        let fillD = `M0,${h} `
        pts.forEach((v, i) => {
          const x = i * step
          const y = h - (v / maxH) * (h - 4)
          fillD += `L${x},${y} `
        })
        fillD += `L${w},${h} Z`

        return (
          <div key={r.id} style={{
            background: '#131c2e',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            overflow: 'hidden',
            transition: 'border-color 0.2s, transform 0.2s',
          }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: r.color + '22',
                color: r.color,
                border: `1px solid ${r.color}44`,
              }}>{r.type}</span>
              <span style={{ fontSize: 13, color: '#7a8599' }}>Start {r.start}</span>
            </div>

            <div style={{ padding: '16px 20px 20px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e6eef8', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 13, color: '#7a8599', marginBottom: 14 }}>{r.subtitle}</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { val: `${r.distance}`, unit: 'km', label: 'Distanz' },
                  { val: `${r.elevation}`, unit: 'm', label: 'Höhenmeter' },
                  { val: r.duration.split('–')[0].trim(), unit: '', label: 'Fahrzeit' },
                ].map((s) => (
                  <div key={s.label} style={{
                    textAlign: 'center',
                    padding: '10px 4px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#e6eef8' }}>
                      {s.val}{s.unit && <small style={{ fontSize: 13, fontWeight: 500, color: '#7a8599' }}> {s.unit}</small>}
                    </div>
                    <div style={{ fontSize: 11, color: '#7a8599', marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Elevation Profile SVG */}
              <div style={{ marginTop: 14, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#7a8599', marginBottom: 6, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Höhenprofil (schematisch)
                </div>
                <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 50, display: 'block' }}>
                  <defs>
                    <linearGradient id={`grad-${r.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={r.color} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={r.color} stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <path d={fillD} fill={`url(#grad-${r.id})`} />
                  <path d={fillD.replace(/Z$/, '')} fill="none" stroke={r.color} strokeWidth="1.5" />
                </svg>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 12, color: '#7a8599' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                {r.guidance}
              </div>

              {r.komoot && (
                <a
                  href={r.komoot}
                  target="_blank"
                  rel="noopener"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 14,
                    fontSize: 13,
                    fontWeight: 600,
                    color: r.color,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Route auf Komoot ansehen
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
