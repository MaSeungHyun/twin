export type ModelId = "model01" | "model02" | "model03";

/** GitHub Release는 CORS 미지원 → /api/models 프록시 경유 (vite dev / Vercel Edge) */
const MODEL_PROXY_BASE = "/api/models";

const MODEL_URLS: Record<ModelId, string | undefined> = {
  model01: `${MODEL_PROXY_BASE}/model01.glb`,
  model02: `${MODEL_PROXY_BASE}/model02.glb`,
  model03: `${MODEL_PROXY_BASE}/model03.glb`,
};

export const MODEL_OPTIONS = [
  { id: "model01" as const, label: "Model 01" },
  { id: "model02" as const, label: "Model 02" },
  { id: "model03" as const, label: "Model 03" },
]
  .map(({ id, label }) => ({
    id,
    label,
    url: MODEL_URLS[id]?.trim() ?? "",
  }))
  .filter((option) => option.url.length > 0);

export const DEFAULT_MODEL_ID: ModelId =
  MODEL_OPTIONS.find((option) => option.id === "model01")?.id ??
  MODEL_OPTIONS[0]?.id ??
  "model01";

export function getModelUrl(id: ModelId): string {
  const url = MODEL_URLS[id]?.trim();
  if (!url) {
    throw new Error(`Missing model URL for ${id}`);
  }
  return url;
}
