/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_PREVISIT_ENABLED?: string
  readonly VITE_PREVISIT_PUBLIC_KEY_JWK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
