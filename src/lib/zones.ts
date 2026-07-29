/** overview 선택 시 전 구역 표시 */
export function isOverviewZone(zoneId: string): boolean {
  return zoneId === "overview";
}

/** 헤더 구역 칩 기준 패널 필터 (F-03) */
export function matchesZoneFilter(
  itemZoneId: string,
  selectedZoneId: string,
): boolean {
  if (isOverviewZone(selectedZoneId)) return true;
  return itemZoneId === selectedZoneId;
}

/**
 * CCTV 오버레이 마커 — videoTitle(platform/transfer) 기준 구역 필터.
 * restroom 등 해당 없으면 숨김.
 */
export function matchesCctvMarkerZone(
  videoTitle: string,
  selectedZoneId: string,
): boolean {
  if (isOverviewZone(selectedZoneId)) return true;
  if (selectedZoneId === "transfer") return videoTitle.startsWith("transfer");
  if (selectedZoneId === "platform-56")
    return videoTitle.startsWith("platform");
  return false;
}
