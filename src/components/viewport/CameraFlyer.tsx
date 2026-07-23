import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, MathUtils, Vector3 } from "three";
import type { Object3D } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { GalleryModelId } from "@/assets/model";
import {
  DEFAULT_GALLERY_ID,
  useCameraStore,
  type CameraFocus,
} from "@/stores/cameraStore";

const _cam = new Vector3();
const _target = new Vector3();
const _fromCam = new Vector3();
const _fromTarget = new Vector3();

const FLIGHT_DURATION = 1.55;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 숨긴 메쉬도 포함해 바운딩 계산 (visible=false여도 focus 등록) */
export function computeFocusFromObject(
  id: GalleryModelId,
  object: Object3D,
): CameraFocus {
  const box = new Box3();
  object.updateWorldMatrix(true, true);
  object.traverse((child) => {
    const mesh = child as import("three").Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const geoBox = mesh.geometry.boundingBox;
    if (!geoBox) return;
    const world = geoBox.clone();
    world.applyMatrix4(mesh.matrixWorld);
    box.union(world);
  });

  if (box.isEmpty()) {
    box.setFromObject(object);
  }

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

/** 초기 스냅 + duration 비행 */
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

  // model_32 로드되면 카메라 즉시 맞춤
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
