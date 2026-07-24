import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3, type PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useOfficeCameraStore } from "@/stores/officeCameraStore";
import {
  SPACE_CAMERA_LOOK_DISTANCE,
  applySpaceCameraView,
} from "@/three/officeCamera";

const _toPos = new Vector3();
const _fromCam = new Vector3();
const _fromQuat = new Quaternion();
const _toQuat = new Quaternion();
const _dir = new Vector3();

const FLIGHT_DURATION = 1.4;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function syncControlsTarget(
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl,
) {
  camera.getWorldDirection(_dir);
  controls.target.copy(camera.position).addScaledVector(_dir, SPACE_CAMERA_LOOK_DISTANCE);
  controls.update();
}

export default function OfficeCameraFlyer() {
  const goal = useOfficeCameraStore((s) => s.goal);
  const views = useOfficeCameraStore((s) => s.views);
  const didInitialSnap = useOfficeCameraStore((s) => s.didInitialSnap);
  const markInitialSnap = useOfficeCameraStore((s) => s.markInitialSnap);
  const onArrive = useOfficeCameraStore((s) => s.onArrive);

  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const progress = useRef(0);
  const flying = useRef(false);

  const defaultView =
    views.office ?? views.office2 ?? views.cafe ?? null;

  useEffect(() => {
    if (didInitialSnap || !defaultView || !controls) return;
    applySpaceCameraView(camera, controls, defaultView);
    markInitialSnap();
    useOfficeCameraStore.setState({ activeId: defaultView.id });
  }, [didInitialSnap, defaultView, camera, controls, markInitialSnap]);

  useEffect(() => {
    if (!goal || !controls) return;

    _fromCam.copy(camera.position);
    _fromQuat.copy(camera.quaternion);
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

    _toPos.set(...goal.position);
    _toQuat.set(...goal.rotation);

    camera.position.lerpVectors(_fromCam, _toPos, e);
    camera.quaternion.slerpQuaternions(_fromQuat, _toQuat, e);
    syncControlsTarget(camera, controls);

    if (progress.current >= 1) {
      flying.current = false;
      applySpaceCameraView(camera, controls, goal);
      controls.enablePan = true;
      onArrive();
    }
  });

  return null;
}
