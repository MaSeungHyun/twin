import { Quaternion, Vector3 } from "three";

export const INITIAL_CAMERA_POSITION: [number, number, number] = [
  15.814, 43.578, 48.054,
];

/** x, y, z, w */
export const INITIAL_CAMERA_QUATERNION: [number, number, number, number] = [
  -0.261, 0.224, 0.062, 0.936,
];

export const INITIAL_CAMERA_LOOK_DISTANCE = 45;

const _quat = new Quaternion();
const _dir = new Vector3();

/** quaternion 시선 방향 → OrbitControls target */
export function getInitialCameraTarget(out = new Vector3()): Vector3 {
  _quat.set(...INITIAL_CAMERA_QUATERNION);
  _dir.set(0, 0, -1).applyQuaternion(_quat);

  return out
    .set(...INITIAL_CAMERA_POSITION)
    .addScaledVector(_dir, INITIAL_CAMERA_LOOK_DISTANCE);
}
