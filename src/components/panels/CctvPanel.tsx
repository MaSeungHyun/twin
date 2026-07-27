import { useMemo, useRef, useState } from 'react'

import { getStationBundle } from '@/data/stations/registry'
import { useVideoStream } from '@/hooks/useVideoStream'
import { shortCameraLabel } from '@/lib/cctvContext'
import { matchesZoneFilter } from '@/lib/zones'
import { cn } from '@/lib/utils'
import { useDeviceStore, type DeviceRuntime } from '@/stores/deviceStore'
import { useUiStore } from '@/stores/uiStore'
import { focusDevice as bridgeFocusDevice } from '@/three/engine/engineBridge'

const ZONE_NAMES = Object.fromEntries(
  getStationBundle('SEOUL').config.zones.map((z) => [z.zoneId, z.name]),
)

function statusLabel(status: string): string {
  switch (status) {
    case 'CONNECTING':
      return '연결 중'
    case 'OFFLINE':
      return '오프라인'
    case 'ERROR':
      return '오류'
    default:
      return 'Live'
  }
}

function isCamera(device: DeviceRuntime): boolean {
  return device.category !== 'restroom' && Boolean(device.streamUrl)
}

function thumbnailFor(device: DeviceRuntime): string | undefined {
  if (device.thumbnailUrl) return device.thumbnailUrl
  if (!device.streamUrl) return undefined
  return device.streamUrl.replace(/\.mp4(\?.*)?$/i, '.jpg')
}

function CctvTileImage({ src, label }: { src?: string; label: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <span className="cctv-tile__placeholder">{label}</span>
  }
  return (
    <img
      src={src}
      alt=""
      className="cctv-tile__img"
      onError={() => setFailed(true)}
    />
  )
}

export function CctvPanel() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const selectedZoneId = useUiStore((s) => s.selectedZoneId)
  const selectedDeviceId = useUiStore((s) => s.selectedDeviceId)
  const setSelectedDeviceId = useUiStore((s) => s.setSelectedDeviceId)
  const cctvExpanded = useUiStore((s) => s.cctvExpanded)
  const byId = useDeviceStore((s) => s.byId)

  const cameras = useMemo(() => {
    return Object.values(byId)
      .filter(isCamera)
      .filter((device) => matchesZoneFilter(device.zoneId, selectedZoneId))
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [byId, selectedZoneId])

  const mainDevice = selectedDeviceId ? byId[selectedDeviceId] : undefined
  const hasPlayer = Boolean(mainDevice && isCamera(mainDevice))
  const mainInFilter =
    mainDevice && isCamera(mainDevice)
      ? matchesZoneFilter(mainDevice.zoneId, selectedZoneId)
      : false

  const streamEnabled = Boolean(
    mainDevice?.streamUrl &&
      (mainDevice.cctvStatus === 'ONLINE' || mainDevice.cctvStatus === 'CONNECTING'),
  )

  useVideoStream(videoRef, mainDevice?.streamUrl, streamEnabled && Boolean(mainDevice))

  const zoneLabel =
    selectedZoneId === 'overview' ? '전체' : (ZONE_NAMES[selectedZoneId] ?? selectedZoneId)
  const showZoneOnTile = selectedZoneId === 'overview'

  const selectCamera = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    bridgeFocusDevice(deviceId)
  }

  const clearSelection = () => setSelectedDeviceId(null)

  return (
    <div
      className={cn(
        'cctv-panel',
        cctvExpanded && 'cctv-panel--expanded',
        cctvExpanded && hasPlayer && 'cctv-panel--split',
      )}
    >
      <div className="cctv-panel__header">
        <div className="cctv-panel__header-text">
          <span className="cctv-panel__meta">
            {zoneLabel} · {cameras.length}대
            {cctvExpanded ? ' · 확장' : ''}
          </span>
        </div>
        {hasPlayer && (
          <button type="button" className="cctv-panel__clear" onClick={clearSelection}>
            목록만
          </button>
        )}
      </div>

      {hasPlayer && mainDevice && (
        <div className="cctv-panel__player">
          <div className="cctv-panel__player-head">
            <span className="cctv-panel__player-title">{mainDevice.label}</span>
            <span
              className={cn(
                'cctv-panel__status',
                mainDevice.cctvStatus !== 'ONLINE' && 'cctv-panel__status--warn',
              )}
            >
              {statusLabel(mainDevice.cctvStatus)}
            </span>
          </div>
          <div className="cctv-panel__main">
            {streamEnabled ? (
              <video
                ref={videoRef}
                className="cctv-panel__video"
                muted
                playsInline
                controls
                aria-label={mainDevice.label}
              />
            ) : (
              <div className="cctv-panel__placeholder">
                <p>{mainDevice.label}</p>
                <p className="cctv-panel__placeholder-hint">
                  {mainDevice.cctvStatus === 'OFFLINE'
                    ? '카메라 오프라인 — 스트림 없음'
                    : 'Mock 영상 없음 (public/mock/cctv/)'}
                </p>
              </div>
            )}
          </div>
          {!mainInFilter && (
            <p className="cctv-panel__filter-note">
              현재 구역 필터 밖 카메라입니다. 상단에서 「전체」를 선택하면 목록에 표시됩니다.
            </p>
          )}
        </div>
      )}

      {cameras.length === 0 ? (
        <div className="panel-empty">
          <p className="panel-empty__title">카메라 없음</p>
          <p className="panel-empty__hint">
            이 구역에 표시할 CCTV가 없습니다. 상단에서 다른 구역을 선택해 보세요.
          </p>
        </div>
      ) : (
        <div className="cctv-grid" role="list">
          {cameras.map((device) => {
            const active = selectedDeviceId === device.deviceId
            const offline = device.cctvStatus !== 'ONLINE'
            return (
              <button
                key={device.deviceId}
                type="button"
                role="listitem"
                className={cn('cctv-tile', active && 'cctv-tile--active')}
                onClick={() => selectCamera(device.deviceId)}
                aria-pressed={active}
                aria-label={device.label}
              >
                <div className="cctv-tile__frame">
                  <CctvTileImage
                    src={thumbnailFor(device)}
                    label={shortCameraLabel(device.label)}
                  />
                  {offline && (
                    <span className="cctv-tile__badge">{statusLabel(device.cctvStatus)}</span>
                  )}
                  {active && <span className="cctv-tile__live">재생 중</span>}
                </div>
                <div className="cctv-tile__meta">
                  <span className="cctv-tile__name">{shortCameraLabel(device.label)}</span>
                  {showZoneOnTile && (
                    <span className="cctv-tile__zone">
                      {ZONE_NAMES[device.zoneId] ?? device.zoneId}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
