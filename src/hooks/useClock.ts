import { useNow } from '@/hooks/useNow'

/** 헤더 시계 문자열 — useNow와 동일 틱(전광판 NOW 라인과 동기) */
export function useClock(tickMs = 1000): string {
  return useNow(tickMs).label
}
