import { useMemo, useRef } from "react";

import {
  getCctvMarkerVideoByVideoId,
  getCctvPanelVideoByVideoId,
  resolveOfficeCameraVideoId,
} from "@/data/officeCameraVideos";
import { useVideoStream } from "@/hooks/useVideoStream";
import { acquireCctvVideo } from "@/lib/cctvVideoPool";
import { useDeviceStore, type DeviceRuntime } from "@/stores/deviceStore";
import { useCctvPopupStore } from "@/stores/cctvPopupStore";
import { useUiStore } from "@/stores/uiStore";

/** 소켓/원격 streamUrl 대신 로컬 데모 영상 매핑 대상 */
function isCamera(device: DeviceRuntime): boolean {
  return device.category === "congestion" || device.category === "safety-line";
}

function ExpandIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function readMarkerCurrentTime(markerSrc: string): number {
  try {
    return acquireCctvVideo(markerSrc).currentTime;
  } catch {
    return 0;
  }
}

export function CctvPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const selectedDeviceId = useUiStore((s) => s.selectedDeviceId);
  const selectedAlarmId = useUiStore((s) => s.selectedAlarmId);
  const byId = useDeviceStore((s) => s.byId);
  const openPopup = useCctvPopupStore((s) => s.open);

  const mainDevice =
    selectedDeviceId &&
    byId[selectedDeviceId] &&
    isCamera(byId[selectedDeviceId])
      ? byId[selectedDeviceId]
      : undefined;

  // 알람 id(office 등)가 있으면 마커와 동일 클립으로, 없으면 deviceId 매핑
  const videoId = mainDevice
    ? resolveOfficeCameraVideoId(
        selectedAlarmId ?? mainDevice.deviceId,
        mainDevice.zoneId,
      )
    : null;

  const localSrc = videoId ? getCctvPanelVideoByVideoId(videoId) : undefined;
  const markerSrc = videoId ? getCctvMarkerVideoByVideoId(videoId) : undefined;
  const videoTitle = videoId ?? "";

  const startTime = useMemo(() => {
    if (!markerSrc) return 0;
    return readMarkerCurrentTime(markerSrc);
  }, [markerSrc, selectedDeviceId, selectedAlarmId]);

  useVideoStream(videoRef, localSrc, Boolean(localSrc), startTime);

  const handleExpand = () => {
    if (!mainDevice || !localSrc || !markerSrc) return;

    let seekTo = readMarkerCurrentTime(markerSrc);
    try {
      const panelTime = videoRef.current?.currentTime;
      if (panelTime != null && panelTime > 0) seekTo = panelTime;
    } catch {
      /* ignore */
    }

    openPopup({
      cameraId: mainDevice.deviceId,
      cameraName: videoTitle,
      statusKey: selectedAlarmId || videoTitle,
      videoSrc: localSrc,
      startTime: seekTo,
    });
  };

  if (!mainDevice || !localSrc) {
    return (
      <div className="panel-empty panel-empty--compact">
        <p className="panel-empty__title">영상 없음</p>
        <p className="panel-empty__hint">
          알람을 선택하면 해당 CCTV 영상이 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="cctv-panel cctv-panel--viewer">
      <div className="cctv-panel__player">
        <p className="cctv-panel__player-title">
          {mainDevice.label}
          <span className="cctv-panel__player-file"> · {videoTitle}</span>
        </p>
        <div className="cctv-panel__main">
          <video
            ref={videoRef}
            className="cctv-panel__video"
            muted
            playsInline
            loop
            aria-label={mainDevice.label}
          />
          <button
            type="button"
            className="cctv-panel__expand"
            onClick={handleExpand}
            aria-label="크게 보기"
            title="크게 보기"
          >
            <ExpandIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
