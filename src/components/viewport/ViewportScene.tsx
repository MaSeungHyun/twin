import { Suspense } from "react";

import Model from "../model/Model";
import Canvas from "./Canvas";
import Controls from "./Controls";

export default function ViewportScene() {
  return (
    <Canvas>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <Controls />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </Canvas>
  );
}
