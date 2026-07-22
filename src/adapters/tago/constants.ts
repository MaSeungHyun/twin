/** TAGO TrainInfo — dev 프록시: /api/tago → apis.data.go.kr/1613000/TrainInfo */
export const TAGO_API_BASE = '/api/tago'

/** Swagger 오퍼레이션 경로 (PascalCase) */
export const TAGO_OPS = {
  cityCodes: 'GetCtyCodeList',
  stations: 'GetCtyAcctoTrainSttnList',
  vehicleKinds: 'GetVhcleKndList',
  timetable: 'GetStrtpntAlocFndTrainInfo',
} as const

/** 서울역 시간표 조회용 주요 허브 — TAGO는 dep + arr 모두 필요 */
export const TAGO_MAJOR_HUBS = [
  'NAT014445', // 부산
  'NAT010832', // 대전
  'NAT011668', // 대구
  'NAT013395', // 강릉
] as const

/** @deprecated TAGO_MAJOR_HUBS 사용 */
export const TAGO_ARRIVAL_HUBS = TAGO_MAJOR_HUBS
