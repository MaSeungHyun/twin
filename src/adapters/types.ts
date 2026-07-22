import type {
  AlarmEvent,
  CctvStatusEvent,
  SensorEvent,
  SensorSnapshot,
  ToiletEvent,
  ToiletStallState,
} from '@/types/events'
import type { StationConfig, DeviceMetadata, TracksFile } from '@/types/station'
import type { Unsubscribe } from '@/types/common'

/**
 * 관제 실시간·정적 데이터 계약.
 * MockRailwayAdapter ↔ SocketRailwayAdapter 동일 시그니처 유지.
 */
export interface IRailwayStationAdapter {
  readonly contractVersion: number

  connect(stationId: string): Promise<void>
  disconnect(): void

  getStationConfig(stationId: string): Promise<StationConfig>
  getDevices(stationId: string): Promise<DeviceMetadata[]>
  getTracks(stationId: string): Promise<TracksFile | null>

  getActiveAlarms(stationId: string): Promise<AlarmEvent[]>
  getSensorSnapshot(stationId: string, zoneId?: string): Promise<SensorSnapshot[]>
  getToiletSnapshot(stationId: string): Promise<ToiletStallState[]>

  subscribeAlarms(cb: (event: AlarmEvent) => void): Unsubscribe
  subscribeSensors(cb: (event: SensorEvent) => void): Unsubscribe
  subscribeToilet(cb: (event: ToiletEvent) => void): Unsubscribe
  subscribeCctvStatus(cb: (event: CctvStatusEvent) => void): Unsubscribe
}
