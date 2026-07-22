import { getStationBundle } from '@/data/stations/registry'
import { useClock } from '@/hooks/useClock'
import { cn } from '@/lib/utils'
import type { ScheduleStatus } from '@/stores/scheduleStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useAlarmStore } from '@/stores/alarmStore'
import { useUiStore } from '@/stores/uiStore'

const STATION = getStationBundle('SEOUL')
const ZONES = [...STATION.config.zones].sort(
  (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
)

function tagoBadgeForStatus(status: ScheduleStatus) {
  switch (status) {
    case 'fresh':
      return { label: 'Live · TAGO', className: 'header-bar__badge--live' }
    case 'stale':
      return { label: 'TAGO Delayed', className: 'header-bar__badge--tago-warn' }
    case 'error':
      return { label: 'TAGO Unavailable', className: 'header-bar__badge--tago-error' }
    case 'loading':
      return { label: 'TAGO Loading', className: 'header-bar__badge--tago-muted' }
    default:
      return { label: 'TAGO', className: 'header-bar__badge--tago-muted' }
  }
}

export function HeaderBar() {
  const clock = useClock()
  const selectedZoneId = useUiStore((s) => s.selectedZoneId)
  const unackedAlarmCount = useAlarmStore((s) => s.unackedCount)
  const selectZone = useUiStore((s) => s.selectZone)
  const scheduleStatus = useScheduleStore((s) => s.status)
  const tagoBadge = tagoBadgeForStatus(scheduleStatus)

  return (
    <header className="header-bar">
      <div className="header-bar__brand">
        <span className="header-bar__station">
          {STATION.config.displayName} Control
        </span>
        <span className="header-bar__clock tabular-nums">{clock}</span>
      </div>

      <nav className="header-bar__zones" aria-label="Zone selection">
        {ZONES.map((zone) => (
          <button
            key={zone.zoneId}
            type="button"
            className={cn(
              'header-bar__chip',
              selectedZoneId === zone.zoneId && 'header-bar__chip--active',
            )}
            onClick={() => selectZone(zone.zoneId, zone.cameraPresetId)}
          >
            {zone.name}
          </button>
        ))}
      </nav>

      <div className="header-bar__meta">
        {unackedAlarmCount > 0 && (
          <span className="header-bar__unacked">
            Unacked {unackedAlarmCount}
          </span>
        )}
        <span className={cn('header-bar__badge', tagoBadge.className)}>
          {tagoBadge.label}
        </span>
        <span className="header-bar__badge header-bar__badge--mock">Mock · CCTV</span>
      </div>
    </header>
  )
}
