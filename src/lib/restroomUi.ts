import type { ToiletStallStatus } from '@/types/events'

/** 화장실 패널 UI — enum 상태는 KO, 셸·메타는 EN. */
export const STALL_STATUS_LABEL: Record<ToiletStallStatus, string> = {
  VACANT: '비어 있음',
  OCCUPIED: '사용 중',
  EMERGENCY: '위급',
  OFFLINE: '오프라인',
}

export const RESTROOM_PANEL_COPY = {
  emptyTitle: 'Restroom occupancy',
  emptyHintZone: 'No restroom stalls in this zone.',
} as const

export function stallStatusClass(status: ToiletStallStatus): string {
  switch (status) {
    case 'VACANT':
      return 'restroom-stall--vacant'
    case 'OCCUPIED':
      return 'restroom-stall--occupied'
    case 'EMERGENCY':
      return 'restroom-stall--emergency'
    default:
      return 'restroom-stall--offline'
  }
}

/** devices.json 라벨에서 구역 요약 (예: Men's restroom · 2F · 4 stalls) */
export function buildRestroomHint(
  stalls: ReadonlyArray<{ label: string; floor?: number }>,
): string {
  if (stalls.length === 0) return ''
  const floor = stalls[0].floor ?? '?'
  const baseName = stalls[0].label.replace(/\s+stall\s+\d+$/i, '')
  return `${baseName} · ${floor}F · ${stalls.length} stalls`
}
