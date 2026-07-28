import { useCallback, useEffect, useRef, useState } from "react";

import { usePooledCctvVideo } from "@/hooks/usePooledCctvVideo";
import {
  cctvAlarmBadgeClass,
  cctvAlarmLabel,
  cctvAlarmRingClass,
  isCctvAlarmSeverity,
} from "@/lib/cctvAlarm";
import {
  registerCctvHtmlMarker,
  unregisterCctvHtmlMarker,
  updateCctvHtmlMarker,
} from "@/lib/cctvHtmlLayout";
import { acquireCctvVideo } from "@/lib/cctvVideoPool";
import { cn } from "@/lib/utils";
import { useCctvAlarmActive, useCctvAlarmStore } from "@/stores/cctvAlarmStore";
import { useCctvCameraStatus } from "@/stores/cctvCameraStatusStore";
import { useCctvMarkerHoverStore } from "@/stores/cctvMarkerHoverStore";
import {
  useCctvOverlayStore,
  type CctvOverlayMarkerDef,
} from "@/stores/cctvOverlayStore";
import { useCctvPopupStore } from "@/stores/cctvPopupStore";
import { useOfficeStore } from "@/stores/officeStore";

function useMarkerVisibleByFloor(floor: CctvOverlayMarkerDef["floor"]) {
  return useOfficeStore((state) => {
    if (state.floorCommand !== null) return false;
    return (
      state.activeFloorAction != null &&
      state.activeFloorAction !== "Default" &&
      floor != null &&
      state.activeFloorAction === floor
    );
  });
}

function CctvOverlayMarker({
  id,
  markerName,
  videoTitle,
  videoSrc,
  floor,
}: CctvOverlayMarkerDef) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const [videoContainer, setVideoContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [isPointerOver, setIsPointerOver] = useState(false);

  const cameraStatus = useCctvCameraStatus(markerName);
  const alarmSeverity = isCctvAlarmSeverity(cameraStatus)
    ? cameraStatus
    : null;
  const markerVisibleByFloor = useMarkerVisibleByFloor(floor);
  const isAlarmActive = useCctvAlarmActive(id) && alarmSeverity != null;
  const dismissAlarm = useCctvAlarmStore((s) => s.dismiss);
  const openPopup = useCctvPopupStore((s) => s.open);
  const isPopupOpen = useCctvPopupStore((s) => s.isOpen);
  const popupCameraId = useCctvPopupStore((s) => s.cameraId);
  const setHoveredId = useCctvMarkerHoverStore((s) => s.setHoveredId);
  const clearHoveredId = useCctvMarkerHoverStore((s) => s.clearHoveredId);

  const hostsVideo =
    markerVisibleByFloor && !(isPopupOpen && popupCameraId === id);
  const showMarker = markerVisibleByFloor && !isPopupOpen;

  usePooledCctvVideo(videoContainer, videoSrc, hostsVideo, {
    className:
      "pointer-events-none block aspect-video w-full bg-black object-cover",
  });

  useEffect(() => {
    registerCctvHtmlMarker(id);
    return () => unregisterCctvHtmlMarker(id);
  }, [id]);

  useEffect(() => {
    if (!showMarker) return;

    const root = rootRef.current;
    const panel = panelRef.current;
    const line = lineRef.current;
    if (!root || !panel) return;

    updateCctvHtmlMarker(id, { root, panel, line });

    const syncSize = () => {
      updateCctvHtmlMarker(id, {
        width: panel.offsetWidth,
        height: panel.offsetHeight,
      });
    };
    syncSize();

    const ro = new ResizeObserver(syncSize);
    ro.observe(panel);
    return () => {
      ro.disconnect();
      updateCctvHtmlMarker(id, {
        root: null,
        panel: null,
        line: null,
        active: false,
        width: 0,
        height: 0,
      });
    };
  }, [id, showMarker]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.hovered = isPointerOver ? "1" : "0";
  }, [isPointerOver, showMarker]);

  useEffect(() => {
    if (!markerVisibleByFloor) {
      clearHoveredId(id);
      updateCctvHtmlMarker(id, { active: false });
    }
  }, [clearHoveredId, id, markerVisibleByFloor]);

  const resetPointerOver = useCallback(() => {
    setIsPointerOver(false);
    clearHoveredId(id);
  }, [clearHoveredId, id]);

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

  const handleOpenPopup = useCallback(() => {
    const video = acquireCctvVideo(videoSrc);
    openPopup({
      cameraId: id,
      cameraName: videoTitle,
      statusKey: markerName,
      videoSrc,
      startTime: video.currentTime,
    });
  }, [id, markerName, openPopup, videoSrc, videoTitle]);

  if (!showMarker) return null;

  return (
    <div
      ref={rootRef}
      className="cctv-overlay-marker pointer-events-auto absolute top-0 left-0 will-change-transform"
      style={{ transform: "translate(-9999px, -9999px)" }}
    >
      <div className="relative">
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
          className="relative w-[100px] origin-center cursor-pointer touch-manipulation md:w-[120px] lg:w-[150px]"
        >
          <div
            ref={cardRef}
            className={cn(
              "bg-bg/95 origin-center overflow-hidden rounded-md border-2 shadow-lg transition-transform duration-150 ease-out",
              isAlarmActive && alarmSeverity
                ? cctvAlarmRingClass(alarmSeverity)
                : "border-border",
            )}
            style={{ transform: isPointerOver ? "scale(1.5)" : "scale(1)" }}
            onPointerEnter={() => {
              setIsPointerOver(true);
              setHoveredId(id);
            }}
            onPointerLeave={(event) => {
              const related = event.relatedTarget;
              if (
                related instanceof Node &&
                event.currentTarget.contains(related)
              ) {
                return;
              }
              resetPointerOver();
            }}
            onPointerCancel={resetPointerOver}
          >
            <div className="bg-accent/20 text-text flex items-center gap-1 px-2 py-1 text-xs font-semibold">
              <span>{videoTitle}</span>
              {isAlarmActive && alarmSeverity && (
                <button
                  type="button"
                  className={cctvAlarmBadgeClass(alarmSeverity)}
                  onClick={(event) => {
                    event.stopPropagation();
                    dismissAlarm(id);
                  }}
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
    </div>
  );
}

/** Canvas 위 React 레이어 — 3D 투영 좌표에 맞춰 CCTV 마커 표시 */
export default function CctvOverlayLayer() {
  const markers = useCctvOverlayStore((s) => s.markers);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-label="CCTV markers"
    >
      {markers.map((marker) => (
        <CctvOverlayMarker key={marker.id} {...marker} />
      ))}
    </div>
  );
}
