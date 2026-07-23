export type ModelId =
  | "model_32"
  | "model_64"
  | "model_128"
  | "model_256"
  | "model_512"
  | "model_city_32"
  | "model_city_64"
  | "model_city_128"
  | "model_city_256"
  | "model_city_512";

/** GitHub Release는 CORS 미지원 → /api/models 프록시 경유 (vite dev / Vercel Edge) */
const MODEL_PROXY_BASE = "/api/models";

const MODEL_URLS: Partial<Record<ModelId, string>> = {
  model_32: `${MODEL_PROXY_BASE}/model_32.glb`,
  model_64: `${MODEL_PROXY_BASE}/model_64.glb`,
  model_128: `${MODEL_PROXY_BASE}/model_128.glb`,
  model_256: `${MODEL_PROXY_BASE}/model_256.glb`,
  model_512: `${MODEL_PROXY_BASE}/model_512.glb`,
  model_city_32: `${MODEL_PROXY_BASE}/model_city_32.glb`,
  model_city_64: `${MODEL_PROXY_BASE}/model_city_64.glb`,
  model_city_128: `${MODEL_PROXY_BASE}/model_city_128.glb`,
  model_city_256: `${MODEL_PROXY_BASE}/model_city_256.glb`,
  model_city_512: `${MODEL_PROXY_BASE}/model_city_512.glb`,
};

export const MODEL_OPTIONS = [
  { id: "model_32" as const, label: "Model 32" },
  { id: "model_64" as const, label: "Model 64" },
  { id: "model_128" as const, label: "Model 128" },
  { id: "model_256" as const, label: "Model 256" },
  { id: "model_512" as const, label: "Model 512" },
  { id: "model_city_32" as const, label: "Model City 32" },
  { id: "model_city_64" as const, label: "Model City 64" },
  { id: "model_city_128" as const, label: "Model City 128" },
  { id: "model_city_256" as const, label: "Model City 256" },
  { id: "model_city_512" as const, label: "Model City 512" },
];

export const DEFAULT_MODEL_ID: ModelId = MODEL_OPTIONS[0]?.id ?? "model_32";

export function getModelUrl(id: ModelId): string {
  const url = MODEL_URLS[id]?.trim();
  if (!url) {
    throw new Error(`Missing model URL for ${id}`);
  }
  return url;
}
