import { useRef } from 'react'

import {
  getCctvPanelVideo,
  resolveOfficeCameraVideoId,
} from '@/data/officeCameraVideos'
import { useVideoStream } from '@/hooks/useVideoStream'
import { acquireCctvVideo } from '@/lib/cctvVideoPool'
import { useDeviceStore, type DeviceRuntime } from '@/stores/deviceStore'
import { useCctvPopupStore } from '@/stores/cctvPopupStore'
import { useUiStore } from '@/stores/uiStore'

/** 소켓/원격 streamUrl 대신 로컬 데모 영상 매핑 대상 */
function isCamera(device: DeviceRuntime): boolean {
  return device.category === 'congestion' || device.category === 'safety-line'
}

function localVideoTitle(device: DeviceRuntime): string {
  return resolveOfficeCameraVideoId(device.deviceId, device.zoneId)
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
  )
}

export function CctvPanel() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const selectedDeviceId = useUiStore((s) => s.selectedDeviceId)
  const byId = useDeviceStore((s) => s.byId)
  const openPopup = useCctvPopupStore((s) => s.open)

  const mainDevice =
    selectedDeviceId && byId[selectedDeviceId] && isCamera(byId[selectedDeviceId])
      ? byId[selectedDeviceId]
      : undefined

  const localSrc = mainDevice
    ? getCctvPanelVideo(mainDevice.deviceId, mainDevice.zoneId)
    : undefined
  const videoTitle = mainDevice ? localVideoTitle(mainDevice) : ''

  useVideoStream(videoRef, localSrc, Boolean(localSrc))

  const handleExpand = () => {
    if (!mainDevice || !localSrc) return

    let startTime = videoRef.current?.currentTime ?? 0
    try {
      const pooled = acquireCctvVideo(localSrc)
      if (videoRef.current) {
        pooled.currentTime = videoRef.current.currentTime
        startTime = pooled.currentTime
      }
    } catch {
      /* seek 불가 시 무시 */
    }

    openPopup({
      cameraId: mainDevice.deviceId,
      cameraName: videoTitle,
      statusKey: videoTitle,
      videoSrc: localSrc,
      startTime,
    })
  }

  if (!mainDevice || !localSrc) {
    return (
      <div className="panel-empty panel-empty--compact">
        <p className="panel-empty__title">영상 없음</p>
        <p className="panel-empty__hint">
          알람을 선택하면 해당 CCTV 영상이 여기에 표시됩니다.
        </p>
      </div>
    )
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
  )
}
