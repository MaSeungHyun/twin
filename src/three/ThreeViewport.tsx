import { useUiStore } from "@/stores/uiStore";

/**
 * 순수 Three.js 뷰포트 (R3F 미사용).
 * M3: mount 시 StationEngine + engineBridge.registerEngine
 * Orbit 시작 전 uiStore.isPointerOverPanel 확인 (04 §4.6)
 */
export function ThreeViewport() {
  const pointerOverPanel = useUiStore((s) => s.isPointerOverPanel);

  return (
    <div
      className="three-viewport"
      data-pointer-over-panel={pointerOverPanel ? "" : undefined}
    >
      {/* <span className="three-viewport__placeholder">Three.js Viewport</span> */}
    </div>
  );
}
