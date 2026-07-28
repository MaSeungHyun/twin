import { Camera, Object3D } from "three";

import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";
import { getOfficeFloorInstanceRegistry } from "@/three/officeFloorInstancing";

export type CctvMarkerSource = {
  id: string;
  name: string;
  node: Object3D;
  floor: OfficeFloorObjectKey | null;
};

const FLOOR_NODE_TO_KEY: Record<string, OfficeFloorObjectKey> = {
  OfficeFloorInstances: "1F",
  F1: "1F",
  "1F": "1F",
  F2: "2F",
  "2F": "2F",
  F3: "3F",
  "3F": "3F",
  F4: "4F",
  "4F": "4F",
};

const FLOOR_ORDER: OfficeFloorObjectKey[] = ["1F", "2F", "3F", "4F"];

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

function collectInstancedCctvMarkers(root: Object3D): CctvMarkerSource[] {
  const registry = getOfficeFloorInstanceRegistry(root);
  if (!registry) return [];

  const f1 = registry.floorObjects.get("1F");
  if (!f1) return [];

  const markers: CctvMarkerSource[] = [];

  const sourceCameras: Object3D[] = [];
  f1.traverse((obj) => {
    if (isSceneCamera(obj)) sourceCameras.push(obj);
  });
  sourceCameras.sort((a, b) => a.name.localeCompare(b.name));

  for (const node of sourceCameras) {
    markers.push({
      id: node.uuid,
      name: node.name.trim() || `camera-${markers.length + 1}`,
      node,
      floor: "1F",
    });
  }

  for (const { floor, source, proxy } of registry.cameraProxies) {
    markers.push({
      id: proxy.uuid,
      name: source.name.trim() || `camera-${markers.length + 1}`,
      node: proxy,
      floor,
    });
  }

  markers.sort((a, b) => {
    const floorDiff =
      FLOOR_ORDER.indexOf(a.floor ?? "1F") -
      FLOOR_ORDER.indexOf(b.floor ?? "1F");
    if (floorDiff !== 0) return floorDiff;
    return a.name.localeCompare(b.name);
  });

  return markers;
}

/** GLB scene 내 glTF Camera (Three.js Camera) 전부 수집 — 이름 필터 없음 */
export function collectCctvMarkers(root: Object3D): CctvMarkerSource[] {
  const instanced = collectInstancedCctvMarkers(root);
  if (instanced.length > 0) return instanced;

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
