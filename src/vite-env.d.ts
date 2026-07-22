/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_TAGO_SERVICE_KEY?: string
  readonly VITE_MODEL_URL_01?: string
  readonly VITE_MODEL_URL_02?: string
  readonly VITE_MODEL_URL_03?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
