/**
 * Client-side authentication with SHA-256 hashed password comparison.
 *
 * The plaintext password is NEVER stored in the JS bundle.
 * Only the SHA-256 hash is shipped via NEXT_PUBLIC_PASSWORD_HASH.
 *
 * On login, the password hash is also stored in sessionStorage so
 * the dashboard can decrypt the AES-256-GCM encrypted Strava data.
 *
 * On Vercel / server-deployed environments, consider upgrading to
 * NextAuth.js or server-side session-based auth.
 */

import { storeDecryptionKey, clearDecryptionKey } from '@/lib/crypto'

const TOKEN_KEY = 'nordcup_auth'
const TOKEN_VALUE = 'authenticated'

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify password against stored SHA-256 hash.
 * Returns true and persists auth token + decryption key on success.
 */
export async function login(password: string): Promise<boolean> {
  const expectedHash = process.env.NEXT_PUBLIC_PASSWORD_HASH
  if (!expectedHash) {
    console.error('NEXT_PUBLIC_PASSWORD_HASH is not configured')
    return false
  }
  const inputHash = await sha256(password)

  if (inputHash === expectedHash) {
    try {
      sessionStorage.setItem(TOKEN_KEY, TOKEN_VALUE)
    } catch {
      /* SSR or quota */
    }
    // Store hash as AES decryption key for encrypted Strava data
    storeDecryptionKey(inputHash)
    return true
  }
  return false
}

export function logout(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* SSR */
  }
  clearDecryptionKey()
}

export function isAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(TOKEN_KEY) === TOKEN_VALUE
  } catch {
    return false
  }
}
