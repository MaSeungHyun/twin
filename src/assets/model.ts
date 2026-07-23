export type ModelId =
  | "model"
  | "model_256"
  | "model_512"
  | "model_1024"
  | "model_2048";

/** GitHub Release는 CORS 미지원 → /api/models 프록시 경유 (vite dev / Vercel Edge) */
const MODEL_PROXY_BASE = "/api/models";

const MODEL_URLS: Partial<Record<ModelId, string>> = {
  model: `${MODEL_PROXY_BASE}/model.glb`,
  model_256: `${MODEL_PROXY_BASE}/model_256.glb`,
  model_512: `${MODEL_PROXY_BASE}/model_512.glb`,
  model_1024: `${MODEL_PROXY_BASE}/model_1024.glb`,
  model_2048: `${MODEL_PROXY_BASE}/model_2048.glb`,
};

export const MODEL_OPTIONS = [
  { id: "model" as const, label: "Model" },
  { id: "model_256" as const, label: "Model 256" },
  { id: "model_512" as const, label: "Model 512" },
  { id: "model_1024" as const, label: "Model 1024" },
  { id: "model_2048" as const, label: "Model 2048" },
];

export const DEFAULT_MODEL_ID: ModelId = MODEL_OPTIONS[0]?.id ?? "model";

export function getModelUrl(id: ModelId): string {
  const url = MODEL_URLS[id]?.trim();
  if (!url) {
    throw new Error(`Missing model URL for ${id}`);
  }
  return url;
}
