import { Environment, Helper, Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { PointLight, PointLightHelper } from "three";

import CameraFlyer from "./CameraFlyer";
import Canvas from "./Canvas";
import Controls from "./Controls";
import FollowShadowLight from "./FollowShadowLight";

export const MAX_POINT_LIGHTS = 300;

/** 초당 몇 개씩 밝아지고/어두워지는지 */
const LIGHTS_PER_SECOND = 70;
const TARGET_INTENSITY = 1000;

/** 헬퍼는 무거움 — 필요할 때만 true */
const SHOW_LIGHT_HELPERS = false;

type PointLightDef = {
  id: number;
  position: [number, number, number];
  color: string;
};

function makePointLights(count: number): PointLightDef[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    position: [
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100,
    ],
    color: `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")}`,
  }));
}

function RandomPointLights({ count }: { count: number }) {
  const pool = useMemo(() => makePointLights(MAX_POINT_LIGHTS), []);
  const visualCount = useRef(count);
  const [mountedCount, setMountedCount] = useState(count);
  const lightRefs = useRef<(PointLight | null)[]>([]);

  useFrame((_, delta) => {
    const target = Math.max(0, Math.min(count, MAX_POINT_LIGHTS));
    const diff = target - visualCount.current;

    if (Math.abs(diff) > 0.001) {
      visualCount.current +=
        Math.sign(diff) *
        Math.min(Math.abs(diff), LIGHTS_PER_SECOND * delta);
    } else {
      visualCount.current = target;
    }

    const nextMounted = Math.min(
      MAX_POINT_LIGHTS,
      Math.ceil(Math.max(visualCount.current, target)),
    );
    setMountedCount((prev) => (prev === nextMounted ? prev : nextMounted));

    const v = visualCount.current;
    for (let i = 0; i < lightRefs.current.length; i++) {
      const light = lightRefs.current[i];
      if (!light) continue;
      // i < v 이면 풀밝기, v~v+1 구간은 부분 페이드
      const weight = Math.max(0, Math.min(1, v - i));
      light.intensity = weight * TARGET_INTENSITY;
    }
  });

  const lights = pool.slice(0, mountedCount);

  return (
    <>
      <mesh castShadow receiveShadow position={[0, 5, 5]}>
        <sphereGeometry args={[100, 100, 100]} />
        <meshStandardMaterial color="red" />
      </mesh>
      {lights.map((light) => (
        <pointLight
          key={light.id}
          ref={(el) => {
            lightRefs.current[light.id] = el;
          }}
          position={light.position}
          color={light.color}
          intensity={light.id < count ? TARGET_INTENSITY : 0}
          decay={1.5}
        >
          {SHOW_LIGHT_HELPERS ? (
            <Helper type={PointLightHelper} args={[0.5, light.color]} />
          ) : null}
        </pointLight>
      ))}
    </>
  );
}

type ViewportSceneProps = {
  lightCount: number;
};

export default function ViewportScene({ lightCount }: ViewportSceneProps) {
  return (
    <Canvas>
      <Sky />
      <Environment preset="city" environmentIntensity={0.08} />
      <FollowShadowLight />
      <Controls />
      <CameraFlyer />
      <RandomPointLights count={lightCount} />
    </Canvas>
  );
}
