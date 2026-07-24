import { Bloom, EffectComposer } from "@react-three/postprocessing";

import { useViewportTestStore } from "@/stores/viewportTestStore";
import Canvas from "./Canvas";
import Controls from "./Controls";
import FollowShadowLight from "./FollowShadowLight";
import OfficeCameraFlyer from "./OfficeCameraFlyer";
import SceneShadowSync from "./SceneShadowSync";
import { Sky, StatsGl } from "@react-three/drei";
import Office from "../model/Office";

export default function ViewportScene() {
  const postProcessingEnabled = useViewportTestStore(
    (s) => s.postProcessingEnabled,
  );
  const antialiasEnabled = useViewportTestStore((s) => s.antialiasEnabled);
  const gpuPowerPreference = useViewportTestStore((s) => s.gpuPowerPreference);

  return (
    <Canvas antialias={antialiasEnabled} powerPreference={gpuPowerPreference}>
      <Sky />
      <SceneShadowSync />
      <FollowShadowLight />
      <Controls />
      <OfficeCameraFlyer />
      <Office />
      <EffectComposer enabled={postProcessingEnabled} multisampling={4}>
        <Bloom
          intensity={1.5}
          threshold={1}
          luminanceSmoothing={5}
          mipmapBlur
        />
      </EffectComposer>
      <StatsGl className="pointer-events-none absolute top-2 right-2 z-2" />
    </Canvas>
  );
}
