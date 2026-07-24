/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.glb' {
  const src: string
  export default src
}

declare module '*.glb?url' {
  const src: string
  export default src
}

declare module '*.mp4' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly VITE_TAGO_SERVICE_KEY?: string
  readonly VITE_MODEL_URL_01?: string
  readonly VITE_MODEL_URL_02?: string
  readonly VITE_MODEL_URL_03?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
