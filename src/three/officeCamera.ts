import { Object3D, PerspectiveCamera, Quaternion, Vector3 } from "three";

import type { OfficeCameraView, Quat4, Vec3 } from "@/stores/officeCameraStore";

const _pos = new Vector3();
const _dir = new Vector3();
const _target = new Vector3();
const _quat = new Quaternion();

export const OFFICE_CAMERA_IDS = ["office", "office2", "cafe"] as const;
export type OfficeCameraId = (typeof OFFICE_CAMERA_IDS)[number];

export const SPACE_CAMERA_LOOK_DISTANCE = 6;

const DEFAULT_PROJECTION = {
  near: 0.1,
  far: 1000,
  aspect: 16 / 9,
  fov: 45,
};

function targetFromView(position: Vec3, rotation: Quat4): Vec3 {
  _quat.set(rotation[0], rotation[1], rotation[2], rotation[3]);
  _dir.set(0, 0, -1).applyQuaternion(_quat);
  _target.set(...position).addScaledVector(_dir, SPACE_CAMERA_LOOK_DISTANCE);
  return [_target.x, _target.y, _target.z];
}

function projectionFromNode(node: Object3D): OfficeCameraView["projection"] {
  if ((node as PerspectiveCamera).isPerspectiveCamera) {
    const cam = node as PerspectiveCamera;
    return {
      near: cam.near,
      far: cam.far,
      aspect: cam.aspect,
      fov: cam.fov,
    };
  }
  return { ...DEFAULT_PROJECTION };
}

export function applyCameraProjection(
  camera: PerspectiveCamera,
  projection: OfficeCameraView["projection"],
) {
  camera.near = projection.near;
  camera.far = projection.far;
  camera.aspect = projection.aspect;
  camera.fov = projection.fov;
  camera.updateProjectionMatrix();
}

/** near/far만 보간, fov/aspect는 목표값 즉시 적용 */
export function applyLerpedNearFarProjection(
  camera: PerspectiveCamera,
  from: OfficeCameraView["projection"],
  to: OfficeCameraView["projection"],
  t: number,
) {
  camera.near = from.near + (to.near - from.near) * t;
  camera.far = from.far + (to.far - from.far) * t;
  camera.fov = to.fov;
  camera.aspect = to.aspect;
  camera.updateProjectionMatrix();
}

/** R3F resize 등으로 projection이 바뀌면 GLB 값으로 복원 (비행 중) */
export function ensureCameraProjection(
  camera: PerspectiveCamera,
  projection: OfficeCameraView["projection"],
) {
  if (
    camera.near === projection.near &&
    camera.far === projection.far &&
    camera.aspect === projection.aspect &&
    camera.fov === projection.fov
  ) {
    return;
  }
  applyCameraProjection(camera, projection);
}

/** GLB 카메라 노드 world transform + projection */
export function viewFromCameraNode(
  id: OfficeCameraId,
  node: Object3D,
): OfficeCameraView {
  node.updateWorldMatrix(true, false);
  node.getWorldPosition(_pos);
  node.getWorldQuaternion(_quat);

  const position: Vec3 = [_pos.x, _pos.y, _pos.z];
  const rotation: Quat4 = [_quat.x, _quat.y, _quat.z, _quat.w];
  const projection = projectionFromNode(node);

  return {
    id,
    label: id,
    sourceName: node.name || "(unnamed)",
    position,
    rotation,
    projection,
    target: targetFromView(position, rotation),
  };
}

export function applySpaceCameraTransform(
  camera: PerspectiveCamera,
  controls: { target: Vector3; update: () => void },
  view: OfficeCameraView,
) {
  camera.position.set(...view.position);
  camera.quaternion.set(...view.rotation);
  camera.updateMatrixWorld();
  camera.getWorldDirection(_dir);
  controls.target.copy(camera.position).addScaledVector(_dir, SPACE_CAMERA_LOOK_DISTANCE);
  controls.update();
}

export function snapshotCameraProjection(
  camera: PerspectiveCamera,
): OfficeCameraView["projection"] {
  return {
    near: camera.near,
    far: camera.far,
    aspect: camera.aspect,
    fov: camera.fov,
  };
}

/** GLB projection + transform (비행 중에만 사용) */
export function applySpaceCameraView(
  camera: PerspectiveCamera,
  controls: { target: Vector3; update: () => void },
  view: OfficeCameraView,
) {
  applyCameraProjection(camera, view.projection);
  applySpaceCameraTransform(camera, controls, view);
}

/** office / office2 / cafe 카메라만 수집 (기본 Camera 제외) */
export function collectOfficeCameras(root: Object3D): OfficeCameraView[] {
  const byName = new Map<OfficeCameraId, Object3D>();

  root.traverse((obj) => {
    const lower = obj.name.toLowerCase();
    if (lower === "office" || lower === "office2" || lower === "cafe") {
      byName.set(lower as OfficeCameraId, obj);
    }
  });

  return OFFICE_CAMERA_IDS.flatMap((id) => {
    const node = byName.get(id);
    return node ? [viewFromCameraNode(id, node)] : [];
  });
}
