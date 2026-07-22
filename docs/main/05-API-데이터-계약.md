# 05. API / 데이터 계약

> **문서 유형:** 프론트엔드 4단계 산출물  
> **구현:** `src/types/*`, `src/adapters/*`, `src/data/stations/seoul/*`  
> **원칙:** Mock ↔ 온프레미스 서버 **동일 계약** — UI·3D는 출처를 모른다

---

## 0. 계약이 깨지면 안 되는 이유

| 깨질 때 | 결과 |
|---------|------|
| 필드 이름·타입 불일치 | Socket 전환 시 **패널·fly-to 전부 수정** |
| 혼잡도 100% 초과 | 타사처럼 **신뢰 상실** (NF-09) |
| 알람에 `zoneId`·`deviceId` 없음 | S2 **fly-to + CCTV 1채널** 불가 |
| Config·devices 분리 안 함 | 역 확장·50~80 CCTV **코드 분기** |

**본 문서 = 프론트·백엔드·NVR 연동팀 공통 스펙 초안.**

---

## 1. 계약 버전

| 항목 | 값 |
|------|-----|
| `API_CONTRACT_VERSION` | **1** |
| `IRailwayStationAdapter.contractVersion` | **1** |
| WebSocket `ServerMessage.v` | **1** |

버전 올릴 때: 필드 **추가는 호환**, **삭제·의미 변경은 v2**.

---

## 2. IRailwayStationAdapter 메서드

```typescript
interface IRailwayStationAdapter {
  readonly contractVersion: number

  connect(stationId: string): Promise<void>
  disconnect(): void

  // 정적
  getStationConfig(stationId: string): Promise<StationConfig>
  getDevices(stationId: string): Promise<DeviceMetadata[]>
  getTracks(stationId: string): Promise<TracksFile | null>

  // 스냅샷 (패널 초기·재연결)
  getActiveAlarms(stationId: string): Promise<AlarmEvent[]>
  getSensorSnapshot(stationId: string, zoneId?: string): Promise<SensorSnapshot[]>
  getToiletSnapshot(stationId: string): Promise<ToiletStallState[]>

  // 실시간 push
  subscribeAlarms(cb: (event: AlarmEvent) => void): Unsubscribe
  subscribeSensors(cb: (event: SensorEvent) => void): Unsubscribe
  subscribeToilet(cb: (event: ToiletEvent) => void): Unsubscribe
  subscribeCctvStatus(cb: (event: CctvStatusEvent) => void): Unsubscribe

  // P1 통계
  getTrafficHistory(query: TrafficQuery): Promise<TrafficSeries[]>
}
```

### 2.1 Mock vs Socket 매핑

| 메서드 | MockRailwayAdapter | SocketRailwayAdapter (프로젝트) |
|--------|-------------------|-------------------------------|
| `connect` | interval·scenario 시작 | `socket.connect` + `join:stationId` |
| `getStationConfig` | `registry.ts` JSON | `GET /api/stations/:id/config` |
| `getDevices` | `devices.json` | `GET /api/stations/:id/devices` |
| `subscribeAlarms` | `pushAlarm` | `socket.on('alarm')` → 동일 `AlarmEvent` |
| `getTrafficHistory` | `traffic-history.json` | `GET /api/traffic?...` |

**프론트 교체:** `src/adapters/index.ts` **한 줄**.

---

## 3. WebSocket envelope (프로젝트)

모든 push는 동일 envelope. Mock도 내부적으로 이 shape를 맞춘다.

```json
{
  "v": 1,
  "type": "alarm",
  "stationId": "SEOUL",
  "seq": 1847291,
  "sentAt": "2026-07-14T16:42:00.000+09:00",
  "payload": { }
}
```

| 필드 | 용도 |
|------|------|
| `seq` | (프로젝트 권장) 채널별 단조 증가 — 유실·중복 재정렬 |
| `sentAt` | 클라이언트 `occurredAt`보다 늦어도 envelope 기준 정렬 가능 |

