import { useMemo, useRef } from 'react'

import { useVideoStream } from '@/hooks/useVideoStream'
import { buildCctvContextIds, shortCameraLabel } from '@/lib/cctvContext'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/deviceStore'
import { useUiStore } from '@/stores/uiStore'

function statusLabel(status: string): string {
  switch (status) {
    case 'CONNECTING':
      return 'Connecting…'
    case 'OFFLINE':
      return 'Offline'
    case 'ERROR':
      return 'Error'
    default:
      return 'Live'
  }
}

function Thumbnail({
  deviceId,
  label,
  active,
  onSelect,
}: {
  deviceId: string
  label: string
  active: boolean
  onSelect: () => void
}) {
  const device = useDeviceStore((s) => s.byId[deviceId])
  const status = device?.cctvStatus ?? 'OFFLINE'

  return (
    <button
      type="button"
      className={cn('cctv-thumb', active && 'cctv-thumb--active')}
      onClick={onSelect}
      aria-label={`View ${label}`}
      aria-pressed={active}
    >
      <div className="cctv-thumb__frame">
        {device?.thumbnailUrl ? (
          <img src={device.thumbnailUrl} alt="" className="cctv-thumb__img" />
        ) : (
          <span className="cctv-thumb__placeholder">{label}</span>
        )}
        {status !== 'ONLINE' && (
          <span className="cctv-thumb__badge">{statusLabel(status)}</span>
        )}
      </div>
      <span className="cctv-thumb__label">{label}</span>
    </button>
  )
}

export function CctvPanel() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const selectedDeviceId = useUiStore((s) => s.selectedDeviceId)
  const selectedAlarmId = useUiStore((s) => s.selectedAlarmId)
  const cctvContextIds = useUiStore((s) => s.cctvContextIds)
  const setSelectedDeviceId = useUiStore((s) => s.setSelectedDeviceId)

  const mainDevice = useDeviceStore((s) =>
    selectedDeviceId ? s.byId[selectedDeviceId] : undefined,
  )
  const byId = useDeviceStore((s) => s.byId)

  const contextIds = useMemo(() => {
    if (cctvContextIds.length > 0) return cctvContextIds
    if (!selectedDeviceId) return []
    return buildCctvContextIds(selectedDeviceId, byId)
  }, [cctvContextIds, selectedDeviceId, byId])

  const streamEnabled = Boolean(
    mainDevice?.streamUrl &&
      (mainDevice.cctvStatus === 'ONLINE' || mainDevice.cctvStatus === 'CONNECTING'),
  )

  useVideoStream(videoRef, mainDevice?.streamUrl, streamEnabled)

  const header = useMemo(() => {
    if (mainDevice) return mainDevice.label
    if (selectedAlarmId) return 'Select a camera'
    return 'CCTV'
  }, [mainDevice, selectedAlarmId])

  if (!mainDevice) {
    return (
      <div className="panel-empty">
        <p className="panel-empty__title">CCTV</p>
        <p className="panel-empty__hint">Select an alarm to view contextual video.</p>
      </div>
    )
  }

  return (
    <div className="cctv-panel">
      <div className="cctv-panel__header">
        <span className="cctv-panel__title">{header}</span>
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
                ? 'Camera offline — stream unavailable.'
                : 'Mock stream not loaded. Add MP4 under public/mock/cctv/.'}
            </p>
          </div>
        )}
      </div>

      {contextIds.length > 1 && (
        <div className="cctv-panel__nearby">
          <p className="cctv-panel__nearby-title">Nearby cameras</p>
          <div className="cctv-panel__thumbs">
            {contextIds.map((deviceId) => {
              const device = byId[deviceId]
              if (!device) return null
              return (
                <Thumbnail
                  key={deviceId}
                  deviceId={deviceId}
                  label={shortCameraLabel(device.label)}
                  active={selectedDeviceId === deviceId}
                  onSelect={() => setSelectedDeviceId(deviceId)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
