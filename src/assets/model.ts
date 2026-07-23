export type ModelId =
  | "model_metro_32"
  | "model_metro_64"
  | "model_metro_128"
  | "model_metro_256"
  | "model_metro_512"
  | "model_company_32"
  | "model_company_64"
  | "model_company_128"
  | "model_company_256"
  | "model_company_512"
  | "model_small_city_32"
  | "model_small_city_64"
  | "model_small_city_128"
  | "model_small_city_256"
  | "model_small_city_512";

/** GitHub Release는 CORS 미지원 → /api/models 프록시 경유 (vite dev / Vercel Edge) */
const MODEL_PROXY_BASE = "/api/models";

const MODEL_URLS: Partial<Record<ModelId, string>> = {
  model_metro_32: `${MODEL_PROXY_BASE}/model_metro_32.glb`,
  model_metro_64: `${MODEL_PROXY_BASE}/model_metro_64.glb`,
  model_metro_128: `${MODEL_PROXY_BASE}/model_metro_128.glb`,
  model_metro_256: `${MODEL_PROXY_BASE}/model_metro_256.glb`,
  model_metro_512: `${MODEL_PROXY_BASE}/model_metro_512.glb`,
  model_company_32: `${MODEL_PROXY_BASE}/model_company_32.glb`,
  model_company_64: `${MODEL_PROXY_BASE}/model_company_64.glb`,
  model_company_128: `${MODEL_PROXY_BASE}/model_company_128.glb`,
  model_company_256: `${MODEL_PROXY_BASE}/model_company_256.glb`,
  model_company_512: `${MODEL_PROXY_BASE}/model_company_512.glb`,
};

const GX = 320;
const GZ = 320;

/** 떨어진 배치 — 카메라 이동용. 그림자는 활성 모델을 추적 */
export const GALLERY_MODELS = [
  // model row
  {
    id: "model_metro_32" as const,
    label: "Model Metro 32",
    group: "model" as const,
    position: [-GX * 2, 0, 0] as [number, number, number],
  },
  {
    id: "model_metro_64" as const,
    label: "Model Metro 64",
    group: "model" as const,
    position: [-GX, 0, 0] as [number, number, number],
  },
  {
    id: "model_metro_128" as const,
    label: "Model Metro 128",
    group: "model" as const,
    position: [0, 0, 0] as [number, number, number],
  },
  {
    id: "model_metro_256" as const,
    label: "Model Metro 256",
    group: "model" as const,
    position: [GX, 0, 0] as [number, number, number],
  },
  {
    id: "model_metro_512" as const,
    label: "Model Metro 512",
    group: "model" as const,
    position: [GX * 2, 0, 0] as [number, number, number],
  },
  // company row
  {
    id: "model_company_32" as const,
    label: "Company 32",
    group: "company" as const,
    position: [-GX * 2, 0, GZ] as [number, number, number],
  },
  {
    id: "model_company_64" as const,
    label: "Company 64",
    group: "company" as const,
    position: [-GX, 0, GZ] as [number, number, number],
  },
  {
    id: "model_company_128" as const,
    label: "Company 128",
    group: "company" as const,
    position: [0, 0, GZ] as [number, number, number],
  },
  {
    id: "model_company_256" as const,
    label: "Company 256",
    group: "company" as const,
    position: [GX, 0, GZ] as [number, number, number],
  },
  {
    id: "model_company_512" as const,
    label: "Company 512",
    group: "company" as const,
    position: [GX * 2, 0, GZ] as [number, number, number],
  },
];

export type GalleryModelId = (typeof GALLERY_MODELS)[number]["id"];

export const MODEL_OPTIONS = [
  { id: "model_metro_32" as const, label: "Model Metro 32" },
  { id: "model_metro_64" as const, label: "Model Metro 64" },
  { id: "model_metro_128" as const, label: "Model Metro 128" },
  { id: "model_metro_256" as const, label: "Model Metro 256" },
  { id: "model_metro_512" as const, label: "Model Metro 512" },
  { id: "model_company_32" as const, label: "Model company 32" },
  { id: "model_company_64" as const, label: "Model company 64" },
  { id: "model_company_128" as const, label: "Model company 128" },
  { id: "model_company_256" as const, label: "Model company 256" },
  { id: "model_company_512" as const, label: "Model company 512" },
  { id: "model_small_city_32" as const, label: "Model small city 32" },
  { id: "model_small_city_64" as const, label: "Model small city 64" },
  { id: "model_small_city_128" as const, label: "Model small city 128" },
  { id: "model_small_city_256" as const, label: "Model small city 256" },
  { id: "model_small_city_512" as const, label: "Model small city 512" },
];

export const DEFAULT_MODEL_ID: ModelId =
  GALLERY_MODELS[0]?.id ?? "model_metro_32";

export function getModelUrl(id: ModelId): string {
  const url = MODEL_URLS[id]?.trim();
  if (!url) {
    throw new Error(`Missing model URL for ${id}`);
  }
  return url;
}
