import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Object3D, Vector3, type Camera } from "three";

import { usePooledCctvVideo } from "@/hooks/usePooledCctvVideo";
import {
  cctvAlarmBadgeClass,
  cctvAlarmLabel,
  cctvAlarmRingClass,
  getStableCctvAlarmSeverity,
} from "@/lib/cctvAlarm";
import { clampPanelToViewport, worldToScreen } from "@/lib/cctvLeaderLine";
import {
  registerCctvHtmlMarker,
  unregisterCctvHtmlMarker,
  updateCctvHtmlMarker,
} from "@/lib/cctvHtmlLayout";
import { acquireCctvVideo } from "@/lib/cctvVideoPool";
import {
  CCTV_MARKER_LIFT_Y,
  getCctvMarkerWorldOffset,
} from "@/data/cctvMarkerOffsets";
import { cn } from "@/lib/utils";
import { useCctvAlarmActive, useCctvAlarmStore } from "@/stores/cctvAlarmStore";
import {
  CCTV_MARKER_Z_INDEX_DEFAULT,
  CCTV_MARKER_Z_INDEX_HOVER,
  computeCctvHtmlZIndex,
  useCctvMarkerHoverStore,
} from "@/stores/cctvMarkerHoverStore";
import { useCctvPopupStore } from "@/stores/cctvPopupStore";
import { useOfficeStore } from "@/stores/officeStore";
import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";

const _worldPos = new Vector3();
const _calcPos = new Vector3();
const _cameraPos = new Vector3();

function applyMarkerWorldOffset(
  source: Object3D,
  offset: [number, number, number],
  target: Vector3,
) {
  source.getWorldPosition(target);
  target.x += offset[0];
  target.y += offset[1];
  target.z += offset[2];
}

function calculateMarkerPosition(
  el: Object3D,
  camera: Camera,
  viewport: { width: number; height: number },
) {
  _calcPos.setFromMatrixPosition(el.matrixWorld);
  _calcPos.project(camera);
  const screen = worldToScreen(_calcPos.x, _calcPos.y, _calcPos.z, viewport);
  return [screen.x, screen.y] as [number, number];
}

type CameraWithVideoProps = {
  anchor: Object3D;
  markerName: string;
  videoTitle: string;
  videoSrc: string;
  floor?: OfficeFloorObjectKey | null;
};

