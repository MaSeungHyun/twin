import { Camera, Object3D } from "three";

import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";

export type CctvMarkerSource = {
  id: string;
  name: string;
  node: Object3D;
  floor: OfficeFloorObjectKey | null;
};

const FLOOR_NODE_TO_KEY: Record<string, OfficeFloorObjectKey> = {
  F1: "1F",
  F2: "2F",
  F3: "3F",
  F4: "4F",
};

function isSceneCamera(obj: Object3D): obj is Camera {
  return (obj as Camera).isCamera === true;
}

function resolveFloorKey(node: Object3D): OfficeFloorObjectKey | null {
  let current: Object3D | null = node;

  while (current) {
    const mapped = FLOOR_NODE_TO_KEY[current.name];
    if (mapped) return mapped;
    current = current.parent;
  }

  return null;
}

/** GLB scene 내 glTF Camera (Three.js Camera) 전부 수집 — 이름 필터 없음 */
export function collectCctvMarkers(root: Object3D): CctvMarkerSource[] {
  const cameras: Object3D[] = [];

  root.traverse((obj) => {
    if (isSceneCamera(obj)) {
      cameras.push(obj);
    }
  });

  cameras.sort((a, b) => a.name.localeCompare(b.name));

  return cameras.map((node, index) => ({
    id: node.uuid,
    name: node.name.trim() || `camera-${index + 1}`,
    node,
    floor: resolveFloorKey(node),
  }));
}
