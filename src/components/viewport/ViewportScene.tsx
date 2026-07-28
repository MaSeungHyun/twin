import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { StatsGl } from "@react-three/drei";

import { useOfficeStore } from "@/stores/officeStore";
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
  /** 층 선택(마커·영상 활성) 시 Bloom 부담 완화 */
  const markersActive = useOfficeStore(
    (s) =>
      s.activeFloorAction != null &&
      s.activeFloorAction !== "Default" &&
      s.floorCommand === null,
  );

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

      <EffectComposer multisampling={markersActive ? 0 : 1}>
        <Bloom
          intensity={markersActive ? 1.1 : 1.5}
          threshold={1}
          luminanceSmoothing={5}
          mipmapBlur
        />
      </EffectComposer>

      {import.meta.env.DEV ? (
        <StatsGl
          className="pointer-events-none absolute top-18 right-4 z-2"
          trackGPU
        />
      ) : null}
    </Canvas>
  );
}
