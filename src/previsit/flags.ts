// Feature flag for the pre-visit packet routes (spec M6). Anything other than
// the exact string "true" keeps /p/* and /clinic/previsit* rendering NotFound.
export function isPrevisitEnabled(): boolean {
  return import.meta.env.VITE_PREVISIT_ENABLED === 'true'
}