| `type` | `payload` 타입 |
|--------|----------------|
| `alarm` | `AlarmEvent` |
| `sensor` | `SensorEvent` |
| `toilet` | `ToiletEvent` |
| `cctv-status` | `CctvStatusEvent` |
| `snapshot` | `{ sensors?, toilets?, alarms? }` |

---

## 4. 도메인 타입 — 화면 매핑

### 4.1 AlarmEvent (핵심)

| 필드 | 타입 | 필수 | UI / 3D |
|------|------|------|---------|
| `id` | string | 필수 | 리스트 key, 선택 |
| `stationId` | string | 필수 | 다역사 |
| `type` | AlarmType | 필수 | 아이콘·색 |
| `severity` | Severity | 필수 | 뱃지·정렬 |
| `zoneId` | string | 필수 | fly-to, 헤더 칩 |
| `zoneName` | string | 필수 | 카드 제목 보조 |
| `deviceId` | string? | | CCTV 1채널, 3D pulse |
| `deviceName` | string? | | 카드·CCTV 헤더 |
| `title` | string | 필수 | 카드 한 줄 |
| `message` | string | 필수 | 상세 |
| `congestionPercent` | 0~100? | | 카드 보조 (**100 초과 금지**) |
| `congestionLevel` | CongestionLevel? | | 색·라벨 (여유/보통/주의/심각) |
| `occurredAt` | ISO string | 필수 | 경과 시각 |
| `acknowledgedAt` | ISO \| null? | | 확인 대기 |
| `source` | DataSource | 필수 | Mock/Live 배지 |

**AlarmType**

| 값 | PoC 시나리오 |
|----|-------------|
| `SAFETY_LINE_BREACH` | **S2** |
| `TOILET_EMERGENCY` | S3 |
| `CONGESTION_THRESHOLD` | S4 / 배경 알람 |
| `FALL_DETECTED` | P2 (타사 참조) |

### 4.2 SensorEvent / SensorSnapshot

| 필드 | 규칙 |
|------|------|
| `congestionPercent` | **0~100** — `clampCongestionPercent()` |
| `congestionLevel` | percent에서 파생 또는 서버 제공 |
| `occupantCount` / `capacity` | CCTV 오버레이 `3 / 120` 형태 |

**CongestionLevel ↔ UI 라벨**

| level | 라벨 | percent 구간 |
|-------|------|--------------|
| `RELAXED` | 여유 | 0~40 |
| `NORMAL` | 보통 | 41~60 |
| `CAUTION` | 주의 | 61~80 |
| `SEVERE` | 심각 | 81~100 |

### 4.3 ToiletStallState / ToiletEvent

| status | UI |
|--------|-----|
| `VACANT` | 공실 |
| `OCCUPIED` | 사용 중 |
| `EMERGENCY` | 위급 표시 — **§8.2 규칙: AlarmEvent가 먼저** |
| `OFFLINE` | 점검 |

**PoC 규칙:** `EMERGENCY` **발생의 진입점은 `AlarmEvent`(type=`TOILET_EMERGENCY`)** 이다.  
`subscribeToilet`의 `EMERGENCY` push는 **알람 이후 동기화용**이며, 알람 없이 단독으로 UI를 바꾸지 않는다.

### 4.4 CctvStatusEvent

| status | UI |
|--------|-----|
| `ONLINE` | 영상 표시 |
| `CONNECTING` | 「연결 중」(데모: sld-005) |
| `OFFLINE` | placeholder |
| `ERROR` | 에러 메시지 |

### 4.5 DeviceMetadata

| 필드 | 용도 |
|------|------|
| `deviceId` | 전역 key — **서버·Mock 동일 ID** |
| `deviceType` | 3D 마커·필터 |
| `zoneId` | 구역 드릴다운 |
| `position` | InstancedMesh (**설정 XYZ UI 대체**) |
| `category` | `congestion` \| `safety-line` \| `restroom` |
| `streamUrl` | CCTV 메인 1채널 `<video src>` |
| `thumbnailUrl` | 인근 썸네일 **JPEG** (`<img>`) — video autoplay **금지** (04 §7.2) |
| `capacity` | 혼잡 오버레이 분모 |
| `enabled` | false면 UI·3D **미표시** |

