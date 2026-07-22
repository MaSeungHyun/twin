import { useMemo } from 'react'

import { getStationBundle } from '@/data/stations/registry'
import {
  RESTROOM_PANEL_COPY,
  STALL_STATUS_LABEL,
  buildRestroomHint,
  stallStatusClass,
} from '@/lib/restroomUi'
import { matchesZoneFilter } from '@/lib/zones'
import { cn } from '@/lib/utils'
import { useAlarmStore } from '@/stores/alarmStore'
import { useDeviceStore } from '@/stores/deviceStore'
import { useUiStore } from '@/stores/uiStore'
import type { ToiletStallStatus } from '@/types/events'

const STALLS = getStationBundle('SEOUL').devices
  .filter((device) => device.deviceType === 'RESTROOM_STALL' && device.enabled)
  .sort((a, b) => a.displayOrder - b.displayOrder)

export function RestroomPanel() {
  const toiletById = useDeviceStore((s) => s.toiletById)
  const items = useAlarmStore((s) => s.items)
  const selectedZoneId = useUiStore((s) => s.selectedZoneId)
  const selectedDeviceId = useUiStore((s) => s.selectedDeviceId)
  const selectRestroomStall = useUiStore((s) => s.selectRestroomStall)

  const emergencyDeviceId = useMemo(() => {
    const active = items.find(
      (alarm) =>
        alarm.type === 'TOILET_EMERGENCY' &&
        !alarm.acknowledgedAt &&
        alarm.deviceId,
    )
    return active?.deviceId ?? null
  }, [items])

  const visibleStalls = useMemo(
    () => STALLS.filter((stall) => matchesZoneFilter(stall.zoneId, selectedZoneId)),
    [selectedZoneId],
  )

  const stalls = useMemo(
    () =>
      visibleStalls.map((stall) => {
        const snapshot = toiletById[stall.deviceId]
        let status: ToiletStallStatus = snapshot?.status ?? 'OFFLINE'
        if (emergencyDeviceId === stall.deviceId) {
          status = 'EMERGENCY'
        }
        return {
          deviceId: stall.deviceId,
          label: stall.label,
          status,
          updatedAt: snapshot?.updatedAt,
        }
      }),
    [emergencyDeviceId, visibleStalls, toiletById],
  )

  const hint = useMemo(() => buildRestroomHint(visibleStalls), [visibleStalls])

  if (stalls.length === 0) {
    return (
      <div className="panel-empty">
        <p className="panel-empty__title">{RESTROOM_PANEL_COPY.emptyTitle}</p>
        <p className="panel-empty__hint">{RESTROOM_PANEL_COPY.emptyHintZone}</p>
      </div>
    )
  }

  return (
    <div className="restroom-panel">
      {hint && <p className="restroom-panel__hint">{hint}</p>}
      <ul className="restroom-grid" aria-label="Restroom stall status">
        {stalls.map((stall) => {
          const isSelected = selectedDeviceId === stall.deviceId
          return (
            <li key={stall.deviceId}>
              <button
                type="button"
                className={cn(
                  'restroom-stall',
                  stallStatusClass(stall.status),
                  isSelected && 'restroom-stall--selected',
                )}
                onClick={() => selectRestroomStall(stall.deviceId)}
                aria-pressed={isSelected}
                aria-label={`${stall.label} ${STALL_STATUS_LABEL[stall.status]}`}
              >
                <span className="restroom-stall__label">{stall.label}</span>
                <span className="restroom-stall__status">{STALL_STATUS_LABEL[stall.status]}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
