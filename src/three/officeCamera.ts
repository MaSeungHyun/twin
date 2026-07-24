import { Object3D, Quaternion, Vector3 } from "three";
import type { PerspectiveCamera } from "three";

import type { OfficeCameraView, Vec3, Quat4 } from "@/stores/officeCameraStore";

const _pos = new Vector3();
const _dir = new Vector3();
const _target = new Vector3();
const _quat = new Quaternion();

export const OFFICE_CAMERA_IDS = ["office", "office2", "cafe"] as const;
export type OfficeCameraId = (typeof OFFICE_CAMERA_IDS)[number];

export const SPACE_CAMERA_LOOK_DISTANCE = 6;

function targetFromView(position: Vec3, rotation: Quat4): Vec3 {
  _quat.set(rotation[0], rotation[1], rotation[2], rotation[3]);
  _dir.set(0, 0, -1).applyQuaternion(_quat);
  _target.set(...position).addScaledVector(_dir, SPACE_CAMERA_LOOK_DISTANCE);
  return [_target.x, _target.y, _target.z];
}

/** GLB 카메라 노드 world position + rotation */
export function viewFromCameraNode(
  id: OfficeCameraId,
  node: Object3D,
): OfficeCameraView {
  node.updateWorldMatrix(true, false);
  node.getWorldPosition(_pos);
  node.getWorldQuaternion(_quat);

  const position: Vec3 = [_pos.x, _pos.y, _pos.z];
  const rotation: Quat4 = [_quat.x, _quat.y, _quat.z, _quat.w];

  return {
    id,
    label: id,
    sourceName: node.name || "(unnamed)",
    position,
    rotation,
    target: targetFromView(position, rotation),
  };
}

export function applySpaceCameraView(
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
