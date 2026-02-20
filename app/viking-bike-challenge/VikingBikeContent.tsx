'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { stations } from '@/lib/data/stations'
import { routes } from '@/lib/data/routes'

const CountdownTimer = dynamic(() => import('@/components/CountdownTimer'), { ssr: false })
const VikingMap = dynamic(() => import('@/components/VikingMap'), { ssr: false })
const RouteCards = dynamic(() => import('@/components/RouteCards'), { ssr: false })

const c = {
  marathon: '#e8491d',
  gravel: '#9b59b6',
  rtf: '#2ecc71',
  accent: '#3d7dd6',
  border: 'rgba(255,255,255,0.06)',
  card: '#131c2e',
  muted: '#7a8599',
  text: '#c8d3e5',
  white: '#e6eef8',
  bg: '#0a0f1a',
  bg2: '#0f1724',
}

const schedule = [
  { time: '06:30 Uhr', title: 'Anmeldung & Check-In', desc: 'Dannewerkschule, Erikstraße 50, 24837 Schleswig — Sporthalle', color: c.muted },
  { time: '07:30 Uhr', title: 'Start NordCup Radmarathon', desc: '208 km — Geführte Gruppen in verschiedenen Geschwindigkeiten', color: c.marathon, tag: 'GPS-Track', tagBg: 'rgba(232,73,29,0.12)', tagColor: c.marathon },
  { time: '08:00 Uhr', title: 'Start Gravelstrecke', desc: '82 km — Schotter, Wald- und Feldwege rund um die Schlei', color: '#9b59b6', tag: 'GPS-Track', tagBg: 'rgba(155,89,182,0.12)', tagColor: '#9b59b6' },
  { time: '09:00 — 10:00 Uhr', title: 'Start RTF-Strecken', desc: '49 / 80 / 112 / 152 km — Familientour bis Leistungstour', color: c.rtf, tag: 'Ausgeschildert / Geführt', tagBg: 'rgba(46,204,113,0.12)', tagColor: c.rtf },
  { time: 'ca. 12:00 Uhr', title: 'Erste Zielankünfte', desc: 'Familientour (49 km) — Warm duschen, Essen & Getränke am Ziel', color: c.muted },
  { time: 'ca. 17:00 Uhr', title: 'Siegerehrung', desc: 'Ergebnisse, Verlosung, gemütliches Beisammensein', color: c.muted },
]

const infoCards = [
  {
    icon: '🏁', title: 'Veranstaltungsdetails',
    rows: [
      ['Datum', 'Sonntag, 07.06.2026'], ['Veranstalter', 'RV Schleswig e.V.'],
      ['Landesverband', 'Schleswig-Holstein'], ['Veranst.-Nr. (RM)', '4129'],
      ['Veranst.-Nr. (RTF)', '2123'], ['Veranst.-Nr. (Gravel)', '6042'],
    ],
  },
  {
    icon: '📍', title: 'Startort',
    rows: [
      ['Adresse', 'Erikstraße 50'], ['PLZ / Ort', '24837 Schleswig'],
      ['Gebäude', 'Dannewerkschule, Sporthalle'], ['Sternfahrt', 'Möglich'],
      ['Parken', 'Schulparkplatz kostenlos'],
    ],
  },
  {
    icon: '📞', title: 'Kontakt',
    rows: [
      ['Ansprechpartner', 'Doris Zimmer'], ['Telefon', '0174 / 876 96 07'],
      ['E-Mail', 'doris_zimmer@gmx.net'], ['Website', 'rv-schleswig.de'],
    ],
  },
  {
    icon: '🛡️', title: 'Hinweise',
    rows: [
      ['RTF 49 & 80 km', 'Ausgeschildert'], ['RTF 112 & 152 km', 'Geführte Gruppen'],
      ['Radmarathon', 'GPS-Track, geführt'], ['Gravel', 'GPS-Track'],
      ['Zusatz', 'V = Verpflegung'],
    ],
  },
]

// ── Section Header helper ─────────────────────────────────
function SectionHeader({ label, title, desc }: { label: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: c.accent, marginBottom: 8 }}>{label}</div>
      <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: c.white, letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
      {desc && <p style={{ color: c.muted, maxWidth: 640, marginTop: 8, marginBottom: 0 }}>{desc}</p>}
    </div>
  )
}

