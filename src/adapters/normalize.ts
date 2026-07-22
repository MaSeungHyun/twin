import type { CongestionLevel } from '@/types/common'

/** NF-09: 100% 초과 금지 */
export function clampCongestionPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function congestionLevelFromPercent(percent: number): CongestionLevel {
  const p = clampCongestionPercent(percent)
  if (p <= 40) return 'RELAXED'
  if (p <= 60) return 'NORMAL'
  if (p <= 80) return 'CAUTION'
  return 'SEVERE'
}
