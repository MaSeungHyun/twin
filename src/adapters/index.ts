import { MockRailwayAdapter } from './MockRailwayAdapter'
import type { IRailwayStationAdapter } from './types'

/** PoC 기본 어댑터 — 프로젝트: SocketRailwayAdapter로 교체 */
export const railwayAdapter: IRailwayStationAdapter = new MockRailwayAdapter()

export type { IRailwayStationAdapter } from './types'
export { tagoTrainClient, TagoTrainClient } from './TagoTrainClient'
