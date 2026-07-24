import Testing from "../model/Testing";
import CameraFlyer from "./CameraFlyer";
import Canvas from "./Canvas";
import Controls from "./Controls";
import FollowShadowLight from "./FollowShadowLight";

export default function ViewportScene() {
  return (
    <Canvas>
      <FollowShadowLight />
      <Controls />
      <CameraFlyer />
      <Testing />
    </Canvas>
  );
}
