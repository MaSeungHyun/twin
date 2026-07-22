# 국토교통부 (TAGO) 열차정보 OpenAPI 정리

> 출처: [공공데이터포털 - 국토교통부_(TAGO)_열차정보](https://www.data.go.kr/data/15098552/openapi.do)  
> Base URL: `https://apis.data.go.kr/1613000/TrainInfo`  
> 포맷: JSON / XML · 비용: 무료 · 개발계정 트래픽: 10,000회/일

이 문서는 **서울역(KTX 등) 3D 디지털 트윈 관제 PoC**에 TAGO를 어떻게 쓸지 정리한 참고용이다.

---

## 1. 이 API가 주는 것 / 안 주는 것

| 구분 | 내용 |
|------|------|
| **주는 것** | 출발역·도착역 기준 **운행 시간표**(KTX 포함), 도시/역/차량종류 코드 목록 |
| **성격** | 승객용 **스케줄 조회** (언제 어디서 어디로 가는지) |
| **안 주는 것** | 선로 위 실시간 GPS, 3D 좌표, 승강장 번호, CCTV, 재실, 관제 알람, 신호등 상태 |

즉 우리 프로젝트에서는 **3D 월드의 “열차 메시 위치” 소스가 아니라**, 우측/하단 패널의 **“오늘 열차 운행 목록”** 소스로 적합하다.  
선로 위 이동·이벤트·CCTV는 기존처럼 **Mock(또는 추후 실연동)** 이 맞다.

---

## 2. API 목록 (엔드포인트)

Base: `/1613000/TrainInfo`

| 메서드 | 경로 | 역할 | 프로젝트에서의 쓰임 |
|--------|------|------|---------------------|
| `GET` | `/getStrtpntAlocFndTrainInfo` | 출·도착지 기반 열차 시간표 조회 | **핵심** — 서울↔부산 등 스케줄 패널 |
| `GET` | `/getCtyCodeList` | 도시코드 목록 | 도시 선택 UI / `cityCode` 확보 |
| `GET` | `/getCtyAcctoTrainSttnList` | 시·도별 기차역 목록 | 서울역·대전역 등 `nodeId` 확보 |
| `GET` | `/getVhcleKndList` | 차량종류 목록 (KTX 등) | 필터: KTX만 보기 |

> Swagger/명세에 따라 경로 대소문자(`Get` vs `get`)가 다를 수 있다. 실제 호출은 포털 **활용가이드·샘플 URL**을 기준으로 맞춘다.

### 2.1 호출 흐름 (필수 순서)

```text
1. getCtyCodeList
     → citycode (예: 서울)

2. getCtyAcctoTrainSttnList(cityCode)
     → nodeid / nodename (예: 서울역, 부산역)

3. getVhcleKndList (선택)
     → vehiclekndid (KTX만 필터할 때)

4. getStrtpntAlocFndTrainInfo
     → depPlaceId, arrPlaceId, depPlandTime, (trainGradeId)
     → 열차번호, 출발/도착 시각, 운임 등
```

역 ID 없이 역 이름만으로 바로 조회하는 구조가 아니므로, **코드 목록 → 시간표** 순서가 필요하다.

---

## 3. 엔드포인트별 응답 데이터

### 3.1 `getStrtpntAlocFndTrainInfo` — 출/도착지 기반 열차정보

시간표의 본편. 패널에 올릴 데이터가 여기 있다.

| 필드 | 의미 | UI/엔진 매핑 예 |
|------|------|-----------------|
| `trainno` | 열차번호 | 목록 키, Mock 열차 ID와 느슨히 매칭 가능 |
| `traingradename` | 차량종류명 (KTX 등) | 뱃지, 필터 |
| `depplandtime` | 출발시간 `YYYYMMDDHHMISS` | “출발 예정” 표시, 타임라인 |
| `arrplandtime` | 도착시간 `YYYYMMDDHHMISS` | “도착 예정” 표시 |
| `depplacename` | 출발지명 | 패널 텍스트 |
| `arrplacename` | 도착지명 | 패널 텍스트 |
| `adultcharge` | 성인 운임(원) | 부가 정보(관제에선 보통 생략 가능) |

요청 시 흔한 파라미터(가이드 기준, 키 이름은 명세 확인):

- `serviceKey` — 인증키  
- `depPlaceId` / `arrPlaceId` — 출발·도착 역 ID (`nodeid`)  
- `depPlandTime` — 출발일 `YYYYMMDD`  
- `trainGradeId` — 차량종류(선택)  
- `numOfRows`, `pageNo` — 페이징  
- `_type=json` — JSON 응답  

### 3.2 `getCtyCodeList` — 도시코드

| 필드 | 의미 |
|------|------|
| `cityname` | 도시명 |
| `citycode` | 도시코드 |

서울·대전·부산 등 **역사 확장** 시 도시 선택에 사용.

### 3.3 `getCtyAcctoTrainSttnList` — 시/도별 기차역

| 필드 | 의미 |
|------|------|
| `nodename` | 기차역명 (예: 서울) |
| `nodeid` | 기차역 ID → 시간표 API의 PlaceId로 사용 |

`StationConfig.stationId`(예: `SEOUL`)와 `nodeid`를 매핑 테이블로 묶어 둔다.

### 3.4 `getVhcleKndList` — 차량종류

| 필드 | 의미 |
|------|------|
| `vehiclekndnm` | 차량종류명 |
| `vehiclekndid` | 차량종류코드 |

관제 데모에서는 **KTX만** 필터할 때 유용.

---

## 4. 우리 프로젝트에 어떻게 적용할지

### 4.1 역할 분담

```text
TAGO (실데이터)
  └─ 열차 스케줄 패널
       · 오늘 서울역 발 / 착 (특정 구간)
       · 열차번호, 등급, 출발·도착 시각

Mock Adapter (본체)
  └─ 3D 열차 이동, 신호, CCTV, 재실, 알람, 히트맵
```

발주처 스토리(내부 CCTV·화장실·플랫폼 안전)는 TAGO로 대체되지 않는다.  
다만 패널에 **진짜 KTX 시각표**가 돌아가면 “전부 가짜” 느낌이 줄어든다.

### 4.2 Adapter에 넣는 위치

`참고사항.md`의 어댑터 패턴을 유지한다.

```ts
interface IRailwayStationAdapter {
  // 기존 (Mock / 추후 실서버)
  getStationConfig(): Promise<StationConfig>;
  getDevices(): Promise<DeviceMetadata[]>;
  subscribeToiletStatus(cb: (e: ToiletEvent) => void): void;
  subscribeAlarms(cb: (e: AlarmEvent) => void): void;
  // ...

  // TAGO 연동 (선택)
  getTrainTimetable(query: TrainTimetableQuery): Promise<TrainTimetableItem[]>;
}

interface TrainTimetableQuery {
  depStationId: string;   // 내부 ID (SEOUL) 또는 TAGO nodeId
  arrStationId: string;
  date: string;           // YYYYMMDD
  grade?: 'KTX' | 'ALL';
}

interface TrainTimetableItem {
  trainNo: string;
  gradeName: string;
  depPlaceName: string;
  arrPlaceName: string;
  depPlanTime: string;    // ISO 또는 Date로 정규화
  arrPlanTime: string;
  adultCharge?: number;
}
```

구현체 예시:

- `MockRailwayAdapter` — 고정 JSON 시간표 (오프라인·데모 리허설)  
- `TagoTrainTimetableClient` — TAGO HTTP 호출 후 `TrainTimetableItem`으로 매핑  
- 프로젝트 `AxiosSocketRailwayAdapter` — 내부 API로 교체, UI는 인터페이스만 유지  

프론트/3D는 **TAGO raw JSON을 직접 보지 않는다.**

### 4.3 UI 적용 자리

| 화면 | 활용 |
|------|------|
| 우측/하단 **열차 운행 패널** | 오늘 구간 시간표 테이블 |
| 검색/필터 | `traingradename === 'KTX'` 등 |
| 알람/이벤트와 연계(선택) | Mock으로 “열차 001 지연” 알람을 띄울 때, 목록의 `trainno`와 동일 번호 사용 → 실데이터와 연출이 맞물림 |
| 3D Viewport | **직접 바인딩하지 않음**. 필요하면 Mock이 “다음 도착 열차”를 고를 때 시간표를 **참고만** |

### 4.4 3D와 연결하는 안전한 방식 (선택)

위험한 방식: `depplandtime`만으로 선로 위를 진짜처럼 움직인다고 착각하기.

안전한 방식:

1. TAGO로 “15:20 서울 출발 KTX 001” 목록 표시  
2. Mock `TrainManager`는 **가상의 선로 progress(0~1)** 로 메시 이동  
3. 데모 스크립트에서 “목록에서 고른 열차번호”와 Mock 열차 ID를 **같게** 맞춤  

→ 시간표는 실데이터, 움직임은 연출. 시연 템포와 안정성을 같이 가져간다.

### 4.5 인프라 주의사항

- **온프레미스·오프라인 데모**면 TAGO가 죽거나 막힐 수 있다 → Mock fallback 필수  
- 인증키는 **프론트에 하드코딩 금지** (env + 가능하면 백엔드 프록시)  
- CORS: 브라우저 직접 호출이 막히면 Spring 또는 NestJS 등에서 프록시  
- `depPlandTime`은 날짜 단위가 일반적 → “실시간 GPS”가 아님 (업데이트 주기 ‘실시간’은 서버 측 갱신 표현에 가깝고, 응답 내용은 시간표)  
- 트래픽: 개발 1만 회/일 → 폴링 남발 금지, 패널 열 때·N분 캐시  

### 4.6 역사 확장 (대전·용산)

```text
StationConfig.stationId = "SEOUL" | "DAEJEON" | "YONGSAN"
         ↓
tagoNodeId 매핑 테이블
         ↓
getStrtpntAlocFndTrainInfo(dep, arr, date)
```

역마다 코드만 바꾸면 스케줄 패널이 따라온다. 3D GLB·디바이스 메타와 동일한 **데이터 드리븐** 연장선이다.

---

## 5. 권장 적용 단계

1. 공공데이터포털에서 TAGO 열차정보 **활용신청** → 서비스키 발급  
2. `getCtyCodeList` → `getCtyAcctoTrainSttnList`로 **서울·부산 `nodeid` 확인**  
3. `getStrtpntAlocFndTrainInfo`로 **오늘자 KTX 몇 건** 샘플 확보  
4. `TrainTimetableItem`으로 매핑하는 클라이언트 작성 (+ Mock fallback)  
5. 관제 UI에 **운행 목록 패널**만 연결  
6. (선택) Mock 열차 ID와 `trainno` 동기화해 데모 스토리 맞추기  

본체(Three.js 뷰포트·재실·CCTV·알람 포커싱) 구현과 **병렬**로 두되, 의존하지 말 것.

---

## 6. 한 줄 요약

- **API 4개**: 도시코드 / 역목록 / 차량종류 / **출도착 시간표**  
- **얻는 데이터**: 열차번호·등급·출발·도착 시각·역명·운임  
- **프로젝트 적용**: 스케줄 패널용 실데이터 + Adapter 격리 + Mock fallback  
- **쓰지 말 것**: 이 API로 3D 열차 실시간 위치·내부 관제를 대체하려는 시도  
