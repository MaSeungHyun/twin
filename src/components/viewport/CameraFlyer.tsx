import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { easeInOutCubic } from "@/lib/easing";
import {
  DEFAULT_GALLERY_ID,
  useCameraStore,
} from "@/stores/cameraStore";

export { computeFocusFromObject } from "@/three/cameraFocus";

const _cam = new Vector3();
const _target = new Vector3();
const _fromCam = new Vector3();
const _fromTarget = new Vector3();

const FLIGHT_DURATION = 1.55;

/** 초기 스냅 + duration 비행 (갤러리 모델용) */
export default function CameraFlyer() {
  const goal = useCameraStore((s) => s.goal);
  const onArrive = useCameraStore((s) => s.onArrive);
  const defaultFocus = useCameraStore(
    (s) => s.focuses[DEFAULT_GALLERY_ID] ?? null,
  );
  const didInitialSnap = useCameraStore((s) => s.didInitialSnap);
  const markInitialSnap = useCameraStore((s) => s.markInitialSnap);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const progress = useRef(0);
  const flying = useRef(false);

  useEffect(() => {
    if (didInitialSnap || !defaultFocus || !controls) return;
    camera.position.set(...defaultFocus.position);
    controls.target.set(...defaultFocus.target);
    controls.update();
    markInitialSnap();
  }, [didInitialSnap, defaultFocus, camera, controls, markInitialSnap]);

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
