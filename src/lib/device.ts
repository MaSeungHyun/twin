/** 태블릿·모바일 등 메모리·GPU가 제한된 환경 감지 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrowViewport = window.matchMedia("(max-width: 1024px)").matches;

  return coarsePointer || narrowViewport;
}

/**
 * 레티나 fill-rate·VRAM 폭주 → WebGL context lost 완화.
 * 모바일 1x, 데스크톱 최대 1.5x.
 */
export function cappedDevicePixelRatio(): number {
  const raw = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return isMobileDevice() ? Math.min(raw, 1) : Math.min(raw, 1.5);
}
