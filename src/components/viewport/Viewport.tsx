import { Suspense, useState } from "react";
import Canvas from "./Canvas";
import { Environment, Sky, StatsGl } from "@react-three/drei";
import Controls from "./Controls";
import Fallback from "./Fallback";
import Model from "../model/Model";
import ModelSelector from "../model/ModelSelector";

export default function Viewport() {
  const [enableGPU, setEnableGPU] = useState(false);

  return (
    <div className="relative flex flex-1 w-full h-full">
      <div className="absolute top-14 right-10 z-9999">
        <button
          type="button"
          className="px-2 py-0.5 rounded-md text-white"
          style={{
            backgroundColor: enableGPU ? "#0066b3" : "#000000",
          }}
          title={
            enableGPU
              ? "WebGPU 렌더러 사용"
              : "WebGL 렌더러 사용"
          }
          onClick={() => setEnableGPU((prev) => !prev)}
        >
          {enableGPU ? "GPU ON" : "GPU OFF"}
        </button>
      </div>
      <ModelSelector />
      <Canvas enableGPU={enableGPU}>
        <Sky />
        <Environment preset="warehouse" environmentIntensity={1.1} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <Controls />
        <Suspense fallback={<Fallback />}>
          <Model enableGPU={enableGPU} />
        </Suspense>
        <StatsGl className="absolute bottom-4 right-4 z-30" />
      </Canvas>
    </div>
  );
}
