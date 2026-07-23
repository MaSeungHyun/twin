import { Suspense } from "react";

import { isMobileDevice } from "@/lib/device";

import Model from "../model/Model";
import WasteModels from "../model/WasteModels";
import Canvas from "./Canvas";
import Controls from "./Controls";
import { StatsGl } from "@react-three/drei";

export default function ViewportScene() {
  const shadowMap = isMobileDevice() ? 1024 : 2048;

  return (
    <Canvas>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[12, 22, 10]}
        intensity={1.55}
        shadow-mapSize={[shadowMap, shadowMap]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <Controls />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
      <WasteModels />
      <StatsGl className="absolute bottom-2 right-12 z-2" />
    </Canvas>
  );
}
