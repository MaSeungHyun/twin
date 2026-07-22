import type { CongestionLevel, DataSource, Severity } from './common'

/** 알람 종류 — 패널·3D·fly-to 분기 */
export type AlarmType =
  | 'SAFETY_LINE_BREACH' // 안전선 침범 (S2)
  | 'TOILET_EMERGENCY' // 화장실 위급 (S3)
  | 'CONGESTION_THRESHOLD' // 혼잡 임계 초과
  | 'FALL_DETECTED' // 낙상 (P1~프로젝트)

/** subscribeAlarms / getActiveAlarms — 알람 패널·fly-to·CCTV SoT */
export interface AlarmEvent {
  id: string // upsert·ack 키
  stationId: string
  type: AlarmType
  severity: Severity
  zoneId: string // fly-to·하이라이트 구역
  zoneName: string // 알람 카드 표시용
  deviceId?: string // devices.json 설비 ID (CCTV·화장실 칸 등)
  deviceName?: string
  title: string // 알람 카드 제목
  message: string // 알람 카드 본문
  congestionPercent?: number // NF-09: 0~100
  congestionLevel?: CongestionLevel
  occurredAt: string // ISO 8601, mergeById 기준
  acknowledgedAt?: string | null // null=미확인
  acknowledgedBy?: string | null
  source: DataSource
  metadata?: Record<string, unknown> // 확장 필드
}

/** subscribeSensors push — Engine 버퍼→rAF (React 매 패킷 X) */
export interface SensorEvent {
  stationId: string
  zoneId: string
  deviceId: string
  congestionPercent: number // NF-09: 0~100
  congestionLevel: CongestionLevel
  occupantCount?: number
  capacity?: number
  updatedAt: string
  source: DataSource
}

/** getSensorSnapshot 1행 — 초기 로드 스냅샷 */
export interface SensorSnapshot {
  zoneId: string
  deviceId: string
  label: string
  congestionPercent: number
  congestionLevel: CongestionLevel
  occupantCount?: number
  capacity?: number
  updatedAt: string
}

/** 화장실 칸 재실 상태 */
export type ToiletStallStatus =
  | 'VACANT'
  | 'OCCUPIED'
  | 'EMERGENCY'
  | 'OFFLINE'

/** getToiletSnapshot 1행 — RestroomPanel 4칸 */
export interface ToiletStallState {
  deviceId: string
  zoneId: string
  label: string
  status: ToiletStallStatus
  updatedAt: string
}

/** subscribeToilet push — 재실 동기화 (위급 SoT는 AlarmEvent) */
export interface ToiletEvent {
  stationId: string
  zoneId: string
  deviceId: string
  label: string
  status: ToiletStallStatus
  updatedAt: string
  source: DataSource
}

/** NVR·스트림 연결 상태 */
export type CctvConnectionStatus = 'ONLINE' | 'CONNECTING' | 'OFFLINE' | 'ERROR'

/** subscribeCctvStatus push — deviceStore·3D 마커·영상 로드 */
export interface CctvStatusEvent {
  stationId: string
  deviceId: string
  zoneId: string
  status: CctvConnectionStatus
  updatedAt: string
  source: DataSource
}

/** WebSocket 봉투 — SocketRailwayAdapter (P2) */
export interface ServerMessage<T = unknown> {
  v: 1 // API_CONTRACT_VERSION
  type: 'alarm' | 'sensor' | 'toilet' | 'cctv-status' | 'snapshot'
  stationId: string
  payload: T
  sentAt: string
}
