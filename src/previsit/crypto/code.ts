// Share code: 10 Crockford base32 chars, shown as XXXXX-XXXXX (spec §5.3).
// The canonical form ("normalized code") INCLUDES the hyphen. It is the form
// used in the HKDF info string and in the lookup hash, so every caller must
// pass codes through normalizeCode/generateCode first.

import { base64urlEncode } from './base64url'

export const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

const RANDOM_LEN = 9
const CODE_LEN = 10

export type NormalizeResult =
  | { ok: true; code: string }
  | {
      ok: false
      error: 'incomplete' | 'invalid' | 'checksum'
      message: string
      // For 'invalid': the first offending character (as typed, uppercased).
      badChar?: string
    }

function checkChar(chars: string): string {
  let sum = 0
  for (let i = 0; i < RANDOM_LEN; i++) {
    sum += (i + 1) * CODE_ALPHABET.indexOf(chars[i])
  }
  return CODE_ALPHABET[sum % 32]
}

function display(chars: string): string {
  return `${chars.slice(0, 5)}-${chars.slice(5)}`
}

export function generateCode(): string {
  const bytes = new Uint8Array(RANDOM_LEN)
  globalThis.crypto.getRandomValues(bytes)
  // 256 is a multiple of 32, so masking is unbiased.
  let chars = ''
  for (const b of bytes) chars += CODE_ALPHABET[b & 31]
  return display(chars + checkChar(chars))
}

export function normalizeCode(input: string): NormalizeResult {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s-]+/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
  for (const ch of cleaned) {
    if (!CODE_ALPHABET.includes(ch)) {
      return {
        ok: false,
        error: 'invalid',
        badChar: ch,
        message: `"${ch}" is not used in codes`,
      }
    }
  }
  if (cleaned.length < CODE_LEN) {
    return {
      ok: false,
      error: 'incomplete',
      message: `Enter all ${CODE_LEN} characters`,
    }
  }
  if (cleaned.length > CODE_LEN) {
    return { ok: false, error: 'invalid', message: 'Code is too long' }
  }
  if (checkChar(cleaned) !== cleaned[RANDOM_LEN]) {
    return {
      ok: false,
      error: 'checksum',
      message: 'This code has a typo. Please check it.',
    }
  }
  return { ok: true, code: display(cleaned) }
}

export function isValidCode(input: string): boolean {
  return normalizeCode(input).ok
}

/** Server lookup key; the server never sees the code itself. */
export async function lookupFor(code: string): Promise<string> {
  const n = normalizeCode(code)
  if (!n.ok) throw new Error('Invalid code')
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode('previsit-lookup/v1|' + n.code)
  )
  return base64urlEncode(new Uint8Array(digest))
}
