'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { stations } from '@/lib/data/stations'
import { routes } from '@/lib/data/routes'

const CountdownTimer = dynamic(() => import('@/components/CountdownTimer'), { ssr: false })
const VikingMap = dynamic(() => import('@/components/VikingMap'), { ssr: false })
const RouteCards = dynamic(() => import('@/components/RouteCards'), { ssr: false })

type Lang = 'de' | 'en'

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

/* ── Schedule styling (language-independent) ── */
const scheduleStyles = [
  { color: c.muted },
  { color: c.marathon, tagBg: 'rgba(232,73,29,0.12)', tagColor: c.marathon },
  { color: '#9b59b6', tagBg: 'rgba(155,89,182,0.12)', tagColor: '#9b59b6' },
  { color: c.rtf, tagBg: 'rgba(46,204,113,0.12)', tagColor: c.rtf },
  { color: c.muted },
  { color: c.muted },
]

/* ── Translations ── */
const vikingDict = {
  de: {
    backToMap: 'Zurück zur Karte',
    navLinks: [['#schedule', 'Ablauf'], ['#routes', 'Strecken'], ['#verpflegung', 'Verpflegung'], ['#info', 'Info']] as string[][],
    heroBadge: 'NordCup Radmarathon 2026',
    heroDesc: 'Radmarathon, RTF & Gravelride — Rund um die Schlei. Sechs Strecken, ein Abenteuer. Von der Familientour bis zum 208 km Marathon.',
    heroMeta: [
      { icon: '📅', label: 'Sonntag, 7. Juni 2026' },
      { icon: '📍', label: 'Schleswig — Dannewerkschule' },
      { icon: '🏢', label: 'RV Schleswig e.V.' },
    ],
    stats: [['6', 'Strecken'], ['208', 'Max. km'], ['~900', 'Höhenmeter'], ['6', 'Verpflegung'], ['3', 'Disziplinen'], ['07:30', 'Erster Start']] as string[][],
    scheduleLabel: 'Tagesablauf',
    scheduleTitle: 'Zeitplan & Startgruppen',
    scheduleDesc: 'Alle drei Disziplinen starten an der Dannewerkschule in Schleswig.',
    schedule: [
      { time: '06:30 Uhr', title: 'Anmeldung & Check-In', desc: 'Dannewerkschule, Erikstraße 50, 24837 Schleswig — Sporthalle' },
      { time: '07:30 Uhr', title: 'Start NordCup Radmarathon', desc: '208 km — Geführte Gruppen in verschiedenen Geschwindigkeiten', tag: 'GPS-Track' },
      { time: '08:00 Uhr', title: 'Start Gravelstrecke', desc: '82 km — Schotter, Wald- und Feldwege rund um die Schlei', tag: 'GPS-Track' },
      { time: '09:00 — 10:00 Uhr', title: 'Start RTF-Strecken', desc: '49 / 80 / 112 / 152 km — Familientour bis Leistungstour', tag: 'Ausgeschildert / Geführt' },
      { time: 'ca. 12:00 Uhr', title: 'Erste Zielankünfte', desc: 'Familientour (49 km) — Warm duschen, Essen & Getränke am Ziel' },
      { time: 'ca. 17:00 Uhr', title: 'Siegerehrung', desc: 'Ergebnisse, Verlosung, gemütliches Beisammensein' },
    ],
    routesLabel: 'Strecken',
    routesTitle: 'Alle Routen im Überblick',
    routesDesc: 'Klicke auf die Filter, um einzelne Strecken ein- und auszublenden.',
    foodLabel: 'Verpflegung',
    foodTitle: 'Verpflegungsstationen',
    foodDesc: 'Alle ~40 km versorgen wir euch mit Essen, Getränken und guter Laune. (Beispieldaten — Standorte werden noch bestätigt)',
    foodRoutesLabel: 'Strecken',
    infoLabel: 'Ausschreibung',
    infoTitle: 'Informationen & Anmeldung',
    infoCards: [
      { icon: '🏁', title: 'Veranstaltungsdetails', rows: [['Datum', 'Sonntag, 07.06.2026'], ['Veranstalter', 'RV Schleswig e.V.'], ['Landesverband', 'Schleswig-Holstein'], ['Veranst.-Nr. (RM)', '4129'], ['Veranst.-Nr. (RTF)', '2123'], ['Veranst.-Nr. (Gravel)', '6042']] },
      { icon: '📍', title: 'Startort', rows: [['Adresse', 'Erikstraße 50'], ['PLZ / Ort', '24837 Schleswig'], ['Gebäude', 'Dannewerkschule, Sporthalle'], ['Sternfahrt', 'Möglich'], ['Parken', 'Schulparkplatz kostenlos']] },
      { icon: '📞', title: 'Kontakt', rows: [['Ansprechpartner', 'Doris Zimmer'], ['Telefon', '0174 / 876 96 07'], ['E-Mail', 'doris_zimmer@gmx.net'], ['Website', 'rv-schleswig.de']] },
      { icon: '🛡️', title: 'Hinweise', rows: [['RTF 49 & 80 km', 'Ausgeschildert'], ['RTF 112 & 152 km', 'Geführte Gruppen'], ['Radmarathon', 'GPS-Track, geführt'], ['Gravel', 'GPS-Track'], ['Zusatz', 'V = Verpflegung']] },
    ],
    ctaTitle: 'Bereit für das Abenteuer?',
    ctaDesc: 'Melde dich jetzt an und erlebe die schönste Radtour Schleswig-Holsteins — Rund um die Schlei!',
    ctaRegister: 'Zur Anmeldung →',
    ctaMarathon: '⚡ Marathon auf Komoot',
    ctaGravel: '⚡ Gravel auf Komoot',
    footerBack: 'Zurück zur NordCup Karte',
    footerDisclaimer: 'Beispielseite — Daten ohne Gewähr',
  },
  en: {
    backToMap: 'Back to map',
    navLinks: [['#schedule', 'Schedule'], ['#routes', 'Routes'], ['#verpflegung', 'Food stops'], ['#info', 'Info']] as string[][],
    heroBadge: 'NordCup Cycling Marathon 2026',
    heroDesc: 'Cycling marathon, RTF & gravel ride — around the Schlei. Six routes, one adventure. From the family tour to the 208 km marathon.',
    heroMeta: [
      { icon: '📅', label: 'Sunday, June 7, 2026' },
      { icon: '📍', label: 'Schleswig — Dannewerkschule' },
      { icon: '🏢', label: 'RV Schleswig e.V.' },
    ],
    stats: [['6', 'Routes'], ['208', 'Max. km'], ['~900', 'Elevation (m)'], ['6', 'Food stops'], ['3', 'Disciplines'], ['07:30', 'First start']] as string[][],
    scheduleLabel: 'Schedule',
    scheduleTitle: 'Timetable & Start groups',
    scheduleDesc: 'All three disciplines start at the Dannewerkschule in Schleswig.',
    schedule: [
      { time: '06:30 AM', title: 'Registration & Check-In', desc: 'Dannewerkschule, Erikstraße 50, 24837 Schleswig — Sports hall' },
      { time: '07:30 AM', title: 'Start NordCup Cycling Marathon', desc: '208 km — Guided groups at various speeds', tag: 'GPS track' },
      { time: '08:00 AM', title: 'Start Gravel Route', desc: '82 km — Gravel, forest and field paths around the Schlei', tag: 'GPS track' },
      { time: '09:00 — 10:00 AM', title: 'Start RTF Routes', desc: '49 / 80 / 112 / 152 km — Family tour to performance tour', tag: 'Signposted / Guided' },
      { time: 'approx. 12:00 PM', title: 'First arrivals', desc: 'Family tour (49 km) — Hot showers, food & drinks at the finish' },
      { time: 'approx. 5:00 PM', title: 'Award ceremony', desc: 'Results, raffle, social gathering' },
    ],
    routesLabel: 'Routes',
    routesTitle: 'All routes at a glance',
    routesDesc: 'Click the filters to show or hide individual routes.',
    foodLabel: 'Food stations',
    foodTitle: 'Food & drink stations',
    foodDesc: 'Every ~40 km we supply you with food, drinks and good vibes. (Sample data — locations to be confirmed)',
    foodRoutesLabel: 'Routes',
    infoLabel: 'Event details',
    infoTitle: 'Information & Registration',
    infoCards: [
      { icon: '🏁', title: 'Event details', rows: [['Date', 'Sunday, 06/07/2026'], ['Organizer', 'RV Schleswig e.V.'], ['Regional assoc.', 'Schleswig-Holstein'], ['Event no. (RM)', '4129'], ['Event no. (RTF)', '2123'], ['Event no. (Gravel)', '6042']] },
      { icon: '📍', title: 'Start location', rows: [['Address', 'Erikstraße 50'], ['Postal code / City', '24837 Schleswig'], ['Building', 'Dannewerkschule, Sports hall'], ['Star ride', 'Possible'], ['Parking', 'School parking lot (free)']] },
      { icon: '📞', title: 'Contact', rows: [['Contact person', 'Doris Zimmer'], ['Phone', '0174 / 876 96 07'], ['E-Mail', 'doris_zimmer@gmx.net'], ['Website', 'rv-schleswig.de']] },
      { icon: '🛡️', title: 'Notes', rows: [['RTF 49 & 80 km', 'Signposted'], ['RTF 112 & 152 km', 'Guided groups'], ['Cycling marathon', 'GPS track, guided'], ['Gravel', 'GPS track'], ['Note', 'V = Food station']] },
    ],
    ctaTitle: 'Ready for the adventure?',
    ctaDesc: 'Register now and experience the most beautiful cycling tour in Schleswig-Holstein — around the Schlei!',
    ctaRegister: 'Register now →',
    ctaMarathon: '⚡ Marathon on Komoot',
    ctaGravel: '⚡ Gravel on Komoot',
    footerBack: 'Back to NordCup Map',
    footerDisclaimer: 'Sample page — data without guarantee',
  },
}

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
  const [lang, setLang] = useState<Lang>('de')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nordcup-prefs')
      if (saved) {
        const p = JSON.parse(saved)
        if (p.lang === 'en' || p.lang === 'de') setLang(p.lang)
      }
    } catch { /* ignore */ }

    const onStorage = () => {
      try {
        const saved = localStorage.getItem('nordcup-prefs')
        if (saved) {
          const p = JSON.parse(saved)
          if (p.lang === 'en' || p.lang === 'de') setLang(p.lang)
        }
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const t = vikingDict[lang]

  // merge schedule text with styles
  const schedule = t.schedule.map((item, i) => ({
    ...item,
    ...scheduleStyles[i],
  }))

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", background: c.bg, color: c.text, minHeight: '100vh', lineHeight: 1.6, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Nav ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 56, background: 'rgba(10,15,26,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.muted, fontSize: 14, fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 18, height: 18 }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {t.backToMap}
          </Link>
          <span style={{ fontWeight: 700, fontSize: 16, color: c.white }}>Viking Bike Challenge 2026</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {t.navLinks.map(([href, label]) => (
              <a key={href} href={href} style={{ color: c.muted, fontSize: 13, fontWeight: 500 }}>{label}</a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ marginTop: 56, padding: '80px 0 60px', background: 'linear-gradient(170deg, #0d1b30 0%, #0a0f1a 60%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,73,29,0.12)', color: c.marathon, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20, border: `1px solid rgba(232,73,29,0.2)` }}>
            {t.heroBadge}
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, color: c.white, lineHeight: 1.1, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Viking Bike<br /><span style={{ color: c.marathon }}>Challenge</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: c.muted, maxWidth: 600, marginBottom: 36 }}>
            {t.heroDesc}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 36 }}>
            {t.heroMeta.map((m) => (
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
            {t.stats.map(([num, label]) => (
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
          <SectionHeader label={t.scheduleLabel} title={t.scheduleTitle} desc={t.scheduleDesc} />
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
          <SectionHeader label={t.routesLabel} title={t.routesTitle} desc={t.routesDesc} />
          <VikingMap />
        </div>
      </section>

      {/* ── Route Cards ── */}
      <section style={{ paddingTop: 0, paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <RouteCards />
        </div>
      </section>

      {/* ── Food stations ── */}
      <section style={{ padding: '64px 0', background: c.bg2 }} id="verpflegung">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader label={t.foodLabel} title={t.foodTitle} desc={t.foodDesc} />
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
                  <div style={{ marginTop: 10, fontSize: 12, color: c.muted }}>{t.foodRoutesLabel}: {routeNames}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Info ── */}
      <section style={{ padding: '64px 0' }} id="info">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader label={t.infoLabel} title={t.infoTitle} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {t.infoCards.map((card) => (
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
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: c.white, marginBottom: 10 }}>{t.ctaTitle}</h3>
            <p style={{ color: c.muted, marginBottom: 24 }}>{t.ctaDesc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              <a href="https://rv-schleswig.de" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: c.marathon, color: '#fff', textDecoration: 'none' }}>{t.ctaRegister}</a>
              <a href="https://www.komoot.com/de-de/tour/2165067343" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: c.white, border: `1px solid ${c.border}`, textDecoration: 'none' }}>{t.ctaMarathon}</a>
              <a href="https://www.komoot.com/de-de/tour/2263487719" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: c.white, border: `1px solid ${c.border}`, textDecoration: 'none' }}>{t.ctaGravel}</a>
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
          <Link href="/" style={{ color: c.muted }}>{t.footerBack}</Link>
          {' · '}
          <em>{t.footerDisclaimer}</em>
        </div>
      </footer>
    </div>
  )
}
