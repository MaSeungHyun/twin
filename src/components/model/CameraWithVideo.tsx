import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Vector3, type PerspectiveCamera } from "three";

import { usePooledCctvVideo } from "@/hooks/usePooledCctvVideo";
import {
  cctvAlarmBadgeClass,
  cctvAlarmLabel,
  cctvAlarmRingClass,
  getStableCctvAlarmSeverity,
} from "@/lib/cctvAlarm";
import { clampPanelToViewport, worldToScreen } from "@/lib/cctvLeaderLine";
import { acquireCctvVideo } from "@/lib/cctvVideoPool";
import { cn } from "@/lib/utils";
import { useCctvAlarmActive, useCctvAlarmStore } from "@/stores/cctvAlarmStore";
import {
  CCTV_MARKER_Z_INDEX_DEFAULT,
  CCTV_MARKER_Z_INDEX_HOVER,
  computeCctvHtmlZIndex,
  useCctvMarkerHoverStore,
} from "@/stores/cctvMarkerHoverStore";
import { useCctvPopupStore } from "@/stores/cctvPopupStore";

const _worldPos = new Vector3();

type CameraWithVideoProps = {
  camera: PerspectiveCamera;
  videoSrc: string;
};

export default function CameraWithVideo({
  camera,
  videoSrc,
}: CameraWithVideoProps) {
  const groupRef = useRef<Group>(null);
  const htmlPortalRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wasHoveredRef = useRef(false);
  const [videoContainer, setVideoContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [isPointerOver, setIsPointerOver] = useState(false);

  const viewCamera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  const alarmSeverity = useMemo(
    () => getStableCctvAlarmSeverity(camera.name),
    [camera.name],
  );
  const isAlarmActive = useCctvAlarmActive(camera.uuid);
  const dismissAlarm = useCctvAlarmStore((state) => state.dismiss);
  const openPopup = useCctvPopupStore((state) => state.open);
  const isPopupOpen = useCctvPopupStore((state) => state.isOpen);
  const popupCameraId = useCctvPopupStore((state) => state.cameraId);
  const setHoveredId = useCctvMarkerHoverStore((state) => state.setHoveredId);
  const clearHoveredId = useCctvMarkerHoverStore(
    (state) => state.clearHoveredId,
  );

  const hostsVideo = !(isPopupOpen && popupCameraId === camera.uuid);
  const markerVisible = !isPopupOpen;

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
      cameraId: camera.uuid,
      cameraName: camera.name,
      videoSrc,
      alarmSeverity,
      startTime: video.currentTime,
    });
  }, [alarmSeverity, camera.name, camera.uuid, openPopup, videoSrc]);

  const handleDismissAlarm = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      dismissAlarm(camera.uuid);
    },
    [camera.uuid, dismissAlarm],
  );

  const resetPointerOver = useCallback(() => {
    setIsPointerOver(false);
    clearHoveredId(camera.uuid);
  }, [camera.uuid, clearHoveredId]);

  const handlePointerEnter = useCallback(() => {
    setIsPointerOver(true);
    setHoveredId(camera.uuid);
  }, [camera.uuid, setHoveredId]);

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
    const group = groupRef.current;
    const htmlPortal = htmlPortalRef.current;
    const panel = panelRef.current;
    const wrapper = wrapperRef.current;
    const line = lineRef.current;
    if (!group) return;

    camera.updateWorldMatrix(true, false);
    camera.getWorldPosition(_worldPos);
    group.position.copy(_worldPos);

    const hoveredId = useCctvMarkerHoverStore.getState().hoveredId;
    const isHoveredNow = hoveredId === camera.uuid;

    if (htmlPortal) {
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

    if (!panel || !wrapper || !markerVisible) return;

    _worldPos.project(viewCamera);
    const screen = worldToScreen(_worldPos.x, _worldPos.y, _worldPos.z, size);

    if (!screen.visible) {
      wrapper.style.visibility = "hidden";
      return;
    }
    wrapper.style.visibility = "visible";

    const { offsetX, offsetY, clamped } = clampPanelToViewport(
      screen.x,
      screen.y,
      panel.offsetWidth,
      panel.offsetHeight,
      size,
    );

    panel.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    if (line) {
      line.setAttribute("x2", String(offsetX));
      line.setAttribute("y2", String(offsetY));
      line.style.opacity = clamped ? "1" : "0";
    }
  }, 100);

  return (
    <group ref={groupRef}>
      <Html
        center
        wrapperClass="cctv-html-marker"
        zIndexRange={CCTV_MARKER_Z_INDEX_DEFAULT}
        style={{
          pointerEvents: markerVisible ? "auto" : "none",
          visibility: markerVisible ? "visible" : "hidden",
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
              strokeWidth={1.5}
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
            className="relative w-[200px] origin-center touch-manipulation cursor-pointer"
          >
            <div
              ref={cardRef}
              className={cn(
                "bg-bg/95 origin-center overflow-hidden rounded-md border-2 shadow-lg transition-transform duration-150 ease-out",
                isAlarmActive
                  ? cctvAlarmRingClass(alarmSeverity)
                  : "border-border",
              )}
              style={{ transform: isPointerOver ? "scale(3)" : "scale(1)" }}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              onPointerCancel={handlePointerLeave}
            >
              <div className="bg-accent/20 text-text flex items-center gap-1 px-2 py-1 text-xs font-semibold">
                <span>{camera.name}</span>
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
    </group>
  );
}
