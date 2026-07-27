import { Vector3 } from "three";

export type CardinalDirection = "N" | "E" | "S" | "W";

/** Three.js Y-up: 북=-Z, 동=+X, 남=+Z, 서=-X */
const CARDINAL_VIEW: Record<CardinalDirection, Vector3> = {
  N: new Vector3(0, 0, -1),
  E: new Vector3(1, 0, 0),
  S: new Vector3(0, 0, 1),
  W: new Vector3(-1, 0, 0),
};

const _view = new Vector3();
const _goal = new Vector3();

/** 카메라 시선 heading (rad). 0=북, 시계방향+ */
export function computeCameraHeading(
  cameraPos: Vector3,
  target: Vector3,
): number {
  _view.copy(target).sub(cameraPos);
  _view.y = 0;
  if (_view.lengthSq() < 1e-8) return 0;
  _view.normalize();
  return Math.atan2(_view.x, -_view.z);
}

/** Orbit 카메라를 해당 방향으로 보도록 position 계산 (거리·높이 유지) */
export function cameraPositionForCardinal(
  target: Vector3,
  currentCamera: Vector3,
  direction: CardinalDirection,
  out = _goal,
): Vector3 {
  const offsetY = currentCamera.y - target.y;
  const dx = currentCamera.x - target.x;
  const dz = currentCamera.z - target.z;
  const horizontalDist = Math.sqrt(dx * dx + dz * dz) || 1;

  const view = CARDINAL_VIEW[direction];
  out.set(
    target.x - view.x * horizontalDist,
    target.y + offsetY,
    target.z - view.z * horizontalDist,
  );
  return out;
}

export const CARDINAL_LABELS: Record<
  CardinalDirection,
  { label: string; ariaLabel: string }
> = {
  N: { label: "북", ariaLabel: "북쪽으로 회전" },
  E: { label: "동", ariaLabel: "동쪽으로 회전" },
  S: { label: "남", ariaLabel: "남쪽으로 회전" },
  W: { label: "서", ariaLabel: "서쪽으로 회전" },
};
