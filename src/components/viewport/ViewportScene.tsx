import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { StatsGl } from "@react-three/drei";

import { useViewportTestStore } from "@/stores/viewportTestStore";
import Office from "../model/Office";
import Canvas from "./Canvas";
import CompassController from "./CompassController";
import Controls from "./Controls";
import FollowShadowLight from "./FollowShadowLight";
import FrameloopPauseOnPopup from "./FrameloopPauseOnPopup";
import LoadProgressSync from "./LoadProgressSync";
import OfficeCameraFlyer from "./OfficeCameraFlyer";
import SceneShadowSync from "./SceneShadowSync";

export default function ViewportScene() {
  const antialiasEnabled = useViewportTestStore((s) => s.antialiasEnabled);
  const gpuPowerPreference = useViewportTestStore((s) => s.gpuPowerPreference);

  return (
    <Canvas antialias={antialiasEnabled} powerPreference={gpuPowerPreference}>
      <FrameloopPauseOnPopup />
      <SceneShadowSync />
      <FollowShadowLight />
      <Controls />
      <LoadProgressSync />
      <CompassController />
      <OfficeCameraFlyer />
      <Office />

      <EffectComposer multisampling={1}>
        <Bloom
          intensity={1.5}
          threshold={1}
          luminanceSmoothing={5}
          mipmapBlur
        />
      </EffectComposer>

      {/* {import.meta.env.DEV ? ( */}
      <StatsGl
        className="pointer-events-none absolute top-18 right-4 z-2"
        trackGPU
      />
      {/* ) : null} */}
    </Canvas>
  );
}
