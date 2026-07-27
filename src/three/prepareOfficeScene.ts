import { Mesh, type Object3D } from "three";

import { isMobileDevice } from "@/lib/device";
import { applyTextureBudget } from "@/three/textureBudget";

const preparedScenes = new WeakSet<Object3D>();

function enableMeshShadows(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
}

/**
 * Office GLB 전처리 — shadow / texture budget만 적용.
 * (층 GSAP 이동과 instancing/dedupe 조합 시 렌더가 깨져 Office에는 미적용)
 */
export function prepareOfficeScene(scene: Object3D): Object3D {
  if (preparedScenes.has(scene)) {
    return scene;
  }

  enableMeshShadows(scene);
  applyTextureBudget(scene, isMobileDevice() ? 1 : 2);
  preparedScenes.add(scene);

  return scene;
}
