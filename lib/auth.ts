const TOKEN_KEY = 'nordcup_auth'
const TOKEN_VALUE = 'authenticated'

export function login(password: string): boolean {
  const expected = process.env.NEXT_PUBLIC_SITE_PASSWORD ?? 'radfahren2026'
  if (password === expected) {
    try {
      localStorage.setItem(TOKEN_KEY, TOKEN_VALUE)
    } catch {}
    return true
  }
  return false
}

export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(TOKEN_KEY) === TOKEN_VALUE
  } catch {
    return false
  }
}
