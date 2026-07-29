import { Quaternion, Vector3 } from "three";

export const INITIAL_CAMERA_POSITION: [number, number, number] = [
  6.149, 32.229, 53.453,
];

/** x, y, z, w */
export const INITIAL_CAMERA_QUATERNION: [number, number, number, number] = [
  -0.197, 0.124, 0.025, 0.972,
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
