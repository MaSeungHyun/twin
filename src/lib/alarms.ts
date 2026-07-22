import type { AlarmEvent } from '@/types/events'

export function countUnacked(items: AlarmEvent[]): number {
  return items.filter((a) => !a.acknowledgedAt).length
}

/** 스냅샷·push 레이스 병합 — id 기준 occurredAt 최신 우선 */
export function mergeById(snapshot: AlarmEvent[], pending: AlarmEvent[]): AlarmEvent[] {
  const map = new Map<string, AlarmEvent>()
  for (const event of [...snapshot, ...pending]) {
    const prev = map.get(event.id)
    if (!prev || event.occurredAt >= prev.occurredAt) {
      map.set(event.id, event)
    }
  }
  return [...map.values()].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function formatAlarmTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function severityClass(severity: AlarmEvent['severity']): string {
  switch (severity) {
    case 'CRITICAL':
      return 'alarm-card__severity--critical'
    case 'HIGH':
      return 'alarm-card__severity--high'
    case 'MEDIUM':
      return 'alarm-card__severity--medium'
    default:
      return 'alarm-card__severity--low'
  }
}
