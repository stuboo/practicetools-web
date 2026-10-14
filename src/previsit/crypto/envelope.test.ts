// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { SubmissionPayload } from '../types'
import { base64urlDecode, base64urlEncode } from './base64url'
import {
  CODE_ALPHABET,
  generateCode,
  isValidCode,
  lookupFor,
  normalizeCode,
} from './code'
import {
  EnvelopeError,
  importPracticePrivateKey,
  openEnvelope,
  sealEnvelope,
} from './envelope'
import {
  TEST_ONLY_PRIVATE_JWK,
  TEST_ONLY_PUBLIC_JWK,
} from './__fixtures__/testKeys'

const payload: SubmissionPayload = {
  schema: 'previsit-submission/v1',
  packetId: 'new-incontinence',
  packetVersion: 1,
  createdAt: '2026-11-01T06:00:00-05:00',
  diary: {
    unit: 'ml',
    events: [
      {
        id: 'a',
        t: '2026-11-01T06:00:00-05:00',
        kind: 'void',
        volumeMl: 250,
        urgency: 2,
      },
      { id: 'b', t: '2026-11-01T07:00:00-05:00', kind: 'bed' },
    ],
  },
  patientNote: 'Unicode check: café, 日本語',
}

const privateKey = () => importPracticePrivateKey(TEST_ONLY_PRIVATE_JWK)

describe('base64url', () => {
  it('round trips without padding', () => {
    for (let n = 0; n < 40; n++) {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(n))
      const s = base64urlEncode(bytes)
      expect(s).toMatch(/^[A-Za-z0-9_-]*$/)
      expect(Array.from(base64urlDecode(s))).toEqual(Array.from(bytes))
    }
  })
})

describe('envelope', () => {
  it('round trip recovers the exact payload', async () => {
    const code = generateCode()
    const env = await sealEnvelope(payload, code, TEST_ONLY_PUBLIC_JWK)
    expect(env.v).toBe(1)
    expect(env.packetId).toBe(payload.packetId)
    expect(base64urlDecode(env.epk)).toHaveLength(65)
    expect(base64urlDecode(env.salt)).toHaveLength(16)
    expect(base64urlDecode(env.iv)).toHaveLength(12)
    const out = await openEnvelope(
      env,
      code.toLowerCase().replace('-', ' '),
      await privateKey()
    )
    expect(out).toEqual(payload)
  })

  it('fails with the wrong code', async () => {
    const code = generateCode()
    const other = generateCode()
    const env = await sealEnvelope(payload, code, TEST_ONLY_PUBLIC_JWK)
    await expect(
      openEnvelope(env, other, await privateKey())
    ).rejects.toBeInstanceOf(EnvelopeError)
  })

  it('fails with the wrong private key', async () => {
    const code = generateCode()
    const env = await sealEnvelope(payload, code, TEST_ONLY_PUBLIC_JWK)
    const pair = await globalThis.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    )
    await expect(
      openEnvelope(env, code, pair.privateKey)
    ).rejects.toBeInstanceOf(EnvelopeError)
  })

  it('fails when one bit of ct is flipped', async () => {
    const code = generateCode()
    const env = await sealEnvelope(payload, code, TEST_ONLY_PUBLIC_JWK)
    const ct = base64urlDecode(env.ct)
    ct[3] ^= 1
    await expect(
      openEnvelope(
        { ...env, ct: base64urlEncode(ct) },
        code,
        await privateKey()
      )
    ).rejects.toBeInstanceOf(EnvelopeError)
  })

  it('fails when packetId is changed (AAD)', async () => {
    const code = generateCode()
    const env = await sealEnvelope(payload, code, TEST_ONLY_PUBLIC_JWK)
    await expect(
      openEnvelope(
        { ...env, packetId: 'other-packet' },
        code,
        await privateKey()
      )
    ).rejects.toBeInstanceOf(EnvelopeError)
  })

  it('rejects malformed envelopes with the same error', async () => {
    const code = generateCode()
    const env = await sealEnvelope(payload, code, TEST_ONLY_PUBLIC_JWK)
    const key = await privateKey()
    const bad = [
      null,
      {},
      { ...env, v: 2 },
      { ...env, epk: 'AAAA' },
      { ...env, iv: '!!!' },
      { ...env, ct: '' },
    ]
    for (const b of bad) {
      await expect(openEnvelope(b as never, code, key)).rejects.toBeInstanceOf(
        EnvelopeError
      )
    }
  })
})

describe('share code', () => {
  it('1,000 generated codes are valid', () => {
    for (let i = 0; i < 1000; i++) {
      const c = generateCode()
      expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/)
      expect(isValidCode(c)).toBe(true)
    }
  })

  it('normalizes case, spaces and hyphens', () => {
    expect(normalizeCode('abcde fghjj')).toEqual({
      ok: true,
      code: 'ABCDE-FGHJJ',
    })
    const c = generateCode()
    expect(normalizeCode(c.replace('-', '').toLowerCase())).toEqual({
      ok: true,
      code: c,
    })
  })

  it('spec example abcde fghjk has a bad check char', () => {
    // Spec §5.6 uses this string only to illustrate normalization; its 10th
    // char does not satisfy the §5.3 checksum (correct one is J).
    const r = normalizeCode('abcde fghjk')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('checksum')
  })

  it('maps O->0, I->1, L->1', () => {
    const c = generateCode()
    const swapped = c
      .replace(/0/g, 'O')
      .replace(/1/g, (_, i) => (i % 2 ? 'I' : 'L'))
    expect(normalizeCode(swapped)).toEqual({ ok: true, code: c })
  })

  it('rejects U and wrong length with distinct errors', () => {
    const r = normalizeCode('UBCDE-FGHJK')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('invalid')
    const short = normalizeCode('ABCD')
    if (!short.ok) expect(short.error).toBe('incomplete')
    expect(short.ok).toBe(false)
    const long = normalizeCode('ABCDE-FGHJJ0')
    if (!long.ok) expect(long.error).toBe('invalid')
    expect(long.ok).toBe(false)
  })

  it('checksum catches a single-character typo', () => {
    // Weights are 1..9, so a +1 change at any position changes the sum mod 32.
    for (let i = 0; i < 10; i++) {
      const c = generateCode().replace('-', '')
      const next = CODE_ALPHABET[(CODE_ALPHABET.indexOf(c[i]) + 1) % 32]
      const typo = c.slice(0, i) + next + c.slice(i + 1)
      const r = normalizeCode(typo)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toBe('checksum')
    }
  })

  it('lookupFor is stable, normalization-insensitive, and base64url', async () => {
    const a = await lookupFor('abcde fghjj')
    expect(a).toBe(await lookupFor('ABCDE-FGHJJ'))
    expect(base64urlDecode(a)).toHaveLength(32)
    expect(a).not.toBe(await lookupFor(generateCode()))
  })
})
