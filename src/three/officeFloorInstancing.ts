import {
  Camera,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Object3D,
  StaticDrawUsage,
  Vector3,
} from "three";

import { FLOOR_OBJECT_CANDIDATES } from "@/data/officeFloorActions";
import type { OfficeFloorActionId } from "@/data/officeFloorActions";
import {
  OFFICE_FLOOR_RUNTIME_CLONE,
  OFFICE_FLOOR_STACK_Y_FROM_1F,
} from "@/three/officeFloorClones";
import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";

export const OFFICE_FLOOR_INSTANCING_KEY = "officeFloorInstancing";

const FLOOR_KEYS = ["1F", "2F", "3F", "4F"] as const satisfies ReadonlyArray<
  OfficeFloorObjectKey
>;

const UPPER_FLOOR_KEYS = ["2F", "3F", "4F"] as const satisfies ReadonlyArray<
  Exclude<OfficeFloorObjectKey, "1F">
>;

const _world = new Matrix4();
const _parentInv = new Matrix4();
const _zero = new Matrix4().makeScale(0, 0, 0);
const _proxyWorld = new Vector3();

export type OfficeFloorCameraProxy = {
  floor: Exclude<OfficeFloorObjectKey, "1F">;
  source: Camera;
  proxy: Object3D;
};

export type OfficeFloorInstanceEntry = {
  instanced: InstancedMesh;
  baseWorldMatrix: Matrix4;
};

export type OfficeFloorInstanceRegistry = {
  instancesRoot: Group;
  entries: OfficeFloorInstanceEntry[];
  floorObjects: Map<OfficeFloorObjectKey, Object3D>;
  cameraProxies: OfficeFloorCameraProxy[];
  referenceFloorY: number;
  stats: { meshes: number; drawCallsSaved: number };
};

function isSceneCamera(obj: Object3D): obj is Camera {
  return (obj as Camera).isCamera === true;
}

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

function hasNativeUpperFloors(root: Object3D): boolean {
  return UPPER_FLOOR_KEYS.some((key) => {
    const node = findFloorRoot(root, key);
    return node && !node.userData?.[OFFICE_FLOOR_RUNTIME_CLONE];
  });
}

