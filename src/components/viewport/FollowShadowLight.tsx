import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DirectionalLight,
  Object3D,
  Vector3,
  type OrthographicCamera,
} from "three";

import { isMobileDevice } from "@/lib/device";
import { DEFAULT_GALLERY_ID, useCameraStore } from "@/stores/cameraStore";
import { useViewportTestStore } from "@/stores/viewportTestStore";

const SHADOW_EXTENT = 70;
const _target = new Vector3();
const _lightPos = new Vector3();

/**
 * 활성(또는 비행 중) 모델 focus를 따라가는 그림자 라이트.
 * 모델이 멀리 떨어져 있어도 frustum 안에 들어오게 함.
 */
export default function FollowShadowLight() {
  const mobile = isMobileDevice();
  const shadowMap = mobile ? 1024 : 2048;
  const lightRef = useRef<DirectionalLight>(null);
  const targetRef = useRef<Object3D>(null);
  const scene = useThree((s) => s.scene);

  const soloId = useCameraStore((s) => s.soloId);
  const pendingSoloId = useCameraStore((s) => s.pendingSoloId);
  const focuses = useCameraStore((s) => s.focuses);

  const focusId = pendingSoloId ?? soloId ?? DEFAULT_GALLERY_ID;
  const focus = focuses[focusId] ?? focuses[DEFAULT_GALLERY_ID];
  const shadowsEnabled = useViewportTestStore((s) => s.shadowsEnabled);

  useEffect(() => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (!light || !target) return;
    light.target = target;
    if (!scene.children.includes(target)) {
      scene.add(target);
    }
    return () => {
      scene.remove(target);
    };
  }, [scene]);

  useFrame(() => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (!light || !target || !focus) return;

    _target.set(...focus.target);
    target.position.copy(_target);

    // 모델 중점 기준 위·옆에서 비추기
    _lightPos.set(_target.x + 35, _target.y + 55, _target.z + 25);
    light.position.copy(_lightPos);

    const cam = light.shadow.camera as OrthographicCamera;
    cam.left = -SHADOW_EXTENT;
    cam.right = SHADOW_EXTENT;
    cam.top = SHADOW_EXTENT;
    cam.bottom = -SHADOW_EXTENT;
    cam.near = 1;
    cam.far = 200;
    cam.updateProjectionMatrix();
    light.target.updateMatrixWorld();
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight
        ref={lightRef}
        castShadow={shadowsEnabled}
        intensity={2.2}
        shadow-mapSize={[shadowMap, shadowMap]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.04}
      />
      <object3D ref={targetRef} />
      {/* 활성 모델 발밑 그림자 바닥 (focus target 따라감) */}
      {/* <ShadowGround /> */}
    </>
  );
}
