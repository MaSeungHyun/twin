import type { Vec3 } from './common'

/** devices.json deviceType — UI·3D·Mock 분기 */
export type DeviceType =
  | 'CCTV' // 일반 CCTV
  | 'SAFETY_LINE_CAMERA' // 안전선 감지 카메라
  | 'CONGESTION_CAMERA' // 혼잡 AI 카메라
  | 'RESTROOM_STALL' // 화장실 칸
  | 'CONGESTION_SENSOR' // 비영상 혼잡 센서
  | 'SIGNAL' // 신호기 (P1)

/** PoC 핵심 구역 — config.json zones·헤더 칩 */
export type ZoneId = 'overview' | 'transfer' | 'restroom' | 'platform-56'

/** config.json cameraPresets — fly-to 프리셋 */
export interface CameraPreset {
  id: string // 프리셋 키 (overview, transfer …)
  position: [number, number, number] // Orbit 카메라 위치
  target: [number, number, number] // Orbit lookAt
  durationMs?: number // fly-to 보간 시간 (ms)
}

/** config.json zones[] — 구역·fly-to·하이라이트 */
export interface ZoneConfig {
  zoneId: ZoneId | string // AlarmEvent·uiStore와 매칭
  name: string // UI 표시명
  floor: number // 층 번호
  bounds?: { min: Vec3; max: Vec3 } // 3D 피킹·하이라이트 AABB
  cameraPresetId: string // cameraPresets Record 키
  sortOrder?: number // 헤더 구역 칩 순서
}

/** config.json floors[] — 층별 기본 뷰 */
export interface FloorConfig {
  level: number // 층 번호
  name: string // 층 표시명
  viewCenter: [number, number, number] // 층 기본 뷰 중심
  viewDistance?: number // 층 기본 카메라 거리
}

/** config.json 루트 — getStationConfig() */
export interface StationConfig {
  stationId: string // 역 ID (SEOUL)
  displayName: string // 헤더·UI 표시명
  tagoNodeId: string // TAGO API nodeId
  modelUrl: string // GLB URL (PoC는 빈 문자열·매스)
  floors: FloorConfig[] // 층 목록
  zones: ZoneConfig[] // 구역 목록
  cameraPresets: Record<string, CameraPreset> // 카메라 프리셋 맵
}

/** devices.json 항목 — getDevices(), 정적 메타 */
export interface DeviceMetadata {
  deviceId: string // 설비 고유 ID (알람·3D 마커 키)
  deviceType: DeviceType // 하드웨어 분류
  zoneId: string // 소속 구역
  floor: number // 설치 층
  position: Vec3 // 3D 마커 좌표
  rotation?: Vec3 // 3D 마커 회전
  label: string // 패널 표시명
  category: 'congestion' | 'safety-line' | 'restroom' | 'signal' // 기능 분류·필터
  displayOrder: number // 목록·3D 표시 순서
  streamUrl?: string // 메인 CCTV (Mock mp4 / HLS·WebRTC)
  streamSubUrl?: string // 보조 스트림
  thumbnailUrl?: string // 인근 썸네일 JPEG
  capacity?: number // 혼잡 설계 기준 인원
  enabled: boolean // false면 제외
}

/** tracks.json points[] — 열차 스플라인 1점 */
export interface TrackPoint {
  x: number
  y: number
  z: number
}

/** tracks.json tracks[] — 열차 진입·정차 궤적 */
export interface TrackConfig {
  trackId: string // 궤적 ID
  name: string // 표시명
  platformZoneId: string // 연결 승강장 (platform-56)
  points: TrackPoint[] // progress 0→1 스플라인
  dwellDurationMs?: number // 정차 시간 (ms)
  approachDurationMs?: number // 진입 연출 시간 (ms)
}

/** tracks.json 루트 — getTracks() */
export interface TracksFile {
  stationId: string
  tracks: TrackConfig[]
}
