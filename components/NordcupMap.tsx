'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import L from 'leaflet'
import { events, serieColors, serieColorKeys, vikingTrack, type Event } from '@/lib/data/events'

// ── Types ────────────────────────────────────────────────
interface Filters {
  serie: Set<string>
  typ: Set<string>
  region: Set<string>
}

// ── Helper: create numbered SVG icon ─────────────────────
function createNumberedIcon(num: number, color: string, size = 34) {
  const id = `s${num}_${color.replace('#', '')}_${size}`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <defs>
      <filter id='${id}' x='-50%' y='-50%' width='200%' height='200%'>
        <feDropShadow dx='0' dy='2' stdDeviation='2.5' flood-color='rgba(0,0,0,0.4)' flood-opacity='0.7'/>
      </filter>
    </defs>
    <circle cx='${size / 2}' cy='${size / 2 - 2}' r='${size / 2 - 4}' fill='${color}' stroke='rgba(255,255,255,0.2)' stroke-width='1.5' filter='url(#${id})'/>
    <text x='${size / 2}' y='${size / 2 + 3}' text-anchor='middle' fill='white' font-size='${size * 0.32}' font-weight='800' font-family='Inter,sans-serif'>${num}</text>
  </svg>`
  return L.icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 + 2],
    className: 'custom-marker',
  })
}

// ── Badge color CSS helper ────────────────────────────────
const badgeBg: Record<string, string> = {
  nordcup: '#3d5875',
  brevet: '#6b4c9a',
  rtf: '#2a7d4f',
  jedermann: '#b8860b',
}

export default function NordcupMap() {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRefs = useRef<Record<number, L.Marker>>({})
  const trackLineRef = useRef<L.Polyline | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    serie: new Set(),
    typ: new Set(),
    region: new Set(),
  })

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768

  // ── Derived ──────────────────────────────────────────────
  const uniqueSeries = useMemo(() => [...new Set(events.map((e) => e.serie))], [])
  const uniqueTypen = useMemo(() => [...new Set(events.map((e) => e.typ))], [])
  const uniqueRegionen = useMemo(() => [...new Set(events.map((e) => e.region))], [])

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filters.serie.size && !filters.serie.has(ev.serie)) return false
      if (filters.typ.size && !filters.typ.has(ev.typ)) return false
      if (filters.region.size && !filters.region.has(ev.region)) return false
      return true
    })
  }, [filters])

  const sortedEvents = useMemo(
    () => [...filteredEvents].sort((a, b) => a.dateSort.localeCompare(b.dateSort)),
    [filteredEvents],
  )

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    if (!sortedEvents.length) return { events: 0, series: 0, season: '—' }
    const first = new Date(sortedEvents[0].dateSort)
    const last = new Date(sortedEvents[sortedEvents.length - 1].dateSort)
    return {
      events: filteredEvents.length,
      series: new Set(filteredEvents.map((e) => e.serie)).size,
      season: `${months[first.getMonth()]}–${months[last.getMonth()]}`,
    }
  }, [filteredEvents, sortedEvents])

  // ── Map init ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [54.0, 10.0],
      zoom: 8,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/attributions">Carto</a> &mdash; © OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map

    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Rebuild markers whenever filteredEvents changes ───────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    Object.values(markerRefs.current).forEach((m) => map.removeLayer(m))
    markerRefs.current = {}

    if (filteredEvents.length === 0) return

    filteredEvents.forEach((ev, idx) => {
      const color = serieColors[ev.serie] || '#3d5875'
      const icon = createNumberedIcon(idx + 1, color)
      const colorKey = serieColorKeys[ev.serie] || 'nordcup'

      const distHtml = ev.distances
        ? `<div style="margin-top:6px;font-size:0.82rem;color:#98a0b3;">🛣️ ${ev.distances.join(' · ')}</div>`
        : ''
      const komootHtml = ev.komoot
        ? `<a class="popup-link popup-link--komoot" href="${ev.komoot}" target="_blank" rel="noopener">🗺️ Komoot Route →</a>`
        : ''
      const vikingBtn =
        ev.id === 4
          ? `<a class="popup-link popup-link--viking" href="/viking-bike-challenge" style="display:inline-block;margin-top:4px;">⚔️ Event-Detailseite →</a>`
          : ''

      const marker = L.marker([ev.lat, ev.lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="popup-name">${ev.name}</div>
          <div class="popup-date">📅 ${ev.date} · 📍 ${ev.location}</div>
          <div class="popup-club">🏢 ${ev.club}</div>
          <div class="popup-badges">
            <span class="popup-badge" style="background:${badgeBg[colorKey] || '#3d5875'}">${ev.serie}</span>
            <span class="popup-badge" style="background:rgba(255,255,255,0.08);color:#98a0b3;">${ev.typ}</span>
          </div>
          ${distHtml}
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;">
            ${ev.link ? `<a class="popup-link" href="${ev.link}" target="_blank" rel="noopener">Website →</a>` : ''}
            ${komootHtml}
          </div>
          ${vikingBtn}
        `)

      marker.on('click', () => setSelectedId(ev.id))
      marker.on('popupclose', () => {
        if (!isMobile()) setSelectedId(null)
      })
      markerRefs.current[ev.id] = marker
    })

    map.fitBounds(
      filteredEvents.map((e) => [e.lat, e.lon] as [number, number]),
      { padding: [50, 50] },
    )
  }, [filteredEvents])

  // ── Show/hide track on selection ──────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (trackLineRef.current) {
      map.removeLayer(trackLineRef.current)
      trackLineRef.current = null
    }
    if (selectedId === 4) {
      trackLineRef.current = L.polyline(vikingTrack, {
        color: '#e8491d',
        weight: 3,
        opacity: 0.75,
        dashArray: '8, 6',
        lineCap: 'round',
      }).addTo(map)
    }
  }, [selectedId])

  // ── Select event ─────────────────────────────────────────
  const selectEvent = useCallback(
    (id: number) => {
      setSelectedId(id)
      const ev = events.find((e) => e.id === id)
      if (!ev || !mapRef.current) return

      mapRef.current.flyTo([ev.lat, ev.lon], Math.max(mapRef.current.getZoom(), 10), {
        duration: 0.5,
      })

      if (!isMobile()) {
        markerRefs.current[id]?.openPopup()
      }
    },
    [],
  )

  // ── Toggle filter ─────────────────────────────────────────
  const toggleFilter = useCallback((category: keyof Filters, value: string) => {
    setSelectedId(null)
    setFilters((prev) => {
      const next = { ...prev, serie: new Set(prev.serie), typ: new Set(prev.typ), region: new Set(prev.region) }
      if (next[category].has(value)) next[category].delete(value)
      else next[category].add(value)
      return next
    })
  }, [])

  const resetFilters = useCallback(() => {
    setSelectedId(null)
    setFilters({ serie: new Set(), typ: new Set(), region: new Set() })
  }, [])

  const hasFilters = filters.serie.size > 0 || filters.typ.size > 0 || filters.region.size > 0

  const regionColorMap: Record<string, string> = {
    'Schleswig-Holstein': 'rgba(255,255,255,0.15)',
    Hamburg: 'rgba(255,255,255,0.15)',
    Niedersachsen: 'rgba(255,255,255,0.15)',
    'Mecklenburg-Vorpommern': 'rgba(255,255,255,0.15)',
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(11,18,32,0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
        zIndex: 1000,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🚴</span>
          Radsport Norddeutschland
          <span style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}>2026</span>
        </h1>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/mein-bereich"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              background: 'rgba(61,125,214,0.1)',
              border: '1px solid rgba(61,125,214,0.2)',
              borderRadius: 8,
              color: '#7cb3e8',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            🚴 Mein Bereich
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setListOpen((o) => !o)}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: 'var(--white)',
            cursor: 'pointer',
            fontSize: 22,
            padding: 4,
          }}
          className="mobile-menu-btn"
          aria-label="Menü"
        >☰</button>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, gap: 16, padding: 16 }}>
        {/* Sidebar */}
        <aside style={{
          width: 400,
          background: 'var(--card)',
          borderRadius: 14,
          boxShadow: '0 8px 30px rgba(2,6,23,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: 20,
          flexShrink: 0,
          overflowY: 'auto',
        }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Veranstaltungen 2026</h2>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { value: stats.events, label: 'Events' },
              { value: stats.series, label: 'Serien' },
              { value: stats.season, label: 'Saison' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--white)' }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Serie */}
            <FilterGroup
              label="Serie / Veranstaltung"
              values={uniqueSeries}
              active={filters.serie}
              getColor={(v) => badgeBg[serieColorKeys[v] || 'nordcup'] || '#3d5875'}
              onToggle={(v) => toggleFilter('serie', v)}
            />
            {/* Typ */}
            <FilterGroup
              label="Typ"
              values={uniqueTypen}
              active={filters.typ}
              getColor={() => '#3d5875'}
              onToggle={(v) => toggleFilter('typ', v)}
            />
            {/* Region */}
            <FilterGroup
              label="Region"
              values={uniqueRegionen}
              active={filters.region}
              getColor={(v) => regionColorMap[v] || '#3d5875'}
              onToggle={(v) => toggleFilter('region', v)}
            />

            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'rgba(232,73,29,0.15)',
                  color: 'var(--accent-2)',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                }}
              >✕ Filter zurücksetzen</button>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* Event list */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {sortedEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Keine Veranstaltungen für diesen Filter gefunden.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {sortedEvents.map((ev, idx) => (
                  <EventItem
                    key={ev.id}
                    ev={ev}
                    idx={idx + 1}
                    selected={selectedId === ev.id}
                    onClick={() => selectEvent(ev.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Map */}
        <main style={{
          flex: 1,
          minHeight: 0,
          borderRadius: 14,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02))',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Map header */}
          <div style={{
            padding: '10px 16px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <strong style={{ fontSize: '0.95rem' }}>Karte — Norddeutschland</strong>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem' }}>
              {[
                { color: '#3d5875', label: 'NordCup' },
                { color: '#6b4c9a', label: 'Brevet' },
                { color: '#2a7d4f', label: 'RTF' },
                { color: '#b8860b', label: 'Jedermann' },
              ].map((l) => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {/* Leaflet container */}
          <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0 }} />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          aside { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────

function FilterGroup({
  label,
  values,
  active,
  getColor,
  onToggle,
}: {
  label: string
  values: string[]
  active: Set<string>
  getColor: (v: string) => string
  onToggle: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{
        fontSize: '0.72rem',
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        fontWeight: 600,
      }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {values.map((v) => {
          const isActive = active.has(v)
          return (
            <span
              key={v}
              onClick={() => onToggle(v)}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
                background: isActive ? getColor(v) : 'rgba(255,255,255,0.03)',
                color: isActive ? '#fff' : 'var(--muted)',
                userSelect: 'none',
                transition: 'all 150ms ease',
              }}
            >{v}</span>
          )
        })}
      </div>
    </div>
  )
}

function EventItem({ ev, idx, selected, onClick }: { ev: Event; idx: number; selected: boolean; onClick: () => void }) {
  const now = new Date()
  const isPast = new Date(ev.dateSort) < now
  const color = serieColors[ev.serie] || '#3d5875'
  const colorKey = serieColorKeys[ev.serie] || 'nordcup'

  return (
    <li
      onClick={onClick}
      style={{
        padding: '12px 14px',
        borderRadius: 10,
        background: selected
          ? 'rgba(61,88,117,0.12)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.012), rgba(255,255,255,0.008))',
        border: selected ? '1px solid #3d5875' : '1px solid rgba(255,255,255,0.02)',
        borderLeft: selected ? '3px solid var(--accent)' : undefined,
        cursor: 'pointer',
        opacity: isPast ? 0.45 : 1,
        transition: 'background-color 120ms ease, transform 120ms ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: '50%', background: color,
            color: '#fff', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginTop: 2,
          }}>{idx}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{ev.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.82em' }}>📅 {ev.date}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.82em' }}>📍 {ev.location}</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.78em', marginTop: 2 }}>🏢 {ev.club}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: badgeBg[colorKey] || '#3d5875', color: '#fff' }}>
                {ev.serie}
              </span>
              {ev.distances?.map((d) => (
                <span key={d} style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', background: 'rgba(255,255,255,0.08)', color: 'var(--muted)', fontWeight: 600 }}>
                  {d}
                </span>
              ))}
              {ev.komoot && (
                <a
                  href={ev.komoot}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(107,178,40,0.2)', color: '#8fce44' }}
                >🗺️ Komoot</a>
              )}
            </div>
          </div>
        </div>
        {ev.link && (
          <a
            href={ev.link}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: '1rem', opacity: 0.7, textDecoration: 'none' }}
            title="Website"
          >🔗</a>
        )}
      </div>
    </li>
  )
}
