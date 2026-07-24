import { Light, type Object3D } from "three";

export type LimitLightsResult = {
  total: number;
  kept: number;
  removed: number;
};

/** intensity 높은 순으로 max개만 남기고 나머지 제거 */
export function limitSceneLights(
  root: Object3D,
  max = 10,
): LimitLightsResult {
  const lights: Light[] = [];
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light);
  });

  const sorted = [...lights].sort(
    (a, b) => (b.intensity ?? 0) - (a.intensity ?? 0),
  );
  const keep = new Set(sorted.slice(0, max));

  let removed = 0;
  for (const light of lights) {
    if (keep.has(light)) continue;
    light.parent?.remove(light);
    light.dispose?.();
    removed += 1;
  }

  return {
    total: lights.length,
    kept: Math.min(lights.length, max),
    removed,
  };
}
