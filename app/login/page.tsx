'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { login } from '@/lib/auth'
import Link from 'next/link'

const loginDict = {
  de: {
    title: 'Mein Bereich', sub: 'Persönliches Radsport-Dashboard',
    label: 'Passwort', error: 'Falsches Passwort. Bitte nochmal versuchen.',
    btn: 'Einloggen →', loading: 'Einloggen …', locked: 'Gesperrt ⏳',
    lockMsg: 'Zu viele Versuche. Bitte 60 Sekunden warten.',
    footer: 'Privater Bereich — nur für den Besitzer dieser Seite.',
    backLink: 'Zur Karte',
  },
  en: {
    title: 'My Dashboard', sub: 'Personal Cycling Dashboard',
    label: 'Password', error: 'Wrong password. Please try again.',
    btn: 'Log in →', loading: 'Logging in …', locked: 'Locked ⏳',
    lockMsg: 'Too many attempts. Please wait 60 seconds.',
    footer: 'Private area — only for the owner of this page.',
    backLink: 'Back to Map',
  },
} as const
type LoginLang = keyof typeof loginDict

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lockMsg, setLockMsg] = useState('')
  const [lang, setLang] = useState<LoginLang>('de')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nordcup-prefs')
      if (saved) { const p = JSON.parse(saved); if (p.lang === 'en' || p.lang === 'de') setLang(p.lang) }
    } catch { /* ignore */ }
  }, [])

  const t = loginDict[lang]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (locked) return
    setLoading(true)
    setError(false)
    // Exponential backoff: 400ms, 1s, 2s, 4s, 8s, 16s, 30s max
    const delay = Math.min(400 * Math.pow(2, attempts), 30000)
    await new Promise((r) => setTimeout(r, delay))
    const ok = await login(password)
    if (ok) {
      router.push('/mein-bereich')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setError(true)
      setLoading(false)
      setPassword('')
      // Lock after 5 failed attempts for 60 seconds
      if (newAttempts >= 5) {
        setLocked(true)
        setLockMsg(t.lockMsg)
        setTimeout(() => { setLocked(false); setAttempts(0); setLockMsg('') }, 60000)
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "var(--font-inter, 'Inter'), ui-sans-serif, system-ui, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      padding: '0 20px',
    }}>
      {/* Back link */}
      <Link href="/" style={{
        position: 'absolute', top: 24, left: 24,
        display: 'flex', alignItems: 'center', gap: 6,
        color: '#7a8599', fontSize: 13, fontWeight: 500,
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {t.backLink}
      </Link>

      {/* Language toggle */}
      <button onClick={() => { const nl = lang === 'de' ? 'en' : 'de'; setLang(nl); try { const saved = localStorage.getItem('nordcup-prefs'); const prefs = saved ? JSON.parse(saved) : {}; prefs.lang = nl; localStorage.setItem('nordcup-prefs', JSON.stringify(prefs)) } catch {} }} style={{
        position: 'absolute', top: 24, right: 24,
        padding: '4px 10px', background: 'rgba(61,125,214,0.1)', border: '1px solid rgba(61,125,214,0.2)',
        color: '#3d7dd6', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        {lang === 'de' ? '🇩🇪' : '🇬🇧'}
      </button>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#0f1724',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '40px 36px 44px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #1e3a5f, #3d7dd6)',
            fontSize: 28, marginBottom: 16,
            boxShadow: '0 8px 24px rgba(61,125,214,0.3)',
          }}>🚴</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e6eef8', margin: 0, letterSpacing: '-0.01em' }}>
            {t.title}
          </h1>
          <p style={{ color: '#7a8599', fontSize: 14, marginTop: 6, marginBottom: 0 }}>
            {t.sub}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c8d3e5', marginBottom: 8 }}>
              {t.label}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder="••••••••••••"
              autoFocus
              autoComplete="current-password"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 16px',
                background: '#0b1220',
                border: `1.5px solid ${error ? '#e74c3c' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10,
                color: '#e6eef8',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => !error && (e.target.style.borderColor = '#3d7dd6')}
              onBlur={(e) => !error && (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            {error && (
              <p style={{ color: '#e74c3c', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
                {t.error}
              </p>
            )}
            {lockMsg && (
              <p style={{ color: '#f59e0b', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
                {lockMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password || locked}
            style={{
              padding: '13px 24px',
              background: loading ? 'rgba(61,125,214,0.5)' : 'linear-gradient(135deg, #2563eb, #3d7dd6)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !password || locked ? 'default' : 'pointer',
              transition: 'opacity 0.2s, transform 0.1s',
              marginTop: 4,
              letterSpacing: '0.01em',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              opacity: !password || locked ? 0.6 : 1,
            }}
          >
            {locked ? t.locked : loading ? t.loading : t.btn}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, marginBottom: 0, fontSize: 12, color: '#4a5568' }}>
          {t.footer}
        </p>
      </div>
    </div>
  )
}
