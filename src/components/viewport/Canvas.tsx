import { Canvas as R3FCanvas, type Vector3 } from "@react-three/fiber";
import type { WebGLRenderer } from "three";

import { bindGltfRenderer } from "@/three/gltfLoader";

const INITIAL_CAMERA_POSITION: Vector3 = [3, 3, 5];

type CanvasProps = {
  children: React.ReactNode;
};

export default function Canvas({ children }: CanvasProps): React.ReactNode {
  return (
    <R3FCanvas
      gl={{ antialias: true }}
      camera={{ position: INITIAL_CAMERA_POSITION }}
      onCreated={({ gl }) => {
        bindGltfRenderer(gl as WebGLRenderer);
      }}
    >
      {children}
    </R3FCanvas>
  );
}
