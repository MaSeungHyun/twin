import type { AlarmType } from '@/types/events'
import type { Severity } from '@/types/common'

/** Mock 데모 알람 템플릿 — id·occurredAt은 런타임 생성 */
export interface ScenarioAlarmTemplate {
  type: AlarmType
  severity: Severity
  zoneId: string
  deviceId?: string
  title: string
  message: string
  congestionPercent?: number
}

/** Mock 데모 1스텝 — delayMs 후 AlarmEvent push */
export interface ScenarioStep {
  id: string
  delayMs: number // connect 기준 지연 (ms)
  alarm: ScenarioAlarmTemplate
}

/** adapters/mock 시나리오 파일 루트 */
export interface ScenariosFile {
  stationId: string
  scenarios: ScenarioStep[]
}
