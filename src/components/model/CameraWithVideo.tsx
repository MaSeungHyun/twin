import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import { Group, type PerspectiveCamera } from "three";

import { usePooledCctvVideo } from "@/hooks/usePooledCctvVideo";
import {
  cctvAlarmBadgeClass,
  cctvAlarmLabel,
  cctvAlarmRingClass,
  getStableCctvAlarmSeverity,
} from "@/lib/cctvAlarm";
import { acquireCctvVideo } from "@/lib/cctvVideoPool";
import { cn } from "@/lib/utils";
import { useCctvAlarmActive, useCctvAlarmStore } from "@/stores/cctvAlarmStore";
import { useCctvPopupStore } from "@/stores/cctvPopupStore";

type CameraWithVideoProps = {
  camera: PerspectiveCamera;
  videoSrc: string;
};

export default function CameraWithVideo({
  camera,
  videoSrc,
}: CameraWithVideoProps) {
  const groupRef = useRef<Group>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const alarmSeverity = useMemo(
    () => getStableCctvAlarmSeverity(camera.name),
    [camera.name],
  );
  const isAlarmActive = useCctvAlarmActive(camera.uuid);
  const dismissAlarm = useCctvAlarmStore((state) => state.dismiss);
  const openPopup = useCctvPopupStore((state) => state.open);
  const isPopupOpen = useCctvPopupStore((state) => state.isOpen);
  const popupCameraId = useCctvPopupStore((state) => state.cameraId);

  const hostsVideo = !(isPopupOpen && popupCameraId === camera.uuid);
  const markerVisible = !isPopupOpen;

  usePooledCctvVideo(videoContainerRef, videoSrc, hostsVideo, {
    className: "block aspect-video w-full bg-black object-cover",
  });

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

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    camera.updateWorldMatrix(true, false);
    camera.getWorldPosition(group.position);
  });

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={12}
        sprite
        transform
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: markerVisible ? "auto" : "none",
          visibility: markerVisible ? "visible" : "hidden",
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpenPopup}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpenPopup();
            }
          }}
          className={cn(
            "bg-bg/95 w-[200px] touch-manipulation cursor-pointer overflow-hidden rounded-md border-2 shadow-lg transition-transform duration-150 ease-out [@media(hover:hover)]:hover:scale-[5.02] [@media(hover:none)]:active:scale-[5.05]",
            isAlarmActive ? cctvAlarmRingClass(alarmSeverity) : "border-border",
          )}
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
            ref={videoContainerRef}
            className="block aspect-video w-full bg-black"
          />
        </div>
      </Html>
    </group>
  );
}
