/** 태블릿·모바일 등 메모리·GPU가 제한된 환경 감지 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const narrowViewport = window.matchMedia('(max-width: 1024px)').matches

  return coarsePointer || narrowViewport
}
