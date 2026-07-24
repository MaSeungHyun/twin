import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3, type PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import {
  type CameraProjection,
  useOfficeCameraStore,
} from "@/stores/officeCameraStore";
import {
  SPACE_CAMERA_LOOK_DISTANCE,
  applyCameraProjection,
  applyLerpedCameraProjection,
  applySpaceCameraTransform,
  ensureCameraProjection,
  snapshotCameraProjection,
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

function restoreViewportProjection(
  camera: PerspectiveCamera,
  saved: CameraProjection,
  aspect: number,
) {
  camera.near = saved.near;
  camera.far = saved.far;
  camera.fov = saved.fov;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}

export default function OfficeCameraFlyer() {
  const goal = useOfficeCameraStore((s) => s.goal);
  const onArrive = useOfficeCameraStore((s) => s.onArrive);

  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const progress = useRef(0);
  const flying = useRef(false);
  const viewportProjection = useRef<CameraProjection | null>(null);
  const fromProjection = useRef<CameraProjection | null>(null);
  /** 비행 종료 후 Orbit 시작 전까지 GLB projection 유지 */
  const lockedGlbProjection = useRef<CameraProjection | null>(null);

  useEffect(() => {
    viewportProjection.current = snapshotCameraProjection(camera);
  }, [camera]);

  useEffect(() => {
    if (!controls) return;

    const onOrbitStart = () => {
      if (!lockedGlbProjection.current || !viewportProjection.current) return;
      restoreViewportProjection(
        camera,
        viewportProjection.current,
        size.width / size.height,
      );
      lockedGlbProjection.current = null;
    };

    controls.addEventListener("start", onOrbitStart);
    return () => controls.removeEventListener("start", onOrbitStart);
  }, [camera, controls, size.width, size.height]);

  useEffect(() => {
    if (!goal || !controls) return;

    lockedGlbProjection.current = null;

    if (!viewportProjection.current) {
      viewportProjection.current = snapshotCameraProjection(camera);
    }

    fromProjection.current = snapshotCameraProjection(camera);
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
    if (goal && controls && flying.current) {
      progress.current = Math.min(1, progress.current + delta / FLIGHT_DURATION);
      const e = easeInOutCubic(progress.current);

      _toPos.set(...goal.position);
      _toQuat.set(...goal.rotation);

      if (fromProjection.current) {
        applyLerpedCameraProjection(
          camera,
          fromProjection.current,
          goal.projection,
          e,
        );
      }
      camera.position.lerpVectors(_fromCam, _toPos, e);
      camera.quaternion.slerpQuaternions(_fromQuat, _toQuat, e);
      syncControlsTarget(camera, controls);

      if (progress.current >= 1) {
        flying.current = false;
        applySpaceCameraTransform(camera, controls, goal);
        applyCameraProjection(camera, goal.projection);
        lockedGlbProjection.current = { ...goal.projection };
        controls.enablePan = true;
        onArrive();
      }
      return;
    }

    if (lockedGlbProjection.current) {
      ensureCameraProjection(camera, lockedGlbProjection.current);
    }
  });

  return null;
}