export default function CameraWithVideo({
  anchor,
  markerName,
  videoTitle,
  videoSrc,
  floor = null,
}: CameraWithVideoProps) {
  const groupRef = useRef<Group>(null);
  const htmlPortalRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wasHoveredRef = useRef(false);
  const isPointerOverRef = useRef(false);
  const [videoContainer, setVideoContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [isPointerOver, setIsPointerOver] = useState(false);

  const viewCamera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  const markerId = anchor.uuid;

  const alarmSeverity = useMemo(
    () => getStableCctvAlarmSeverity(markerName),
    [markerName],
  );
  const markerOffset = useMemo(() => getCctvMarkerWorldOffset(), []);
  const markerVisibleByFloor = useOfficeStore((state) => {
    if (state.floorCommand !== null) return false;
    return (
      state.activeFloorAction != null &&
      state.activeFloorAction !== "Default" &&
      floor != null &&
      state.activeFloorAction === floor
    );
  });
  const isAlarmActive = useCctvAlarmActive(markerId);
  const dismissAlarm = useCctvAlarmStore((state) => state.dismiss);
  const openPopup = useCctvPopupStore((state) => state.open);
  const isPopupOpen = useCctvPopupStore((state) => state.isOpen);
  const popupCameraId = useCctvPopupStore((state) => state.cameraId);
  const setHoveredId = useCctvMarkerHoverStore((state) => state.setHoveredId);
  const clearHoveredId = useCctvMarkerHoverStore(
    (state) => state.clearHoveredId,
  );

  const hostsVideo =
    markerVisibleByFloor && !(isPopupOpen && popupCameraId === markerId);
  const markerVisible = markerVisibleByFloor && !isPopupOpen;

  usePooledCctvVideo(videoContainer, videoSrc, hostsVideo, {
    className:
      "pointer-events-none block aspect-video w-full bg-black object-cover",
  });

  const setWrapperRef = useCallback((node: HTMLDivElement | null) => {
    wrapperRef.current = node;
    htmlPortalRef.current =
      node?.closest<HTMLElement>(".cctv-html-marker") ?? null;
  }, []);

  const handleOpenPopup = useCallback(() => {
    const video = acquireCctvVideo(videoSrc);
    openPopup({
      cameraId: markerId,
      cameraName: videoTitle,
      videoSrc,
      alarmSeverity,
      startTime: video.currentTime,
    });
  }, [alarmSeverity, markerId, openPopup, videoSrc, videoTitle]);

  const handleDismissAlarm = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      dismissAlarm(markerId);
    },
    [markerId, dismissAlarm],
  );

  const resetPointerOver = useCallback(() => {
    setIsPointerOver(false);
    clearHoveredId(markerId);
  }, [markerId, clearHoveredId]);

  const handlePointerEnter = useCallback(() => {
    setIsPointerOver(true);
    setHoveredId(markerId);
  }, [markerId, setHoveredId]);

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const related = event.relatedTarget;
      if (related instanceof Node && event.currentTarget.contains(related)) {
        return;
      }

      resetPointerOver();
    },
    [resetPointerOver],
  );

  useEffect(() => {
    registerCctvHtmlMarker(markerId);
    return () => unregisterCctvHtmlMarker(markerId);
  }, [markerId]);

  useEffect(() => {
    if (markerVisibleByFloor) return;

    clearHoveredId(markerId);
    updateCctvHtmlMarker(markerId, {
      active: false,
      panel: null,
      line: null,
      anchorX: 0,
      anchorY: 0,
      width: 0,
      height: 0,
      base: { offsetX: 0, offsetY: 0, clamped: false },
      clamped: false,
      lineStartX: 0,
      lineStartY: 0,
      showLine: false,
    });
  }, [clearHoveredId, markerId, markerVisibleByFloor]);

  useEffect(() => {
    isPointerOverRef.current = isPointerOver;
  }, [isPointerOver]);

  useEffect(() => {
    if (!isPointerOver) return;

    const handleGlobalPointer = (event: PointerEvent) => {
      const card = cardRef.current;
      if (!card) return;

      const target = event.target;
      if (target instanceof Node && card.contains(target)) return;

      resetPointerOver();
    };

    document.addEventListener("pointermove", handleGlobalPointer, true);
    document.addEventListener("pointerdown", handleGlobalPointer, true);
    return () => {
      document.removeEventListener("pointermove", handleGlobalPointer, true);
      document.removeEventListener("pointerdown", handleGlobalPointer, true);
    };
  }, [isPointerOver, resetPointerOver]);

  useFrame(() => {
    if (!markerVisibleByFloor) return;

    anchor.updateWorldMatrix(true, false);
    const group = groupRef.current;
    if (!group) return;

    applyMarkerWorldOffset(anchor, markerOffset, _worldPos);
    group.position.copy(_worldPos);
    group.updateWorldMatrix(true, false);
  }, -1);

  useFrame(() => {
    const group = groupRef.current;
    const htmlPortal = htmlPortalRef.current;
    const panel = panelRef.current;
    const wrapper = wrapperRef.current;
    const line = lineRef.current;
    if (!group || !markerVisibleByFloor) return;

    const popupOpen = useCctvPopupStore.getState().isOpen;
    const markerVisibleNow = !popupOpen;

    applyMarkerWorldOffset(anchor, markerOffset, _worldPos);

    const hoveredId = useCctvMarkerHoverStore.getState().hoveredId;
    const isHoveredNow = hoveredId === markerId;

    if (htmlPortal) {
      htmlPortal.style.display = markerVisibleNow ? "block" : "none";

      htmlPortal.style.zIndex = String(
        isHoveredNow
          ? CCTV_MARKER_Z_INDEX_HOVER
          : computeCctvHtmlZIndex(
              group,
              viewCamera,
              CCTV_MARKER_Z_INDEX_DEFAULT,
            ),
      );

      if (isHoveredNow && !wasHoveredRef.current) {
        htmlPortal.parentElement?.appendChild(htmlPortal);
      }
      wasHoveredRef.current = isHoveredNow;
    }

    if (!markerVisibleNow) {
      updateCctvHtmlMarker(markerId, {
        active: false,
        panel: null,
        line: null,
        anchorX: 0,
        anchorY: 0,
        width: 0,
        height: 0,
        base: { offsetX: 0, offsetY: 0, clamped: false },
        clamped: false,
        lineStartX: 0,
        lineStartY: 0,
        showLine: false,
      });
      return;
    }

    if (!panel || !wrapper) return;

    _worldPos.project(viewCamera);
    const screen = worldToScreen(_worldPos.x, _worldPos.y, _worldPos.z, size);

    anchor.getWorldPosition(_cameraPos);
    _cameraPos.project(viewCamera);
    const cameraScreen = worldToScreen(
      _cameraPos.x,
      _cameraPos.y,
      _cameraPos.z,
      size,
    );

    wrapper.style.visibility = "visible";

    const { offsetX, offsetY, clamped } = clampPanelToViewport(
      screen.x,
      screen.y,
      panel.offsetWidth,
      panel.offsetHeight,
      size,
    );

    const scale = isPointerOverRef.current ? 1.5 : 1;
    const layoutWidth = panel.offsetWidth * scale;
    const layoutHeight = panel.offsetHeight * scale;

    updateCctvHtmlMarker(markerId, {
      anchorX: screen.x,
      anchorY: screen.y,
      width: layoutWidth,
      height: layoutHeight,
      base: { offsetX, offsetY, clamped },
      clamped,
      active: true,
      panel,
      line,
      lineStartX: cameraScreen.x - screen.x,
      lineStartY: cameraScreen.y - screen.y,
      showLine: clamped || screen.offScreen || CCTV_MARKER_LIFT_Y > 0,
    });
  }, 99);

  return (
    <group ref={groupRef}>
      {markerVisibleByFloor ? (
        <Html
          center
          calculatePosition={calculateMarkerPosition}
          wrapperClass="cctv-html-marker"
          zIndexRange={CCTV_MARKER_Z_INDEX_DEFAULT}
          style={{
            pointerEvents: markerVisible ? "auto" : "none",
          }}
        >
          <div ref={setWrapperRef} className="relative">
            <svg
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 overflow-visible"
              width={1}
              height={1}
            >
              <line
                ref={lineRef}
                x1={0}
                y1={0}
                x2={0}
                y2={0}
                stroke="rgba(77, 163, 255, 0.9)"
                strokeWidth={3}
                strokeLinecap="round"
                style={{ opacity: 0 }}
              />
            </svg>

            <div
              ref={panelRef}
              role="button"
              tabIndex={0}
              onClick={handleOpenPopup}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenPopup();
                }
              }}
              className="relative w-[100px] md:w-[120px] lg:w-[150px] origin-center touch-manipulation cursor-pointer"
            >
              <div
                ref={cardRef}
                className={cn(
                  "bg-bg/95 origin-center overflow-hidden rounded-md border-2 shadow-lg transition-transform duration-150 ease-out",
                  isAlarmActive
                    ? cctvAlarmRingClass(alarmSeverity)
                    : "border-border",
                )}
                style={{ transform: isPointerOver ? "scale(1.5)" : "scale(1)" }}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onPointerCancel={handlePointerLeave}
              >
                <div className="bg-accent/20 text-text flex items-center gap-1 px-2 py-1 text-xs font-semibold">
                  <span>{videoTitle}</span>
                  {isAlarmActive && (
                    <button
                      type="button"
                      className={cctvAlarmBadgeClass(alarmSeverity)}
                      onClick={handleDismissAlarm}
                      aria-label={`Dismiss ${cctvAlarmLabel(alarmSeverity)} alarm`}
                    >
                      {cctvAlarmLabel(alarmSeverity)}
                    </button>
                  )}
                </div>
                <div
                  ref={setVideoContainer}
                  className="block aspect-video w-full bg-black"
                />
              </div>
            </div>
          </div>
        </Html>
      ) : null}
    </group>
  );
}