**런타임 상태**는 `DeviceMetadata`에 넣지 않는다 → §8.3 `deviceStore`가 `subscribeCctvStatus`로 병합.

### 4.6 StationConfig

| 필드 | 용도 |
|------|------|
| `tagoNodeId` | TAGO 역 ID (서울 `NAT010000`) |
| `zones[]` | 헤더 칩, bounds, `cameraPresetId` |
| `cameraPresets` | ZoneManager fly-to |
| `modelUrl` | GLB (프로젝트) |

### 4.7 TracksFile / TagoTrainRow

- `tracks.json` — 3D 열차 스플라인 (TAGO에 없음)
- `TagoTrainRow` — 전광판 + `TrainManager` 시각 (`depAtMs`, `arrAtMs`)
- **TAGO는 Adapter 밖** — `TagoTrainClient` only

---

## 5. 서울역 Mock 데이터 (구현됨)

### 5.1 파일

| 파일 | 내용 |
|------|------|
| `config.json` | 4 zones, 4 camera presets, 3 floors |
| `devices.json` | **25 devices** — 혼잡 11 + 안전선 10 + 화장실 4 |
| `tracks.json` | 5·6번 승강장 진입 2선 |
| `scenarios.json` | S2 45s, S3 120s, 혼잡 90s |
| `traffic-history.json` | 17h 혼잡 + 안전선 침범 시계열 |
| `registry.ts` | `SEOUL` 번들 로드 |

### 5.2 디바이스 ID 규칙

| prefix | 의미 | 개수 |
|--------|------|------|
| `cm-` | 혼잡도 카메라 (환승) | 001~011 |
| `sld-` | 안전선 감지 (5·6 플랫폼) | 001~010 |
| `rs-` | 화장실 칸 | 01~04 |

서버 연동 시 **ID 변경 금지** — NVR·센서 허브와 1:1.

### 5.3 시나리오 (데모 리허설)

| id | delay | 용도 |
|----|-------|------|
| `demo-safety-line-s2` | 45s | 안전선 침범 → sld-006 |
| `demo-toilet-s3` | 120s | 화장실 위급 → rs-02 |
| `demo-congestion-transfer` | 90s | 환승 혼잡 78% |

---

## 6. 정규화 규칙 (필수)

구현: `src/adapters/normalize.ts`

```typescript
clampCongestionPercent(value)   // 0~100 정수
congestionLevelFromPercent(p)   // 4단계 — UI는 CongestionLevel 그대로 표시
```

| 입력 (서버 실수) | 출력 |
|------------------|------|
| 391 | 100 |
| -5 | 0 |
| NaN | 0 |

**Mock·Socket 모두** push 전에 clamp 권장 (서버 측도 동일 규칙).

---

## 7. React 연동 패턴

### 7.1 구독 (hooks) — 스냅샷·Push 레이스 방지 (§8.1)

```typescript
// hooks/useAlarms.ts — subscribe 먼저, snapshot 나중, id 기준 upsert
useEffect(() => {
  const pending: AlarmEvent[] = []
  let snapshotReady = false

  void railwayAdapter.connect('SEOUL')

  const off = railwayAdapter.subscribeAlarms((e) => {
    if (snapshotReady) alarmStore.upsert(e)
    else pending.push(e)
  })

  void railwayAdapter.getActiveAlarms('SEOUL').then((snap) => {
    alarmStore.setAll(mergeById(snap, pending)) // upsert 병합
    snapshotReady = true
    pending.splice(0).forEach((e) => alarmStore.upsert(e))
  })

  return () => {
    off()
    railwayAdapter.disconnect()
  }
}, [])
```

`append` 단독 사용 **금지** — 반드시 `upsert(id)` (§8.1).

### 7.2 알람 선택 → UI + Engine

```typescript
selectAlarm(alarm: AlarmEvent) {
  uiStore.selectAlarm(alarm)  // deviceId, zoneId, cctv mode
  focusAlarm(alarm)           // engineBridge
}
```

### 7.3 패널 데이터 소스

