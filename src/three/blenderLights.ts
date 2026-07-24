import {
  DirectionalLight,
  Light,
  PointLight,
  SpotLight,
  type Object3D,
} from "three";

/**
 * Blender → glTF KHR_lights_punctual (Standard) 와 동일한 변환.
 * @see https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
 *
 * - Point / Spot Power (W) → candela: (W / 4π) × 683
 * - Sun / Directional (W/m²) → lux: W/m² × 683
 *
 * 683 = 555nm 기준 최대 시감효능 (lm/W)
 */
export const BLENDER_WATTS_TO_LUMENS = 683;

export type BlenderLightIntensityMode =
  /** GLB intensity ≈ Blender Energy/Power (W 또는 W/m²) — 물리 단위로 변환 */
  | "blender-energy"
  /** Blender Unitless 내보내기 (이미 /4π, 683 없음) — ×683 만 적용 */
  | "gltf-unitless"
  /** Blender Standard 내보내기 (이미 cd/lx) — 변환 없음 */
  | "gltf-standard";

export type BlenderLightConvertStats = {
  mode: BlenderLightIntensityMode;
  count: number;
  lights: Array<{
    name: string;
    type: string;
    before: number;
    after: number;
  }>;
};

function isPointLike(light: Light): light is PointLight | SpotLight {
  return (light as PointLight).isPointLight || (light as SpotLight).isSpotLight;
}

function isDirectional(light: Light): light is DirectionalLight {
  return (light as DirectionalLight).isDirectionalLight;
}

/** Blender Energy → Three.js / glTF punctual intensity */
export function blenderEnergyToThreeIntensity(
  energy: number,
  light: Light,
): number {
  if (isDirectional(light)) {
    return energy * BLENDER_WATTS_TO_LUMENS;
  }
  if (isPointLike(light)) {
    return (energy / (4 * Math.PI)) * BLENDER_WATTS_TO_LUMENS;
  }
  return energy;
}

/**
 * 씬의 Light.intensity를 Blender 단위 기준으로 재계산.
 * 기본값 `blender-energy`: 파일에 Blender Power가 그대로 들어왔다고 가정.
 */
export function applyBlenderLightIntensities(
  root: Object3D,
  mode: BlenderLightIntensityMode = "blender-energy",
): BlenderLightConvertStats {
  const lights: Light[] = [];
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light);
  });

  const report: BlenderLightConvertStats["lights"] = [];

  for (const light of lights) {
    const before = light.intensity;
    let after = before;

    if (mode === "blender-energy") {
      after = blenderEnergyToThreeIntensity(before, light);
    } else if (mode === "gltf-unitless") {
      // Unitless export: already /4π for point/spot, missing 683
      after = before * BLENDER_WATTS_TO_LUMENS;
    }
    // gltf-standard: already physical — leave as-is

    light.intensity = after;
    report.push({
      name: light.name || "(unnamed)",
      type: light.type,
      before,
      after,
    });
  }

  const stats: BlenderLightConvertStats = {
    mode,
    count: lights.length,
    lights: report,
  };
  console.log("[BlenderLights] converted", stats);
  return stats;
}
