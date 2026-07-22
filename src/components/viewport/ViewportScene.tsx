import { Suspense, type RefObject } from "react";
import { StatsGl } from "@react-three/drei";

import Model from "../model/Model";
import Canvas from "./Canvas";
import Controls from "./Controls";
import { isMobileDevice } from "@/lib/device";

const isMobile = isMobileDevice();

type ViewportSceneProps = {
  enableGPU: boolean;
  statsParent: RefObject<HTMLElement>;
};

export default function ViewportScene({
  enableGPU,
  statsParent,
}: ViewportSceneProps) {
  return (
    <Canvas enableGPU={enableGPU}>
      <color attach="background" args={["#0f1117"]} />
      {/* <Sky /> */}
      <ambientLight intensity={isMobile ? 1.2 : 0.6} />
      <directionalLight position={[3, 4, 5]} intensity={isMobile ? 1.4 : 1.2} />
      <Controls />
      <Suspense fallback={null}>
        <Model enableGPU={enableGPU} />
      </Suspense>
      {!isMobile ? (
        <StatsGl
          parent={statsParent}
          className="absolute bottom-4 right-4 z-30"
          clearStatsGlStyle
        />
      ) : null}
    </Canvas>
  );
}
