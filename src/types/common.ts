/** API·UI·3D 공통 열거형 — Mock ↔ 서버 동일 */

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

/** NF-09: UI·3D 표시용 4단계 (0~100%와 병행) */
export type CongestionLevel = 'RELAXED' | 'NORMAL' | 'CAUTION' | 'SEVERE'

export type DataSource = 'mock' | 'nvr' | 'sensor-hub' | 'tago' | 'restroom-hub'

export type Unsubscribe = () => void

export interface Vec3 {
  x: number
  y: number
  z: number
}

/** WS/API envelope version — 프로젝트 Socket 호환 */
export const API_CONTRACT_VERSION = 1 as const
