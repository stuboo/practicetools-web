// Practice private key storage for the clinic viewer (spec §3.2, §5.2).
// The key is kept as a non-extractable CryptoKey object in IndexedDB. The JWK
// text is parsed, imported, and dropped; callers must not retain it.

import { importPracticePrivateKey } from '../crypto/envelope'

const DB_NAME = 'previsit-clinic'
const STORE = 'keys'
const KEY_ID = 'practice-private'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

/** Returns the stored key, or null if absent or storage is unavailable. */
export async function getPracticeKey(): Promise<CryptoKey | null> {
  try {
    const k = await withStore<CryptoKey | undefined>('readonly', (s) =>
      s.get(KEY_ID)
    )
    return k ?? null
  } catch {
    return null
  }
}

/** Persists a key. Returns false if storage failed. */
export async function savePracticeKey(key: CryptoKey): Promise<boolean> {
  try {
    await withStore('readwrite', (s) => s.put(key, KEY_ID))
    return true
  } catch {
    return false
  }
}

export async function removePracticeKey(): Promise<boolean> {
  try {
    await withStore('readwrite', (s) => s.delete(KEY_ID))
    return true
  } catch {
    return false
  }
}

export type ImportResult = { ok: true } | { ok: false; message: string }

/** Validate a P-256 ECDH private JWK (as file text), import non-extractable, save. */
export async function importKeyFromJwkText(text: string): Promise<ImportResult> {
  let jwk: JsonWebKey
  try {
    jwk = JSON.parse(text) as JsonWebKey
  } catch {
    return { ok: false, message: 'That file is not valid JSON.' }
  }
  if (
    !jwk ||
    jwk.kty !== 'EC' ||
    jwk.crv !== 'P-256' ||
    typeof jwk.d !== 'string' ||
    !jwk.d
  ) {
    return {
      ok: false,
      message: 'That file is not a P-256 private key (JWK with a "d" value).',
    }
  }
  try {
    const key = await importPracticePrivateKey(jwk, { extractable: false })
    const saved = await savePracticeKey(key)
    if (!saved) {
      return { ok: false, message: 'This browser could not store the key.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: 'The key could not be imported.' }
  }
}
