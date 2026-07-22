/** TAGO API 원본 1행 — 필드명 소문자·camel 혼용 대비 */
export interface TagoTrainRaw {
  trainno?: string // 열차번호
  traingradename?: string // 차종명 (KTX 등)
  depplandtime?: string // 출발 예정 YYYYMMDDHHMISS
  arrplandtime?: string // 도착 예정 YYYYMMDDHHMISS
  depplacename?: string // 출발역명
  arrplacename?: string // 도착역명
  adultcharge?: string // 성인 운임 (문자열)
}

/** TagoTrainClient 정규화 후 — scheduleStore·TrainSchedulePanel·TrainManager */
export interface TagoTrainRow {
  trainNo: string // 열차번호
  gradeName: string // 차종명
  depPlaceName: string // 출발역
  arrPlaceName: string // 도착역
  depPlanTime: string // 출발 예정 (ISO 또는 YYYYMMDDHHMISS)
  arrPlanTime: string // 도착 예정
  depAtMs: number // 출발 epoch ms — 3D 연출 스케줄러
  arrAtMs: number // 도착 epoch ms
  adultCharge?: number // 운임 (숫자 변환 후)
  platformZoneId?: string // tracks.json 매칭용 (TAGO에 없으면 규칙 추론)
}

/** getStrtpntAlocFndTrainInfo 요청 파라미터 */
export interface TagoQuery {
  depPlaceId: string // 출발역 nodeId (config tagoNodeId 등)
  arrPlaceId?: string // 도착역 nodeId (선택)
  depPlandTime: string // 조회일 YYYYMMDD
  trainGradeId?: string // 차종 필터 (KTX 등)
  numOfRows?: number // 페이징
  pageNo?: number
}
