import { useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

import ModelSelector from "../model/ModelSelector";

import Fallback from "./Fallback";
import ViewportScene from "./ViewportScene";

function ModelLoadingOverlay() {
  const { active } = useProgress();
  if (!active) return null;
  return <Fallback />;
}

export default function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enableGPU, setEnableGPU] = useState(false);

  return (
    <div ref={containerRef} className="relative flex flex-1 w-full h-full">
      <div className="absolute top-14 right-10 z-9999">
        <button
          type="button"
          className="px-2 py-0.5 rounded-md text-white"
          style={{
            backgroundColor: enableGPU ? "#0066b3" : "#000000",
          }}
          title={enableGPU ? "WebGPU 렌더러 사용" : "WebGL 렌더러 사용"}
          onClick={() => setEnableGPU((prev) => !prev)}
        >
          {enableGPU ? "GPU ON" : "GPU OFF"}
        </button>
      </div>
      <ModelSelector />
      <ModelLoadingOverlay />
      <ViewportScene
        enableGPU={enableGPU}
        statsParent={containerRef as React.RefObject<HTMLElement>}
      />
    </div>
  );
}