// ── Main Client Component ─────────────────────────────────
export default function VikingBikeContent() {
  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", background: c.bg, color: c.text, minHeight: '100vh', lineHeight: 1.6, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Nav ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 56, background: 'rgba(10,15,26,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.muted, fontSize: 14, fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 18, height: 18 }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Zurück zur Karte
          </Link>
          <span style={{ fontWeight: 700, fontSize: 16, color: c.white }}>Viking Bike Challenge 2026</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['#schedule', 'Ablauf'], ['#routes', 'Strecken'], ['#verpflegung', 'Verpflegung'], ['#info', 'Info']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: c.muted, fontSize: 13, fontWeight: 500 }}>{label}</a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ marginTop: 56, padding: '80px 0 60px', background: 'linear-gradient(170deg, #0d1b30 0%, #0a0f1a 60%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,73,29,0.12)', color: c.marathon, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20, border: `1px solid rgba(232,73,29,0.2)` }}>
            NordCup Radmarathon 2026
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, color: c.white, lineHeight: 1.1, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Viking Bike<br /><span style={{ color: c.marathon }}>Challenge</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: c.muted, maxWidth: 600, marginBottom: 36 }}>
            Radmarathon, RTF &amp; Gravelride — Rund um die Schlei.
            Sechs Strecken, ein Abenteuer. Von der Familientour bis zum 208 km Marathon.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 36 }}>
            {[{ icon: '📅', label: 'Sonntag, 7. Juni 2026' }, { icon: '📍', label: 'Schleswig — Dannewerkschule' }, { icon: '🏢', label: 'RV Schleswig e.V.' }].map((m) => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.text, fontSize: 15 }}>
                <span>{m.icon}</span>
                <strong style={{ color: c.white, fontWeight: 600 }}>{m.label}</strong>
              </div>
            ))}
          </div>
          <CountdownTimer />
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <div style={{ background: c.card, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', textAlign: 'center' }}>
            {[['6', 'Strecken'], ['208', 'Max. km'], ['~900', 'Höhenmeter'], ['6', 'Verpflegung'], ['3', 'Disziplinen'], ['07:30', 'Erster Start']].map(([num, label]) => (
              <div key={label} style={{ padding: '20px 12px', borderRight: `1px solid ${c.border}` }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: c.white }}>{num}</div>
                <div style={{ fontSize: 12, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Schedule ── */}
      <section style={{ padding: '64px 0' }} id="schedule">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader label="Tagesablauf" title="Zeitplan & Startgruppen" desc="Alle drei Disziplinen starten an der Dannewerkschule in Schleswig." />
          <div style={{ position: 'relative', paddingLeft: 36 }}>
            <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${c.marathon}, #9b59b6, ${c.rtf})`, borderRadius: 2 }} />
            {schedule.map((item, i) => (
              <div key={i} style={{ position: 'relative', padding: '16px 0 16px 20px' }}>
                <div style={{ position: 'absolute', left: -28, top: 20, width: 12, height: 12, borderRadius: '50%', border: `2px solid ${item.color}`, background: c.bg }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: c.muted }}>{item.time}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c.white, marginTop: 2 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: c.muted, marginTop: 2 }}>{item.desc}</div>
                {item.tag && (
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginTop: 4, background: item.tagBg, color: item.tagColor }}>{item.tag}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Route Map ── */}
      <section style={{ padding: '0 0 40px' }} id="routes">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader label="Strecken" title="Alle Routen im Überblick" desc="Klicke auf die Filter, um einzelne Strecken ein- und auszublenden." />
          <VikingMap />
        </div>
      </section>

      {/* ── Route Cards ── */}
      <section style={{ paddingTop: 0, paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <RouteCards />
        </div>
      </section>

      {/* ── Verpflegungsstationen ── */}
      <section style={{ padding: '64px 0', background: c.bg2 }} id="verpflegung">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader label="Verpflegung" title="Verpflegungsstationen" desc="Alle ~40 km versorgen wir euch mit Essen, Getränken und guter Laune. (Beispieldaten — Standorte werden noch bestätigt)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {stations.map((s, i) => {
              const routeNames = s.forRoutes.map((rid) => routes.find((x) => x.id === rid)?.name ?? rid).join(', ')
              return (
                <div key={i} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: i === 0 ? c.marathon : '#f39c12' }} />
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: c.white, marginBottom: 10 }}>
                    {i === 0 ? '🏁' : '🍌'} KM {s.km}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.white, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: c.muted, marginBottom: 10 }}>{s.location}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {s.offerings.map((o) => (
                      <span key={o} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 999, fontSize: 12, color: c.text }}>{o}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: c.muted }}>Strecken: {routeNames}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Info ── */}
      <section style={{ padding: '64px 0' }} id="info">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader label="Ausschreibung" title="Informationen & Anmeldung" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {infoCards.map((card) => (
              <div key={card.title} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.white, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{card.icon}</span> {card.title}
                </div>
                {card.rows.map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.border}`, fontSize: 14 }}>
                    <span style={{ color: c.muted }}>{label}</span>
                    <span style={{ color: c.white, fontWeight: 500, textAlign: 'right' }}>
                      {label === 'E-Mail' ? <a href={`mailto:${value}`} style={{ color: c.accent }}>{value}</a>
                        : label === 'Website' ? <a href={`https://${value}`} target="_blank" rel="noopener" style={{ color: c.accent }}>{value}</a>
                        : value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ textAlign: 'center', padding: '60px 0 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(232,73,29,0.08), rgba(61,125,214,0.08))', border: `1px solid rgba(232,73,29,0.15)`, borderRadius: 14, padding: '48px 40px', maxWidth: 680, margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: c.white, marginBottom: 10 }}>Bereit für das Abenteuer?</h3>
            <p style={{ color: c.muted, marginBottom: 24 }}>Melde dich jetzt an und erlebe die schönste Radtour Schleswig-Holsteins — Rund um die Schlei!</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              <a href="https://rv-schleswig.de" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: c.marathon, color: '#fff', textDecoration: 'none' }}>Zur Anmeldung →</a>
              <a href="https://www.komoot.com/de-de/tour/2165067343" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: c.white, border: `1px solid ${c.border}`, textDecoration: 'none' }}>⚡ Marathon auf Komoot</a>
              <a href="https://www.komoot.com/de-de/tour/2263487719" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: c.white, border: `1px solid ${c.border}`, textDecoration: 'none' }}>⚡ Gravel auf Komoot</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '32px 0', borderTop: `1px solid ${c.border}`, textAlign: 'center', color: c.muted, fontSize: 13 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          Viking Bike Challenge 2026 —{' '}
          <a href="https://rv-schleswig.de" target="_blank" rel="noopener" style={{ color: c.muted }}>RV Schleswig e.V.</a>
          {' · '}
          <Link href="/" style={{ color: c.muted }}>Zurück zur NordCup Karte</Link>
          {' · '}
          <em>Beispielseite — Daten ohne Gewähr</em>
        </div>
      </footer>
    </div>
  )
}
