'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { routes, START } from '@/lib/data/routes'
import { stations } from '@/lib/data/stations'

type VMLang = 'de' | 'en'
const vmDict = {
  de: { filter: 'Filter:', food: 'Verpflegung', startGoal: 'Start / Ziel' },
  en: { filter: 'Filter:', food: 'Food station', startGoal: 'Start / Finish' },
}

export default function VikingMap() {
  const [lang, setLang] = useState<VMLang>('de')
  useEffect(() => {
    try {
      const s = localStorage.getItem('nordcup-prefs')
      if (s) { const p = JSON.parse(s); if (p.lang === 'en' || p.lang === 'de') setLang(p.lang) }
    } catch { /* ignore */ }
  }, [])
  const vt = vmDict[lang]
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLines = useRef<Record<string, L.Polyline>>({})
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(routes.map((r) => [r.id, true])),
  )

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [54.48, 9.62],
      zoom: 10,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/attributions">Carto</a> &mdash; © OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    // Start marker
    const startIcon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:#fff;border:3px solid #e8491d;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#e8491d;box-shadow:0 2px 8px rgba(0,0,0,0.4);">S</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    L.marker(START, { icon: startIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`<b>${lang === 'en' ? 'Start / Finish' : 'Start / Ziel'}</b><br>Dannewerkschule<br>Erikstraße 50, Schleswig`)

    // Route polylines
    routes.forEach((r) => {
      const line = L.polyline(r.track, {
        color: r.color,
        weight: r.id === 'marathon' ? 4 : 3,
        opacity: 0.85,
        dashArray: r.id.startsWith('rtf') ? '8,6' : undefined,
        smoothFactor: 1.5,
      }).addTo(map)
      routeLines.current[r.id] = line
    })

    // Station markers
    const stationIcon = L.divIcon({
      className: '',
      html: `<div style="width:22px;height:22px;background:#f39c12;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,0.5);">🍌</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })

    stations.slice(1).forEach((s) => {
      L.marker([s.lat, s.lng], { icon: stationIcon, zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(`
          <div class="station-popup">
            <div class="sp-name">${s.name}</div>
            <div class="sp-km">KM ${s.km}</div>
            <div class="sp-items">${s.offerings.join(' · ')}</div>
          </div>
        `)
    })

    mapRef.current = map
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      map.remove()
      mapRef.current = null
    }
  }, [])

  const toggleRoute = (id: string) => {
    const map = mapRef.current
    if (!map) return

    setVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (next[id]) routeLines.current[id]?.addTo(map)
      else map.removeLayer(routeLines.current[id])
      return next
    })
  }

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#131c2e' }}>
      {/* Filter chips */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#131c2e',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#7a8599', marginRight: 6 }}>{vt.filter}</span>
        {routes.map((r) => {
          const active = visibility[r.id]
          return (
            <button
              key={r.id}
              onClick={() => toggleRoute(r.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `1.5px solid ${r.color}`,
                background: active ? r.color + '22' : 'transparent',
                color: active ? r.color : r.color,
                opacity: active ? 1 : 0.45,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              {r.name} ({r.distance} km)
            </button>
          )
        })}
      </div>

      {/* Map */}
      <div ref={mapContainerRef} style={{ width: '100%', height: 560 }} />

      {/* Legend */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#131c2e',
      }}>
        {routes.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7a8599' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
            {r.name} {r.distance} km
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7a8599' }}>
          <span style={{ fontSize: 14 }}>🍌</span> {vt.food}
        </div>
      </div>
    </div>
  )
}
