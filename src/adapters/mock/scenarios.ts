import type { ScenariosFile } from '@/adapters/mock/types'

import seoulScenarios from './seoul-scenarios.json'

const MOCK_SCENARIOS: Record<string, ScenariosFile> = {
  SEOUL: seoulScenarios as unknown as ScenariosFile,
}

/** MockRailwayAdapter 전용 — 역별 데모 알람 연출 스크립트 */
export function getMockScenarios(stationId: string): ScenariosFile | null {
  return MOCK_SCENARIOS[stationId] ?? null
}
