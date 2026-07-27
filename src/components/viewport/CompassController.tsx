import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3, type PerspectiveCamera } from "three";

import {
  cameraPositionForCardinal,
  computeCameraHeading,
} from "@/lib/compassNavigation";
import { useCompassStore } from "@/stores/compassStore";

const _goalPos = new Vector3();

/** 카메라 heading 동기화 + 나침반 클릭 시 회전 */
export default function CompassController() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const goalPosRef = useRef<Vector3 | null>(null);

  useFrame((_, delta) => {
    if (!controls) return;

    const store = useCompassStore.getState();
    store.setHeading(computeCameraHeading(camera));

    const target = store.rotateTarget;
    if (!target) {
      goalPosRef.current = null;
      return;
    }

    if (!goalPosRef.current) {
      goalPosRef.current = cameraPositionForCardinal(
        controls.target,
        camera.position,
        target,
        _goalPos,
      ).clone();
    }

    const goal = goalPosRef.current;
    const t = 1 - Math.exp(-10 * delta);
    camera.position.lerp(goal, t);
    controls.update();

    if (camera.position.distanceTo(goal) < 0.08) {
      camera.position.copy(goal);
      controls.update();
      goalPosRef.current = null;
      store.clearRotateTarget();
    }
  });

  return null;
}
