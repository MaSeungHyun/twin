import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { StatsGl } from "@react-three/drei";

import { isMobileDevice } from "@/lib/device";
import { useViewportTestStore } from "@/stores/viewportTestStore";
import Office from "../model/Office";
import Canvas from "./Canvas";
import CompassController from "./CompassController";
import Controls from "./Controls";
import FollowShadowLight from "./FollowShadowLight";
import LoadProgressSync from "./LoadProgressSync";
import OfficeCameraFlyer from "./OfficeCameraFlyer";
import SceneShadowSync from "./SceneShadowSync";

const IS_DEV = import.meta.env.DEV;

export default function ViewportScene() {
  const postProcessingEnabled = useViewportTestStore(
    (s) => s.postProcessingEnabled,
  );
  const antialiasEnabled = useViewportTestStore((s) => s.antialiasEnabled);
  const gpuPowerPreference = useViewportTestStore((s) => s.gpuPowerPreference);

  /** Bloom/EffectComposer는 모바일·태블릿에서 VRAM·fill-rate 부담이 큼 */
  const usePostProcessing = postProcessingEnabled && !isMobileDevice();

  return (
    <Canvas antialias={antialiasEnabled} powerPreference={gpuPowerPreference}>
      <SceneShadowSync />
      <FollowShadowLight />
      <Controls />
      <LoadProgressSync />
      <CompassController />
      <OfficeCameraFlyer />
      <Office />

      {usePostProcessing ? (
        <EffectComposer multisampling={1}>
          <Bloom
            intensity={1.5}
            threshold={1}
            luminanceSmoothing={5}
            mipmapBlur
          />
        </EffectComposer>
      ) : null}
      {IS_DEV ? (
        <StatsGl className="pointer-events-none absolute top-18 right-4 z-2" />
      ) : null}
    </Canvas>
  );
}
