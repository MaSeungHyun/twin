import type { CongestionLevel, Severity } from '@/types/common'
import type { AlarmType } from '@/types/events'

/** 알람 패널 UI — enum 라벨만 (문구 분산 방지). 셸·버튼은 EN, 이벤트 상태는 KO. */
export const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: '긴급',
  HIGH: '경고',
  MEDIUM: '주의',
  LOW: '낮음',
}

export const ALARM_TYPE_LABEL: Record<AlarmType, string> = {
  SAFETY_LINE_BREACH: 'Safety line',
  TOILET_EMERGENCY: 'Restroom',
  CONGESTION_THRESHOLD: 'Congestion',
  FALL_DETECTED: 'Fall',
}

export const CONGESTION_LEVEL_LABEL: Record<CongestionLevel, string> = {
  RELAXED: '여유',
  NORMAL: '보통',
  CAUTION: '주의',
  SEVERE: '심각',
}

export const ALARM_PANEL_COPY = {
  ack: 'Ack',
  emptyTitle: 'All clear',
  emptyHintOverview: 'New alarms will appear here.',
  emptyHintZone: 'No alarms in this zone.',
} as const

export function congestionLevelClass(level: CongestionLevel): string {
  switch (level) {
    case 'RELAXED':
      return 'alarm-card__congestion--relaxed'
    case 'NORMAL':
      return 'alarm-card__congestion--normal'
    case 'CAUTION':
      return 'alarm-card__congestion--caution'
    default:
      return 'alarm-card__congestion--severe'
  }
}

export function severityBorderClass(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'alarm-card--severity-critical'
    case 'HIGH':
      return 'alarm-card--severity-high'
    default:
      return ''
  }
}
