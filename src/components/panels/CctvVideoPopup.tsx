import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useTransientCctvVideo } from "@/hooks/useTransientCctvVideo";
import {
  cctvAlarmBadgeClass,
  cctvAlarmRingClass,
  cctvAlarmLabel,
  isCctvAlarmSeverity,
} from "@/lib/cctvAlarm";
import { cn } from "@/lib/utils";
import { useCctvAlarmActive, useCctvAlarmStore } from "@/stores/cctvAlarmStore";
import { useCctvCameraStatus } from "@/stores/cctvCameraStatusStore";
import { useCctvPopupStore } from "@/stores/cctvPopupStore";

export default function CctvVideoPopup() {
  const isOpen = useCctvPopupStore((state) => state.isOpen);
  const cameraId = useCctvPopupStore((state) => state.cameraId);
  const cameraName = useCctvPopupStore((state) => state.cameraName);
  const statusKey = useCctvPopupStore((state) => state.statusKey);
  const videoSrc = useCctvPopupStore((state) => state.videoSrc);
  const startTime = useCctvPopupStore((state) => state.startTime);
  const close = useCctvPopupStore((state) => state.close);

  const cameraStatus = useCctvCameraStatus(statusKey);
  const alarmSeverity = isCctvAlarmSeverity(cameraStatus)
    ? cameraStatus
    : null;
  const isAlarmActive = useCctvAlarmActive(cameraId) && alarmSeverity != null;
  const dismissAlarm = useCctvAlarmStore((state) => state.dismiss);
  const [videoContainer, setVideoContainer] = useState<HTMLDivElement | null>(
    null,
  );

  useTransientCctvVideo(videoContainer, videoSrc, isOpen, {
    className: "pointer-events-none block aspect-video w-full bg-black object-contain",
    startTime,
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] grid place-items-center bg-[rgba(8,10,14,0.72)] p-6 backdrop-blur-sm"
      role="presentation"
      onClick={close}
    >
      <div
        className={cn(
          "w-5/6 overflow-hidden rounded-xl border-2 bg-bg shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
          isAlarmActive && alarmSeverity
            ? cctvAlarmRingClass(alarmSeverity)
            : "border-border",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`${cameraName} CCTV`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-white/3 px-4 py-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="m-0 text-[15px] font-semibold">{cameraName}</h2>
            {isAlarmActive && alarmSeverity && (
              <button
                type="button"
                className={cctvAlarmBadgeClass(alarmSeverity)}
                onClick={() => dismissAlarm(cameraId)}
                aria-label={`Dismiss ${cctvAlarmLabel(alarmSeverity)} alarm`}
              >
                {cctvAlarmLabel(alarmSeverity)}
              </button>
            )}
          </div>
          <button
            type="button"
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent text-[22px] leading-none text-text transition-colors hover:bg-white/8"
            onClick={close}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div ref={setVideoContainer} className="aspect-video bg-black" />
      </div>
    </div>,
    document.body,
  );
}