function isInstancableMesh(obj: Object3D): obj is Mesh {
  if (!(obj as Mesh).isMesh) return false;
  if ((obj as Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh) return false;
  if ((obj as Mesh & { isInstancedMesh?: boolean }).isInstancedMesh) return false;
  const mesh = obj as Mesh;
  if (!mesh.geometry || !mesh.material) return false;
  if (Array.isArray(mesh.material)) return false;
  return true;
}

function collectMeshes(root: Object3D): Mesh[] {
  const meshes: Mesh[] = [];
  root.traverse((obj) => {
    if (isInstancableMesh(obj)) meshes.push(obj);
  });
  return meshes;
}

function collectCameras(root: Object3D): Camera[] {
  const cameras: Camera[] = [];
  root.traverse((obj) => {
    if (isSceneCamera(obj)) cameras.push(obj);
  });
  cameras.sort((a, b) => a.name.localeCompare(b.name));
  return cameras;
}

/** 2F~4F — F1 카메라 world + (anchor Y − F1 Y)로 proxy 위치 동기화 */
export function syncCameraProxies(registry: OfficeFloorInstanceRegistry) {
  const f1 = registry.floorObjects.get("1F");
  if (!f1 || registry.cameraProxies.length === 0) return;

  f1.updateMatrixWorld(true);

  for (const { floor, source, proxy } of registry.cameraProxies) {
    const anchor = registry.floorObjects.get(floor);
    if (!anchor) continue;

    source.updateMatrixWorld(true);
    source.getWorldPosition(_proxyWorld);
    _proxyWorld.y += anchor.position.y - f1.position.y;

    anchor.updateMatrixWorld(true);
    anchor.worldToLocal(_proxyWorld);
    proxy.position.copy(_proxyWorld);
    proxy.updateMatrixWorld(true);
  }
}

function createCameraProxies(
  f1: Object3D,
  floors: Map<OfficeFloorObjectKey, Object3D>,
): OfficeFloorCameraProxy[] {
  const proxies: OfficeFloorCameraProxy[] = [];
  const sourceCameras = collectCameras(f1);

  for (const key of UPPER_FLOOR_KEYS) {
    const anchor = floors.get(key);
    if (!anchor) continue;

    for (const source of sourceCameras) {
      const proxy = new Object3D();
      proxy.name = `CctvProxy:${key}:${source.name}`;
      anchor.add(proxy);
      proxies.push({ floor: key, source, proxy });
    }
  }

  return proxies;
}

function ensureFloorAnchors(
  root: Object3D,
  f1: Object3D,
): Map<OfficeFloorObjectKey, Object3D> {
  const parent = f1.parent ?? root;
  const baseY = f1.position.y;
  const floors = new Map<OfficeFloorObjectKey, Object3D>();
  floors.set("1F", f1);

  for (const key of UPPER_FLOOR_KEYS) {
    let anchor = findFloorRoot(root, key);
    if (!anchor) {
      const nodeName = FLOOR_OBJECT_CANDIDATES[key][0];
      anchor = new Group();
      anchor.name = nodeName;
      anchor.userData[OFFICE_FLOOR_RUNTIME_CLONE] = true;
      anchor.position.set(f1.position.x, baseY + OFFICE_FLOOR_STACK_Y_FROM_1F[key], f1.position.z);
      anchor.quaternion.copy(f1.quaternion);
      anchor.scale.copy(f1.scale);
      parent.add(anchor);
    }
    floors.set(key, anchor);
  }

  return floors;
}

/** instance matrix — base world + 층 anchor Y 이동 */
export function syncOfficeFloorInstances(
  registry: OfficeFloorInstanceRegistry,
  floors: ReadonlyMap<OfficeFloorObjectKey, Object3D>,
  visibility: Readonly<Record<OfficeFloorObjectKey, boolean>> | null = null,
) {
  registry.instancesRoot.updateMatrixWorld(true);
  _parentInv.copy(registry.instancesRoot.matrixWorld).invert();

  for (const { instanced, baseWorldMatrix } of registry.entries) {
    for (let i = 0; i < FLOOR_KEYS.length; i++) {
      const key = FLOOR_KEYS[i];
      const anchor = floors.get(key);
      const visible = visibility ? visibility[key] : true;

      if (!anchor || !visible) {
        instanced.setMatrixAt(i, _zero);
        continue;
      }

      _world.copy(baseWorldMatrix);
      _world.elements[13] += anchor.position.y - registry.referenceFloorY;
      _world.premultiply(_parentInv);
      instanced.setMatrixAt(i, _world);
    }
    instanced.instanceMatrix.needsUpdate = true;
  }

  syncCameraProxies(registry);
}

export function floorVisibilityForAction(
  actionId: OfficeFloorActionId,
): Record<OfficeFloorObjectKey, boolean> | null {
  if (actionId === "Default") return null;

  return {
    "1F": actionId === "1F",
    "2F": actionId === "2F",
    "3F": actionId === "3F",
    "4F": actionId === "4F",
  };
}

export function getOfficeFloorInstanceRegistry(
  root: Object3D,
): OfficeFloorInstanceRegistry | null {
  const registry = root.userData[OFFICE_FLOOR_INSTANCING_KEY] as
    | OfficeFloorInstanceRegistry
    | undefined;
  if (!registry) return null;
  if (!isRegistryForRoot(registry, root)) return null;
  return registry;
}

/**
 * InstancedMesh 인스턴스 버퍼만 해제.
 * geometry/material은 useGLTF 캐시와 공유하므로 dispose하지 않음.
 */
export function disposeOfficeFloorInstances(root: Object3D) {
  const registry = root.userData[OFFICE_FLOOR_INSTANCING_KEY] as
    | OfficeFloorInstanceRegistry
    | undefined;
  delete root.userData[OFFICE_FLOOR_INSTANCING_KEY];
  if (!registry) return;

  for (const { instanced } of registry.entries) {
    instanced.removeFromParent();
    instanced.dispose();
  }
  registry.instancesRoot.removeFromParent();

  for (const { proxy } of registry.cameraProxies) {
    proxy.removeFromParent();
  }
}

function isRegistryForRoot(
  registry: OfficeFloorInstanceRegistry,
  root: Object3D,
): boolean {
  let node: Object3D | null = registry.instancesRoot;
  while (node) {
    if (node === root) return true;
    node = node.parent;
  }
  return false;
}

/**
 * F1 mesh → InstancedMesh×4, F2~F4는 anchor + 카메라만.
 * GLB에 F2~F4가 이미 있으면 null (clone fallback).
 */
export function buildOfficeFloorInstances(root: Object3D): OfficeFloorInstanceRegistry | null {
  delete root.userData[OFFICE_FLOOR_INSTANCING_KEY];

  const f1 = findFloorRoot(root, "1F");
  if (!f1 || hasNativeUpperFloors(root)) return null;

  const meshes = collectMeshes(f1);
  if (meshes.length === 0) return null;

  root.updateMatrixWorld(true);

  const floors = ensureFloorAnchors(root, f1);
  const cameraProxies = createCameraProxies(f1, floors);

  const instancesRoot = new Group();
  instancesRoot.name = "OfficeFloorInstances";
  (f1.parent ?? root).add(instancesRoot);

  const entries: OfficeFloorInstanceEntry[] = [];

  for (const mesh of meshes) {
    mesh.updateMatrixWorld(true);

    const instanced = new InstancedMesh(mesh.geometry, mesh.material, FLOOR_KEYS.length);
    instanced.name = `Inst:${mesh.name || mesh.uuid.slice(0, 8)}`;
    instanced.instanceMatrix.setUsage(StaticDrawUsage);
    instanced.castShadow = mesh.castShadow;
    instanced.receiveShadow = mesh.receiveShadow;
    instanced.frustumCulled = false;

    entries.push({
      instanced,
      baseWorldMatrix: mesh.matrixWorld.clone(),
    });

    instancesRoot.add(instanced);
    mesh.removeFromParent();
  }

  const registry: OfficeFloorInstanceRegistry = {
    instancesRoot,
    entries,
    floorObjects: floors,
    cameraProxies,
    referenceFloorY: f1.position.y,
    stats: {
      meshes: entries.length,
      drawCallsSaved: Math.max(0, entries.length * (FLOOR_KEYS.length - 1)),
    },
  };

  root.userData[OFFICE_FLOOR_INSTANCING_KEY] = registry;
  syncOfficeFloorInstances(registry, floors, null);

  return registry;
}
