/**
 * AES-256-GCM encryption/decryption for Strava data protection.
 *
 * The password hash (SHA-256, 32 bytes) is used as the AES key.
 * Encrypted format: JSON envelope { _encrypted: true, iv: hex, data: base64 }
 * The "data" payload is: ciphertext || authTag (last 16 bytes).
 *
 * - Build-time: Node.js `crypto` module encrypts (see fetch-strava.mjs)
 * - Runtime: Web Crypto API decrypts after the user authenticates
 */

const HASH_KEY = 'nordcup_dk' // decryption key storage key

/** Convert hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

/** Store the password hash for later decryption (called on login). */
export function storeDecryptionKey(hash: string): void {
  try {
    sessionStorage.setItem(HASH_KEY, hash)
  } catch { /* SSR or quota */ }
}

/** Retrieve the stored password hash. */
export function getDecryptionKey(): string | null {
  try {
    return sessionStorage.getItem(HASH_KEY)
  } catch {
    return null
  }
}

/** Clear the decryption key (called on logout). */
export function clearDecryptionKey(): void {
  try {
    sessionStorage.removeItem(HASH_KEY)
  } catch { /* SSR */ }
}

/** Encrypted envelope shape written by fetch-strava.mjs */
interface EncryptedEnvelope {
  _encrypted: true
  iv: string   // hex-encoded 12-byte IV
  data: string // base64-encoded (ciphertext + 16-byte GCM auth tag)
}

/** Check whether a fetched JSON payload is an encrypted envelope. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isEncrypted(json: any): json is EncryptedEnvelope {
  return json && json._encrypted === true && typeof json.iv === 'string' && typeof json.data === 'string'
}

/**
 * Decrypt an AES-256-GCM encrypted envelope using the stored password hash.
 * Returns the original JSON object, or throws on failure.
 */
export async function decryptPayload(envelope: EncryptedEnvelope): Promise<unknown> {
  const hash = getDecryptionKey()
  if (!hash) throw new Error('NO_KEY')

  const keyBytes = hexToBytes(hash)
  const iv = hexToBytes(envelope.iv)

  // base64 → ArrayBuffer (ciphertext + auth tag)
  const binaryStr = atob(envelope.data)
  const raw = new ArrayBuffer(binaryStr.length)
  const view = new Uint8Array(raw)
  for (let i = 0; i < binaryStr.length; i++) view[i] = binaryStr.charCodeAt(i)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    'AES-GCM',
    false,
    ['decrypt'],
  )

  // WebCrypto AES-GCM expects the auth tag appended to ciphertext
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    cryptoKey,
    raw,
  )

  const text = new TextDecoder().decode(decrypted)
  return JSON.parse(text)
}
