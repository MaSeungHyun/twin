import { Box3, MathUtils, Vector3, type Object3D, type Mesh } from "three";

import type { GalleryModelId } from "@/assets/model";
import type { CameraFocus } from "@/stores/cameraStore";

/** 숨긴 메쉬도 포함해 바운딩 계산 (visible=false여도 focus 등록) */
export function computeFocusFromObject(
  id: GalleryModelId,
  object: Object3D,
): CameraFocus {
  const box = new Box3();
  object.updateWorldMatrix(true, true);
  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const geoBox = mesh.geometry.boundingBox;
    if (!geoBox) return;
    const world = geoBox.clone();
    world.applyMatrix4(mesh.matrixWorld);
    box.union(world);
  });

  if (box.isEmpty()) {
    box.setFromObject(object);
  }

  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const radius = Math.max(size.x, size.y, size.z, 1) * 0.5;
  const dist = MathUtils.clamp(radius * 1.15, 5, 120);
  const position = new Vector3(
    center.x + dist * 0.55,
    center.y + dist * 0.35,
    center.z + dist * 0.55,
  );

  return {
    id,
    target: [center.x, center.y, center.z],
    position: [position.x, position.y, position.z],
  };
}
