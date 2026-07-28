import {
  Box3,
  Mesh,
  type Object3D,
  type BufferGeometry,
  type Matrix4,
  Vector3,
} from "three";

import type { CctvAlarmSeverity } from "@/lib/cctvAlarm";
import { getOfficeFloorInstanceRegistry } from "@/three/officeFloorInstancing";
import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";

/** GLB 바닥 메시 (Unreal StaticMesh 익스포트명) */
export const OFFICE_FLOOR_MESH_NAME = "SM_Cube9_StaticMeshComponent0";

/** 바닥 위 오프셋 */
export const HEATMAP_Y_EPS = 0.25;

/** UI severity 토큰과 동일 — emissive 색 */
export const HEATMAP_EMISSIVE_HEX: Record<CctvAlarmSeverity, number> = {
  warning: 0xffa800,
  critical: 0xff0000,
};

export type FloorHeatmapBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  topY: number;
};

export type HeatmapStamp = {
  cameraName: string;
  x: number;
  z: number;
  /** 깜빡임 위상 오프셋 */
  phase: number;
  /** Plane 가로 (월드, 6~10) */
  sizeX: number;
  /** Plane 세로 (월드, 6~10) */
  sizeZ: number;
};

/** 이름 기반 0~1 — 층 바뀌어도 같은 카메라면 동일 크기 */
function hash01(value: string, salt: number): number {
  let hash = salt | 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

/** [6, 10] 구간 */
function randomPlaneSize(seed01: number): number {
  return 8 + seed01 * 5;
}

const _box = new Box3();
const _v = new Vector3();

function isMeshLike(obj: Object3D): obj is Mesh {
  return (obj as Mesh).isMesh === true;
}

function boundsFromGeometry(
  geometry: BufferGeometry,
  matrixWorld: Matrix4,
  reference: Object3D,
): FloorHeatmapBounds | null {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  if (!bb) return null;

  _box.copy(bb).applyMatrix4(matrixWorld);
  reference.updateMatrixWorld(true);

  const corners = [
    new Vector3(_box.min.x, _box.min.y, _box.min.z),
    new Vector3(_box.min.x, _box.min.y, _box.max.z),
    new Vector3(_box.min.x, _box.max.y, _box.min.z),
    new Vector3(_box.min.x, _box.max.y, _box.max.z),
    new Vector3(_box.max.x, _box.min.y, _box.min.z),
    new Vector3(_box.max.x, _box.min.y, _box.max.z),
    new Vector3(_box.max.x, _box.max.y, _box.min.z),
    new Vector3(_box.max.x, _box.max.y, _box.max.z),
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let topY = -Infinity;

  for (const corner of corners) {
    reference.worldToLocal(corner);
    minX = Math.min(minX, corner.x);
    maxX = Math.max(maxX, corner.x);
    minZ = Math.min(minZ, corner.z);
    maxZ = Math.max(maxZ, corner.z);
    topY = Math.max(topY, corner.y);
  }

  if (!Number.isFinite(minX) || maxX - minX < 1e-4 || maxZ - minZ < 1e-4) {
    return null;
  }

  return { minX, maxX, minZ, maxZ, topY };
}

/**
 * SM_Cube9 바닥 AABB → 기준 층(F1) 로컬 bounds.
 */
export function resolveFloorHeatmapBounds(
  root: Object3D,
  referenceFloor: Object3D,
): FloorHeatmapBounds | null {
  const registry = getOfficeFloorInstanceRegistry(root);
  if (registry) {
    const entry = registry.entries.find((e) =>
      e.instanced.name.includes(OFFICE_FLOOR_MESH_NAME),
    );
    if (entry) {
      return boundsFromGeometry(
        entry.instanced.geometry,
        entry.baseWorldMatrix,
        referenceFloor,
      );
    }
  }

  const found: { mesh: Mesh | null } = { mesh: null };
  root.traverse((obj) => {
    if (found.mesh || !isMeshLike(obj)) return;
    if (
      obj.name === OFFICE_FLOOR_MESH_NAME ||
      obj.name.includes(OFFICE_FLOOR_MESH_NAME)
    ) {
      found.mesh = obj;
    }
  });

  if (!found.mesh) return null;
  found.mesh.updateMatrixWorld(true);
  return boundsFromGeometry(
    found.mesh.geometry,
    found.mesh.matrixWorld,
    referenceFloor,
  );
}

export function collectHeatmapStampsForFloor(
  markers: ReadonlyArray<{
    node: Object3D;
    floor: OfficeFloorObjectKey | null;
    name: string;
  }>,
  floorKey: OfficeFloorObjectKey,
  boundsSpace: Object3D,
): HeatmapStamp[] {
  const stamps: HeatmapStamp[] = [];
  boundsSpace.updateMatrixWorld(true);

  for (const marker of markers) {
    if (marker.floor !== floorKey) continue;
    marker.node.updateWorldMatrix(true, false);
    marker.node.getWorldPosition(_v);
    boundsSpace.worldToLocal(_v);
    stamps.push({
      cameraName: marker.name,
      x: _v.x,
      z: _v.z,
      phase: (stamps.length * 1.7) % (Math.PI * 2),
      sizeX: randomPlaneSize(hash01(marker.name, 17)),
      sizeZ: randomPlaneSize(hash01(marker.name, 91)),
    });
  }

  return stamps;
}
