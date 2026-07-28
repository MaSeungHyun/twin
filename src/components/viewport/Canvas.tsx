import { useEffect } from "react";
import { Canvas as R3FCanvas, useThree } from "@react-three/fiber";
import type { WebGLRenderer } from "three";

import { cappedDevicePixelRatio } from "@/lib/device";
import { bindGltfRenderer } from "@/three/gltfLoader";
import {
  INITIAL_CAMERA_POSITION,
  INITIAL_CAMERA_QUATERNION,
} from "@/three/initialCamera";
import type { GpuPowerPreference } from "@/stores/viewportTestStore";

type CanvasProps = {
  children: React.ReactNode;
  antialias?: boolean;
  powerPreference?: GpuPowerPreference;
};

/** context lost/restored 리스너 — onCreated만 쓰면 언마운트 시 해제 불가 */
function WebGlContextGuard() {
  const gl = useThree((s) => s.gl) as WebGLRenderer;

  useEffect(() => {
    const canvas = gl.domElement;
    const dpr = () => cappedDevicePixelRatio();

    const onLost = (event: Event) => {
      event.preventDefault();
      console.warn(
        "[WebGL] Context Lost — GPU 부하/메모리 과다. 줌을 줄이거나 모델을 경량화하세요.",
      );
    };
    const onRestored = () => {
      console.warn("[WebGL] Context Restored");
      gl.setPixelRatio(dpr());
    };

    canvas.addEventListener("webglcontextlost", onLost, false);
    canvas.addEventListener("webglcontextrestored", onRestored, false);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost, false);
      canvas.removeEventListener("webglcontextrestored", onRestored, false);
    };
  }, [gl]);

  return null;
}

export default function Canvas({
  children,
  antialias = true,
  powerPreference = "high-performance",
}: CanvasProps): React.ReactNode {
  const dpr = cappedDevicePixelRatio();

  return (
    <R3FCanvas
      key={`${antialias ? "aa-on" : "aa-off"}-${powerPreference}`}
      shadows
      dpr={dpr}
      gl={{
        antialias,
        powerPreference,
        stencil: false,
        depth: true,
      }}
      camera={{
        position: INITIAL_CAMERA_POSITION,
        quaternion: INITIAL_CAMERA_QUATERNION,
        near: 0.1,
        far: 1000,
      }}
      onCreated={({ gl }) => {
        const renderer = gl as WebGLRenderer;
        bindGltfRenderer(renderer);
        renderer.setPixelRatio(cappedDevicePixelRatio());
      }}
    >
      <WebGlContextGuard />
      {children}
    </R3FCanvas>
  );
}