| 패널 | 소스 |
|------|------|
| AlarmPanel | `getActiveAlarms` + `subscribeAlarms` |
| CctvPanel | `devices.find(deviceId)` → `streamUrl` + `thumbnailUrl` |
| TrainSchedulePanel | `TagoTrainClient` (**Adapter 아님**) |
| (P1) Stats | `getTrafficHistory` |
| RestroomPanel | `getToiletSnapshot` + **활성 `TOILET_EMERGENCY` 알람 override** (§8.2) |

### 7.4 Engine · Video 생명주기 (04 §4.3, §7.2.1)

**engineBridge** — React 컴포넌트가 `StationEngine`을 직접 보관하지 않는다.

```typescript
focusAlarm(alarm)  // engineBridge — 클로저에 engine 캡처 금지
```

**CctvPanel** — `useVideoStream(videoRef, streamUrl, enabled)` 필수.

| `enabled` 조건 | cleanup |
|----------------|---------|
| `rightPanelMode === 'cctv' && streamUrl` | unmount·모드 이탈·src 변경 시 `video.src=''` |

썸네일은 `thumbnailUrl`만 사용 — `streamUrl`을 썸네일 `<video>`에 넣지 않는다.

썸네일은 `thumbnailUrl`만 사용 — `streamUrl`을 썸네일 `<video>`에 넣지 않는다.

---

## 8. 운영·동기화 규칙 (프로젝트 필수, PoC M3 반영)

외부 리뷰 3건 + 프로젝트 판단. 백엔드·프론트 **공통 준수**.

### 8.1 알람 스냅샷 ↔ Push 레이스

**리스크 (동의):** `getActiveAlarms` 응답 대기 중 push가 오면 **유실** 또는 snapshot 후 **중복** 가능.

| 계층 | 규칙 |
|------|------|
| **클라이언트 (필수)** | `alarmStore.upsert` — `id` 동일 시 **최신 `occurredAt`·`acknowledgedAt`로 덮어쓰기** |
| **구독 순서** | `subscribeAlarms` **먼저** → 버퍼 → `getActiveAlarms` → `mergeById` → `setAll` |
| **서버 (권장)** | WS envelope `seq` 단조 증가; 재연결 시 `snapshot` 타입으로 일괄 동기화 |

```typescript
function mergeById(snapshot: AlarmEvent[], pending: AlarmEvent[]): AlarmEvent[] {
  const map = new Map<string, AlarmEvent>()
  for (const e of [...snapshot, ...pending]) {
    const prev = map.get(e.id)
    if (!prev || e.occurredAt >= prev.occurredAt) map.set(e.id, e)
  }
  return [...map.values()].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}
```

`setAll`도 내부적으로 **replace가 아닌 upsert 병합** 권장 (재연결 시).

### 8.2 화장실 위급 — AlarmEvent 단일 진입점

**리스크 (동의):** `ToiletEvent(EMERGENCY)`와 `AlarmEvent(TOILET_EMERGENCY)` 이원화 시 S3 **좌·우 패널 불일치**.

**판단:** 위급의 **SoT(Source of Truth)는 AlarmEvent** 하나. 화장실 패널은 알람에서 파생한다.

```text
센서 허브 / Mock
    │
    ▼
AlarmEvent (TOILET_EMERGENCY, deviceId=rs-02)  ← 1차 push (S3 트리거)
    │
    ├─► AlarmPanel · fly-to · uiStore
    │
    └─► (선택, 2차) ToiletEvent status=EMERGENCY  ← 재실 패널 동기화용
```

| UI | 데이터 |
|----|--------|
| 좌 알람 카드 | `alarmStore` `TOILET_EMERGENCY` |
| 우 RestroomPanel | `getToiletSnapshot()` + **활성 알람 `deviceId` → 해당 칸 EMERGENCY override** |
| 3D | `focusAlarm` → `restroom` zone |

**Mock 구현 (이미 준수):** `scenarios.json` S3 → `pushAlarm` **먼저** → `emitToilet(EMERGENCY)` (`MockRailwayAdapter`).

**백엔드 가이드:** 위급 발생 시 **알람 API/WS만 필수**. `toilet` 채널은 재실 표시 동기화용 선택.

