import type { TagoTrainRow } from '@/types/tago'

/** 예정 시각 N분 전까지 승차(Now) 구간으로 취급 */
export const BOARDING_BEFORE_MS = 5 * 60 * 1000
/** 예정 시각 N분 지나야 지난 편(past)으로 흐림 */
export const PAST_AFTER_MS = 3 * 60 * 1000

export type ScheduleRowPhase = 'past' | 'boarding' | 'next' | 'upcoming'

export type ScheduleTimelineItem =
  | { kind: 'now-marker' }
  | { kind: 'row'; row: TagoTrainRow; phase: ScheduleRowPhase }

export function rowTimeMs(row: TagoTrainRow, tab: 'depart' | 'arrive'): number {
  return tab === 'depart' ? row.depAtMs : row.arrAtMs
}

export function classifyRowPhase(
  timeMs: number,
  nowMs: number,
  isNext: boolean,
): ScheduleRowPhase {
  if (!Number.isFinite(timeMs)) return 'upcoming'
  if (timeMs + PAST_AFTER_MS < nowMs) return 'past'
  if (timeMs - BOARDING_BEFORE_MS <= nowMs && nowMs <= timeMs + PAST_AFTER_MS) {
    return 'boarding'
  }
  if (isNext) return 'next'
  return 'upcoming'
}

export function buildScheduleTimeline(
  rows: TagoTrainRow[],
  nowMs: number,
  tab: 'depart' | 'arrive',
): ScheduleTimelineItem[] {
  const nextIndex = rows.findIndex((row) => rowTimeMs(row, tab) >= nowMs)
  const items: ScheduleTimelineItem[] = []

  for (let i = 0; i < rows.length; i++) {
    if (i === nextIndex) items.push({ kind: 'now-marker' })
    const timeMs = rowTimeMs(rows[i], tab)
    items.push({
      kind: 'row',
      row: rows[i],
      phase: classifyRowPhase(timeMs, nowMs, i === nextIndex),
    })
  }

  if (nextIndex === -1) items.push({ kind: 'now-marker' })
  return items
}

export function timelineScrollTarget(
  items: ScheduleTimelineItem[],
): 'now-marker' | 'next' | null {
  if (items.some((item) => item.kind === 'row' && item.phase === 'boarding')) {
    return 'now-marker'
  }
  if (items.some((item) => item.kind === 'row' && item.phase === 'next')) {
    return 'next'
  }
  if (items.some((item) => item.kind === 'now-marker')) return 'now-marker'
  return null
}
