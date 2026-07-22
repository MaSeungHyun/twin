import { Canvas as R3FCanvas, type Vector3 } from "@react-three/fiber";
import { WebGLRenderer } from "three";
import type { WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.Nodes.js";

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
        if (enableGPU) {
          const { WebGPURenderer } = await import("three/webgpu");
          const renderer = new WebGPURenderer(
            props as unknown as WebGPURendererParameters,
          );
          await renderer.init();
          return renderer;
        }
        return new WebGLRenderer(props);
      }}
      frameloop="demand"
      camera={{ position: INITIAL_CAMERA_POSITION }}
    >
      {children}
    </R3FCanvas>
  );
}