### 8.3 CCTV 정적 메타 + 동적 상태 (`deviceStore`)

**리스크 (동의):** `DeviceMetadata`만 쓰면 OFFLINE CCTV가 3D에서 **활성 핀**으로 남는다.

**판단:** 정적 JSON과 실시간 상태를 **병합하는 `deviceStore`** 필수 (04 §5.5).

```typescript
type DeviceRuntime = DeviceMetadata & {
  cctvStatus: 'ONLINE' | 'CONNECTING' | 'OFFLINE' | 'ERROR'  // 기본 ONLINE (Mock)
}

interface DeviceState {
  byId: Record<string, DeviceRuntime>
  hydrate: (devices: DeviceMetadata[]) => void
  patchCctvStatus: (e: CctvStatusEvent) => void
  get: (deviceId: string) => DeviceRuntime | undefined
}
```

| 소비처 | 사용 |
|--------|------|
| `DeviceManager` (3D) | `cctvStatus !== 'ONLINE'` → 회색/비활성, pulse **금지** |
| `CctvPanel` | OFFLINE → placeholder, streamUrl **미로드** |
| `CctvPanel` 썸네일 | CONNECTING/ERROR 시 배지 |

```typescript
// useDevices.ts
adapter.getDevices('SEOUL').then(deviceStore.hydrate)
adapter.subscribeCctvStatus((e) => deviceStore.patchCctvStatus(e))
```

---

## 9. 프로젝트 REST (스텁)

프론트가 기대하는 API — 백엔드 협의용.

| Method | Path | 응답 |
|--------|------|------|
| GET | `/api/stations/:id/config` | `StationConfig` |
| GET | `/api/stations/:id/devices` | `DeviceMetadata[]` |
| GET | `/api/stations/:id/tracks` | `TracksFile` |
| GET | `/api/stations/:id/alarms?active=true` | `AlarmEvent[]` |
| POST | `/api/alarms/:id/ack` | `{ ok: true }` |
| GET | `/api/traffic` | `TrafficSeries[]` |

WebSocket: `ws://.../stations` — §3 envelope.

---

## 10. 역 확장

```text
data/stations/daejeon/
  config.json    ← tagoNodeId 다름
  devices.json   ← 역별 카메라 수 다름
  tracks.json
  scenarios.json
```

`registry.ts`에 `DAEJEON` 한 줄 추가. **Adapter·UI 코드 변경 없음.**

---

## 11. 검증 체크리스트

- [x] `IRailwayStationAdapter` TypeScript 인터페이스
- [x] 서울 `devices.json` 21+ CCTV·화장실
- [x] `AlarmEvent`에 zone·device·severity·title
- [x] 혼잡도 clamp (NF-09)
- [x] `MockRailwayAdapter` subscribe·snapshot·scenarios
- [ ] `DeviceMetadata.thumbnailUrl` — CCTV 썸네일 (M1)
- [ ] `useVideoStream` + engineBridge lifecycle (M1, `04` §13)
- [ ] `alarmStore.upsert` + subscribe→snapshot 순서 (M3, §8.1)
- [ ] S3 `TOILET_EMERGENCY` → RestroomPanel override (§8.2)
- [ ] `deviceStore` + `subscribeCctvStatus` (M2~M3, §8.3)
- [ ] `useAlarms` hook + `alarmStore` (M3)
- [ ] SocketRailwayAdapter 스텁 (P2)

```bash
npm run build
```

---

## 12. 문서 관계

```text
04-기술-아키텍처  레이어·경계
05-API-데이터     필드·JSON·WS 계약  ← 본 문서
../TAGO-열차정보-API.md  TagoTrainClient 전용
```

---

## 13. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-07-14 | v1 계약, 서울 mock 풀세트, MockRailwayAdapter 구현 |
| 2026-07-14 | `thumbnailUrl`, §7.4 engineBridge·useVideoStream (`04` §13 반영) |
| 2026-07-14 | §8 운영·동기화 — alarm upsert, 화장실 SoT, deviceStore (`04` §5.2·§5.5) |
