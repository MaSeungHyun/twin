import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, MathUtils, Vector3 } from "three";
import type { Object3D } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { GalleryModelId } from "@/assets/model";
import { useCameraStore, type CameraFocus } from "@/stores/cameraStore";

const _cam = new Vector3();
const _target = new Vector3();
const _fromCam = new Vector3();
const _fromTarget = new Vector3();

const FLIGHT_DURATION = 1.55;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 오브젝트 중점에 가깝게 보도록 focus 계산 */
export function computeFocusFromObject(
  id: GalleryModelId,
  object: Object3D,
): CameraFocus {
  const box = new Box3().setFromObject(object);
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const radius = Math.max(size.x, size.y, size.z, 1) * 0.5;
  const dist = MathUtils.clamp(radius * 1.15, 5, 120);
  const position = new Vector3(
    center.x + dist * 0.55,
    center.y + dist * 0.35,
    center.z + dist * 0.55,
  );

  return {
    id,
    target: [center.x, center.y, center.z],
    position: [position.x, position.y, position.z],
  };
}

/** duration + easeInOut으로 카메라 이동 → 도착 시 solo 전환 */
export default function CameraFlyer() {
  const goal = useCameraStore((s) => s.goal);
  const onArrive = useCameraStore((s) => s.onArrive);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const progress = useRef(0);
  const flying = useRef(false);

  useEffect(() => {
    if (!goal || !controls) return;

    _fromCam.copy(camera.position);
    _fromTarget.copy(controls.target);
    progress.current = 0;
    flying.current = true;
    controls.enablePan = false;

    return () => {
      controls.enablePan = true;
      flying.current = false;
    };
  }, [goal, camera, controls]);

  useFrame((_, delta) => {
    if (!goal || !controls || !flying.current) return;

    progress.current = Math.min(1, progress.current + delta / FLIGHT_DURATION);
    const e = easeInOutCubic(progress.current);

    _cam.set(...goal.position);
    _target.set(...goal.target);
    camera.position.lerpVectors(_fromCam, _cam, e);
    controls.target.lerpVectors(_fromTarget, _target, e);
    controls.update();

    if (progress.current >= 1) {
      flying.current = false;
      camera.position.copy(_cam);
      controls.target.copy(_target);
      controls.update();
      controls.enablePan = true;
      onArrive();
    }
  });

  return null;
}
