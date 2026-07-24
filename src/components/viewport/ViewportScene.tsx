import { Environment, Helper, Sky } from "@react-three/drei";
import { useMemo } from "react";
import { PointLightHelper } from "three";

import CameraFlyer from "./CameraFlyer";
import Canvas from "./Canvas";
import Controls from "./Controls";
import FollowShadowLight from "./FollowShadowLight";

const LIGHT_COUNT = 250;
/** 헬퍼 1000개는 무거움 — 필요할 때만 true */
const SHOW_LIGHT_HELPERS = false;

type PointLightDef = {
  id: number;
  position: [number, number, number];
  color: string;
};

function makePointLights(count: number): PointLightDef[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    position: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
    color: `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")}`,
  }));
}

function RandomPointLights({ count }: { count: number }) {
  const lights = useMemo(() => makePointLights(count), [count]);

  return (
    <>
      <mesh castShadow receiveShadow position={[0, 5, 5]}>
        <sphereGeometry args={[100, 100, 100]} />
        <meshStandardMaterial color="red" />
      </mesh>
      {lights.map((light) => (
        <pointLight
          key={light.id}
          position={light.position}
          color={light.color}
          intensity={1000}
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

export default function ViewportScene() {
  return (
    <Canvas>
      <Sky />
      <Environment preset="city" environmentIntensity={0.08} />
      <FollowShadowLight />
      <Controls />
      <CameraFlyer />
      <RandomPointLights count={LIGHT_COUNT} />
    </Canvas>
  );
}
