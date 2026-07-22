import { Environment, Sky, StatsGl } from "@react-three/drei";

import Model from "../model/Model";
import Canvas from "./Canvas";
import Controls from "./Controls";
import { isMobileDevice } from "@/lib/device";

const isMobile = isMobileDevice();

type ViewportSceneProps = {
  enableGPU: boolean;
};

export default function ViewportScene({ enableGPU }: ViewportSceneProps) {
  return (
    <Canvas enableGPU={enableGPU}>
      <Sky />
      {!isMobile ? (
        <Environment preset="warehouse" environmentIntensity={1.1} />
      ) : null}
      <ambientLight intensity={isMobile ? 1.2 : 0.6} />
      <directionalLight position={[3, 4, 5]} intensity={isMobile ? 1.4 : 1.2} />
      <Controls />
      <Model enableGPU={enableGPU} />
      {!isMobile ? (
        <StatsGl className="absolute bottom-4 right-4 z-30" />
      ) : null}
    </Canvas>
  );
}
