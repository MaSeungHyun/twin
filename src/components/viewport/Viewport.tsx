import { Suspense } from "react";
import Canvas from "./Canvas";
import { Sky } from "@react-three/drei";
import Controls from "./Controls";
import Fallback from "./Fallback";
import Model from "../model/Model";

export default function Viewport() {
  return (
    <div className="flex flex-1 w-full h-full">
      <Canvas>
        <Sky />
        <ambientLight intensity={1} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <Controls />
        <Suspense fallback={<Fallback />}>
          <Model />
        </Suspense>
      </Canvas>
    </div>
  );
}
