import { Canvas as R3FCanvas, type Vector3 } from "@react-three/fiber";
import { type WebGLRenderer } from "three";

import { isMobileDevice } from "@/lib/device";
import { bindGltfRenderer } from "@/three/gltfLoader";
import type { GpuPowerPreference } from "@/stores/viewportTestStore";

const INITIAL_CAMERA_POSITION: Vector3 = [3, 3, 5];

/** 레티나에서 fill-rate·VRAM 폭주 → context lost 완화 */
function cappedDpr(): number {
  const raw = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return isMobileDevice() ? Math.min(raw, 1) : Math.min(raw, 1.5);
}

type CanvasProps = {
  children: React.ReactNode;
  antialias?: boolean;
  powerPreference?: GpuPowerPreference;
};

export default function Canvas({
  children,
  antialias = true,
  powerPreference = "high-performance",
}: CanvasProps): React.ReactNode {
  return (
    <R3FCanvas
      key={`${antialias ? "aa-on" : "aa-off"}-${powerPreference}`}
      shadows
      dpr={cappedDpr()}
      gl={{
        antialias,
        powerPreference,
        stencil: false,
        depth: true,
      }}
      camera={{ position: INITIAL_CAMERA_POSITION, near: 0.1, far: 1000 }}
      onCreated={({ gl }) => {
        const renderer = gl as WebGLRenderer;
        bindGltfRenderer(renderer);
        renderer.setPixelRatio(cappedDpr());

        const canvas = renderer.domElement;
        const onLost = (event: Event) => {
          event.preventDefault();
          console.warn(
            "[WebGL] Context Lost — GPU 부하/메모리 과다. 줌을 줄이거나 모델을 경량화하세요.",
          );
        };
        const onRestored = () => {
          console.warn("[WebGL] Context Restored");
          renderer.setPixelRatio(cappedDpr());
        };
        canvas.addEventListener("webglcontextlost", onLost, false);
        canvas.addEventListener("webglcontextrestored", onRestored, false);
      }}
    >
      {children}
    </R3FCanvas>
  );
}
