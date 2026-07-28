import { Camera, Group, Mesh, Object3D } from "three";

import { FLOOR_OBJECT_CANDIDATES } from "@/data/officeFloorActions";
import { OFFICE_FLOOR_RUNTIME_CLONE } from "@/three/officeFloorClones";
import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";

const RUNTIME_INSTANCES_ROOT = "RuntimeOfficeFloorInstances";

function findFloorRoot(
  root: Object3D,
  key: OfficeFloorObjectKey,
): Object3D | null {
  for (const name of FLOOR_OBJECT_CANDIDATES[key]) {
    const object = root.getObjectByName(name);
    if (object) return object;
  }
  return null;
}

function isSceneCamera(obj: Object3D): obj is Camera {
  return (obj as Camera).isCamera === true;
}

function isBuildingContent(obj: Object3D): boolean {
  if (obj.name === RUNTIME_INSTANCES_ROOT) return false;
  if (obj.userData?.[OFFICE_FLOOR_RUNTIME_CLONE]) return false;
  if ((obj as Mesh).isMesh) return true;
  if (isSceneCamera(obj)) return true;
  return obj.children.length > 0;
}

function reparentIntoFloorRoot(floorRoot: Object3D, sceneRoot: Object3D) {
  const toMove = sceneRoot.children.filter(
    (child) => child !== floorRoot && isBuildingContent(child),
  );
  for (const child of toMove) {
    floorRoot.add(child);
  }
}

/**
 * optimize/flat export 대응 — 1F 루트(OfficeFloorInstances)가 없거나 비어 있으면 런타임에 구성.
 * 층 인스턴싱·clone이 동작하려면 메시·CCTV 카메라가 이 루트 아래 있어야 함.
 */
export function ensureOfficeFloorRoot(sceneRoot: Object3D): Object3D | null {
  let floorRoot = findFloorRoot(sceneRoot, "1F");

  if (!floorRoot) {
    floorRoot = new Group();
    floorRoot.name = FLOOR_OBJECT_CANDIDATES["1F"][0];
    sceneRoot.add(floorRoot);
  }

  reparentIntoFloorRoot(floorRoot, sceneRoot);
  sceneRoot.updateMatrixWorld(true);
  return floorRoot;
}

export { findFloorRoot };
