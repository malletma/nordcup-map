'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { login } from '@/lib/auth'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    setTimeout(() => {
      const ok = login(password)
      if (ok) {
        router.push('/mein-bereich')
      } else {
        setError(true)
        setLoading(false)
        setPassword('')
      }
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
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
        Zur Karte
      </Link>

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
            Mein Bereich
          </h1>
          <p style={{ color: '#7a8599', fontSize: 14, marginTop: 6, marginBottom: 0 }}>
            Persönliches Radsport-Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c8d3e5', marginBottom: 8 }}>
              Passwort
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
                Falsches Passwort. Bitte nochmal versuchen.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              padding: '13px 24px',
              background: loading ? 'rgba(61,125,214,0.5)' : 'linear-gradient(135deg, #2563eb, #3d7dd6)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !password ? 'default' : 'pointer',
              transition: 'opacity 0.2s, transform 0.1s',
              marginTop: 4,
              letterSpacing: '0.01em',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              opacity: !password ? 0.6 : 1,
            }}
          >
            {loading ? 'Einloggen …' : 'Einloggen →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, marginBottom: 0, fontSize: 12, color: '#4a5568' }}>
          Privater Bereich — nur für den Besitzer dieser Seite.
        </p>
      </div>
    </div>
  )
}
