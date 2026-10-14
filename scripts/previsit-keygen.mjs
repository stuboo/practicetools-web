#!/usr/bin/env node
// Generates the practice ECDH P-256 key pair for pre-visit packets (spec §5.2).
// Usage: node scripts/previsit-keygen.mjs [outDir]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const dir = resolve(process.argv[2] ?? process.cwd())
const pubPath = join(dir, 'previsit-practice-public.jwk.json')
const privPath = join(dir, 'previsit-practice-private.jwk.json')

for (const p of [pubPath, privPath]) {
  if (existsSync(p)) {
    console.error(`Refusing to overwrite existing file: ${p}`)
    process.exit(1)
  }
}

const { subtle } = globalThis.crypto
const pair = await subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' },
  true,
  ['deriveBits']
)
const pub = await subtle.exportKey('jwk', pair.publicKey)
const priv = await subtle.exportKey('jwk', pair.privateKey)
delete pub.key_ops
delete pub.ext
delete priv.key_ops
delete priv.ext

mkdirSync(dir, { recursive: true })
writeFileSync(pubPath, JSON.stringify(pub, null, 2) + '\n', { flag: 'wx' })
writeFileSync(privPath, JSON.stringify(priv, null, 2) + '\n', {
  flag: 'wx',
  mode: 0o600,
})

console.log(`Wrote ${pubPath}`)
console.log(`Wrote ${privPath}  (keep offline; never commit)`)
console.log('\nAdd to .env:\n')
console.log(`VITE_PREVISIT_PUBLIC_KEY_JWK=${JSON.stringify(pub)}`)
