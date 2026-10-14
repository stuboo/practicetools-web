// Pre-visit submission envelope v1 (spec §5.4, §5.5).
// ECDH P-256 -> HKDF-SHA256 -> AES-256-GCM. WebCrypto only.

import type { SubmissionPayload } from '../types'
import { base64urlDecode, base64urlEncode } from './base64url'
import { normalizeCode } from './code'

export type Envelope = {
  v: 1
  packetId: string
  epk: string // 65-byte uncompressed P-256 point, base64url
  salt: string // 16 bytes
  iv: string // 12 bytes
  ct: string // AES-GCM ciphertext + tag
}

/** The only error thrown by openEnvelope, whatever the cause. */
export class EnvelopeError extends Error {
  constructor() {
    super('Code not found or could not be opened')
    this.name = 'EnvelopeError'
  }
}

const subtle = () => globalThis.crypto.subtle
const utf8 = (s: string) => new TextEncoder().encode(s)
const ECDH_ALG = { name: 'ECDH', namedCurve: 'P-256' } as const
const VERSION_TAG = 'previsit/v1|'

export function importPracticePublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return subtle().importKey('jwk', jwk, ECDH_ALG, true, [])
}

export function importPracticePrivateKey(
  jwk: JsonWebKey,
  opts: { extractable?: boolean } = {}
): Promise<CryptoKey> {
  return subtle().importKey('jwk', jwk, ECDH_ALG, opts.extractable ?? false, [
    'deriveBits',
  ])
}

async function deriveAesKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  salt: Uint8Array,
  code: string
): Promise<CryptoKey> {
  const shared = await subtle().deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  )
  const ikm = await subtle().importKey('raw', shared, 'HKDF', false, [
    'deriveKey',
  ])
  return subtle().deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt as BufferSource,
      info: utf8(VERSION_TAG + code),
    },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function sealEnvelope(
  payload: SubmissionPayload,
  code: string,
  practicePublicJwk: JsonWebKey
): Promise<Envelope> {
  const n = normalizeCode(code)
  if (!n.ok) throw new Error('Invalid share code')
  const practicePublic = await importPracticePublicKey(practicePublicJwk)
  const eph = await subtle().generateKey(ECDH_ALG, true, ['deriveBits'])
  const epk = new Uint8Array(await subtle().exportKey('raw', eph.publicKey))
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKey(eph.privateKey, practicePublic, salt, n.code)
  const ct = await subtle().encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      additionalData: utf8(VERSION_TAG + payload.packetId),
    },
    key,
    utf8(JSON.stringify(payload))
  )
  return {
    v: 1,
    packetId: payload.packetId,
    epk: base64urlEncode(epk),
    salt: base64urlEncode(salt),
    iv: base64urlEncode(iv),
    ct: base64urlEncode(new Uint8Array(ct)),
  }
}

function parseEnvelope(env: unknown) {
  const e = env as Partial<Record<keyof Envelope, unknown>> | null
  if (
    !e ||
    typeof e !== 'object' ||
    e.v !== 1 ||
    typeof e.packetId !== 'string' ||
    e.packetId.length === 0 ||
    typeof e.epk !== 'string' ||
    typeof e.salt !== 'string' ||
    typeof e.iv !== 'string' ||
    typeof e.ct !== 'string'
  ) {
    throw new EnvelopeError()
  }
  const epk = base64urlDecode(e.epk)
  const salt = base64urlDecode(e.salt)
  const iv = base64urlDecode(e.iv)
  const ct = base64urlDecode(e.ct)
  if (
    epk.length !== 65 ||
    epk[0] !== 4 ||
    salt.length !== 16 ||
    iv.length !== 12 ||
    ct.length < 16
  ) {
    throw new EnvelopeError()
  }
  return { packetId: e.packetId, epk, salt, iv, ct }
}

export async function openEnvelope(
  envelope: Envelope,
  code: string,
  practicePrivateKey: CryptoKey
): Promise<SubmissionPayload> {
  try {
    const n = normalizeCode(code)
    if (!n.ok) throw new EnvelopeError()
    const p = parseEnvelope(envelope)
    const epk = await subtle().importKey(
      'raw',
      p.epk as BufferSource,
      ECDH_ALG,
      true,
      []
    )
    const key = await deriveAesKey(practicePrivateKey, epk, p.salt, n.code)
    const pt = await subtle().decrypt(
      {
        name: 'AES-GCM',
        iv: p.iv as BufferSource,
        additionalData: utf8(VERSION_TAG + p.packetId),
      },
      key,
      p.ct as BufferSource
    )
    const payload = JSON.parse(new TextDecoder().decode(pt))
    if (
      !payload ||
      payload.schema !== 'previsit-submission/v1' ||
      payload.packetId !== p.packetId
    ) {
      throw new EnvelopeError()
    }
    return payload as SubmissionPayload
  } catch {
    throw new EnvelopeError()
  }
}
