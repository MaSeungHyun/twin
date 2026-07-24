import { Bloom, EffectComposer } from "@react-three/postprocessing";

import Testing from "../model/Testing";
import { useViewportTestStore } from "@/stores/viewportTestStore";
import CameraFlyer from "./CameraFlyer";
import Canvas from "./Canvas";
import Controls from "./Controls";
import FollowShadowLight from "./FollowShadowLight";
import SceneShadowSync from "./SceneShadowSync";

export default function ViewportScene() {
  const postProcessingEnabled = useViewportTestStore(
    (s) => s.postProcessingEnabled,
  );
  const antialiasEnabled = useViewportTestStore((s) => s.antialiasEnabled);

  return (
    <Canvas antialias={antialiasEnabled}>
      <SceneShadowSync />
      <FollowShadowLight />
      <Controls />
      <CameraFlyer />
      <Testing />
      <EffectComposer enabled={postProcessingEnabled} multisampling={4}>
        <Bloom
          intensity={1.5}
          threshold={1}
          luminanceSmoothing={5}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
