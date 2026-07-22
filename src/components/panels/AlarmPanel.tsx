import { useMemo } from 'react'

import { congestionLevelFromPercent } from '@/adapters/normalize'
import {
  ALARM_PANEL_COPY,
  ALARM_TYPE_LABEL,
  CONGESTION_LEVEL_LABEL,
  SEVERITY_LABEL,
  congestionLevelClass,
  severityBorderClass,
} from '@/lib/alarmUi'
import { formatAlarmTime, severityClass } from '@/lib/alarms'
import { matchesZoneFilter } from '@/lib/zones'
import { cn } from '@/lib/utils'
import { useAlarmStore } from '@/stores/alarmStore'
import { useUiStore } from '@/stores/uiStore'
import type { AlarmEvent } from '@/types/events'
import type { CongestionLevel } from '@/types/common'

function resolveCongestionLevel(alarm: AlarmEvent): CongestionLevel | null {
  if (alarm.congestionLevel) return alarm.congestionLevel
  if (alarm.congestionPercent !== undefined) {
    return congestionLevelFromPercent(alarm.congestionPercent)
  }
  return null
}

function AlarmCard({ alarm }: { alarm: AlarmEvent }) {
  const selectedAlarmId = useUiStore((s) => s.selectedAlarmId)
  const selectAlarm = useUiStore((s) => s.selectAlarm)
  const ack = useAlarmStore((s) => s.ack)

  const isSelected = selectedAlarmId === alarm.id
  const isAcked = Boolean(alarm.acknowledgedAt)
  const congestionLevel = resolveCongestionLevel(alarm)

  return (
    <li
      className={cn(
        'alarm-card',
        severityBorderClass(alarm.severity),
        isSelected && 'alarm-card--selected',
        isSelected && alarm.severity === 'CRITICAL' && 'alarm-card--selected-critical',
        isAcked && 'alarm-card--acked',
      )}
    >
      <button
        type="button"
        className="alarm-card__body"
        onClick={() => selectAlarm(alarm)}
      >
        <div className="alarm-card__head">
          <span className={cn('alarm-card__severity', severityClass(alarm.severity))}>
            {SEVERITY_LABEL[alarm.severity]}
          </span>
          <span className="alarm-card__type">{ALARM_TYPE_LABEL[alarm.type]}</span>
          <time className="alarm-card__time tabular-nums" dateTime={alarm.occurredAt}>
            {formatAlarmTime(alarm.occurredAt)}
          </time>
        </div>
        <p className="alarm-card__title">{alarm.title}</p>
        <p className="alarm-card__message">{alarm.message}</p>
        <div className="alarm-card__meta">
          <span className="alarm-card__zone">{alarm.zoneName}</span>
          {alarm.deviceName && (
            <>
              <span className="alarm-card__meta-dot" aria-hidden>
                ·
              </span>
              <span>{alarm.deviceName}</span>
            </>
          )}
        </div>
      </button>
      {(congestionLevel && alarm.congestionPercent !== undefined) || !isAcked ? (
        <div className="alarm-card__footer">
          {congestionLevel && alarm.congestionPercent !== undefined ? (
            <span
              className={cn(
                'alarm-card__congestion',
                congestionLevelClass(congestionLevel),
              )}
            >
              {CONGESTION_LEVEL_LABEL[congestionLevel]} {alarm.congestionPercent}%
            </span>
          ) : null}
          {!isAcked && (
            <button
              type="button"
              className="alarm-card__ack"
              onClick={() => ack(alarm.id)}
              aria-label={`${alarm.title} ${ALARM_PANEL_COPY.ack}`}
            >
              {ALARM_PANEL_COPY.ack}
            </button>
          )}
        </div>
      ) : null}
    </li>
  )
}

export function AlarmPanel() {
  const items = useAlarmStore((s) => s.items)
  const selectedZoneId = useUiStore((s) => s.selectedZoneId)

  const visible = useMemo(
    () =>
      items
        .filter((alarm) => matchesZoneFilter(alarm.zoneId, selectedZoneId))
        .sort((a, b) => {
          const ackDiff = Number(Boolean(a.acknowledgedAt)) - Number(Boolean(b.acknowledgedAt))
          if (ackDiff !== 0) return ackDiff
          return b.occurredAt.localeCompare(a.occurredAt)
        }),
    [items, selectedZoneId],
  )

  if (visible.length === 0) {
    return (
      <div className="panel-empty">
        <p className="panel-empty__title">{ALARM_PANEL_COPY.emptyTitle}</p>
        <p className="panel-empty__hint">
          {selectedZoneId === 'overview'
            ? ALARM_PANEL_COPY.emptyHintOverview
            : ALARM_PANEL_COPY.emptyHintZone}
        </p>
      </div>
    )
  }

  return (
    <ul className="alarm-list" aria-label="Active alarms">
      {visible.map((alarm) => (
        <AlarmCard key={alarm.id} alarm={alarm} />
      ))}
    </ul>
  )
}
