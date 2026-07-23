import { Environment, Sky } from "@react-three/drei";

import ModelGallery from "../model/ModelGallery";
import WasteModels from "../model/WasteModels";
import CameraFlyer from "./CameraFlyer";
import Canvas from "./Canvas";
import Controls from "./Controls";
import FollowShadowLight from "./FollowShadowLight";

export default function ViewportScene() {
  return (
    <Canvas>
      <Sky />
      <Environment preset="city" environmentIntensity={0.28} />
      <FollowShadowLight />
      <Controls />
      <CameraFlyer />
      <ModelGallery />
      <WasteModels />
    </Canvas>
  );
}
