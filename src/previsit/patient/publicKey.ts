export function readPublicKey(): JsonWebKey | null {
  const raw = import.meta.env.VITE_PREVISIT_PUBLIC_KEY_JWK
  if (!raw) return null
  try {
    const jwk = JSON.parse(raw)
    return jwk && typeof jwk === 'object' ? (jwk as JsonWebKey) : null
  } catch {
    return null
  }
}

