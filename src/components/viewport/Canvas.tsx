import { Canvas as R3FCanvas, type Vector3 } from "@react-three/fiber";
import { WebGLRenderer } from "three";
import type { WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.Nodes.js";

import { isMobileDevice } from "@/lib/device";
import { bindGltfRenderer } from "@/three/gltfLoader";

const INITIAL_CAMERA_POSITION: Vector3 = [3, 3, 5];

type CanvasProps = {
  enableGPU: boolean;
  children: React.ReactNode;
};

export default function Canvas({
  enableGPU,
  children,
}: CanvasProps): React.ReactNode {
  return (
    <R3FCanvas
      key={enableGPU ? "gpu" : "cpu"}
      gl={async (props) => {
        const mobile = isMobileDevice();
        const rendererProps = {
          ...props,
          powerPreference: mobile ? "low-power" : "default",
          antialias: !mobile,
        } as typeof props;

        if (enableGPU) {
          const { WebGPURenderer } = await import("three/webgpu");
          const renderer = new WebGPURenderer(
            rendererProps as unknown as WebGPURendererParameters,
          );
          await renderer.init();
          return renderer;
        }
        return new WebGLRenderer(rendererProps);
      }}
      frameloop="demand"
      dpr={isMobileDevice() ? 1 : undefined}
      onCreated={({ gl }) => {
        if (gl instanceof WebGLRenderer) {
          bindGltfRenderer(gl);
        }
      }}
      camera={{ position: INITIAL_CAMERA_POSITION }}
    >
      {children}
    </R3FCanvas>
  );
}
