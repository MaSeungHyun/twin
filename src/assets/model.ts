export type ModelId =
  | "model69"
  | "model70"
  | "model84"
  | "model89"
  | "model91"
  | "model92"
  | "model94"
  | "model170";

/** GitHub Release는 CORS 미지원 → /api/models 프록시 경유 (vite dev / Vercel Edge) */
const MODEL_PROXY_BASE = "/api/models";

const MODEL_URLS: Partial<Record<ModelId, string>> = {
  model69: `${MODEL_PROXY_BASE}/model69.glb`,
  model70: `${MODEL_PROXY_BASE}/model70.glb`,
  model84: `${MODEL_PROXY_BASE}/model84.glb`,
  model89: `${MODEL_PROXY_BASE}/model89.glb`,
  model91: `${MODEL_PROXY_BASE}/model91.glb`,
  model92: `${MODEL_PROXY_BASE}/model92.glb`,
  model94: `${MODEL_PROXY_BASE}/model94.glb`,
  model170: `${MODEL_PROXY_BASE}/model170.glb`,
};

export const MODEL_OPTIONS = [
  { id: "model69" as const, label: "Model 69" },
  { id: "model70" as const, label: "Model 70" },
  { id: "model84" as const, label: "Model 84" },
  { id: "model89" as const, label: "Model 89" },
  { id: "model91" as const, label: "Model 91" },
  { id: "model92" as const, label: "Model 92" },
  { id: "model94" as const, label: "Model 94" },
  { id: "model170" as const, label: "Model 170" },
]
  .map(({ id, label }) => ({
    id,
    label,
    url: MODEL_URLS[id]?.trim() ?? "",
  }))
  .filter((option) => option.url.length > 0);

export const DEFAULT_MODEL_ID: ModelId =
  MODEL_OPTIONS.find((option) => option.id === "model170")?.id ??
  MODEL_OPTIONS[0]?.id ??
  "model69";

export function getModelUrl(id: ModelId): string {
  const url = MODEL_URLS[id]?.trim();
  if (!url) {
    throw new Error(`Missing model URL for ${id}`);
  }
  return url;
}
