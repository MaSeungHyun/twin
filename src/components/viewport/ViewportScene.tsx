import { Environment } from "@react-three/drei";

import { isMobileDevice } from "@/lib/device";

import ModelGallery from "../model/ModelGallery";
import WasteModels from "../model/WasteModels";
import CameraFlyer from "./CameraFlyer";
import Canvas from "./Canvas";
import Controls from "./Controls";

export default function ViewportScene() {
  const mobile = isMobileDevice();
  const shadowMap = mobile ? 1024 : 2048;

  return (
    <Canvas>
      <color attach="background" args={["#000000"]} />
      <Environment preset="city" environmentIntensity={0.5} />
      <directionalLight
        castShadow
        position={[12, 2.5, 3]}
        intensity={1.55}
        shadow-mapSize={[shadowMap, shadowMap]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <Controls />
      <CameraFlyer />
      <ModelGallery />
      <WasteModels />
    </Canvas>
  );
}
