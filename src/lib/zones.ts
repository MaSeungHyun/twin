/** overview 선택 시 전 구역 표시 */
export function isOverviewZone(zoneId: string): boolean {
  return zoneId === 'overview'
}

/** 헤더 구역 칩 기준 패널 필터 (F-03) */
export function matchesZoneFilter(itemZoneId: string, selectedZoneId: string): boolean {
  if (isOverviewZone(selectedZoneId)) return true
  return itemZoneId === selectedZoneId
}
