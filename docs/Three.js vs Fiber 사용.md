# Three.js 기반 철도 역사 3D 관제 시스템 설계 정리

## 1. 프로젝트 전제

웹에서 3D 철도 역사를 보여주고, 동시에 관제 기능까지 제공하는 시스템을 만든다고 가정한다.

주요 요구사항은 다음과 같다.

- 철도 역사, 승강장, 선로, 설비를 3D로 시각화
- 열차 위치, 신호등, 센서, CCTV, 알람 상태 표시
- 장시간 실행되는 관제 화면
- 실시간 데이터 수신 및 반영
- 대형 모니터 또는 관제용 PC에서 안정적으로 동작
- UI 패널, 검색, 필터, 알람 리스트 등 웹 UI와 3D 화면 결합

이런 시스템에서는 단순히 화면이 예쁘게 보이는 것보다 **성능 예측성, 장시간 안정성, 객체 수 관리, 실시간 업데이트 구조**가 더 중요하다.

---

## 2. Three.js 직접 사용 vs React Three Fiber

### 2.1 결론

철도 역사 3D 관제 시스템에서는 기본적으로 다음 구조가 가장 안전하다.

```text
React: 관제 UI
Three.js: 3D 렌더링 엔진
WebSocket: 실시간 데이터 수신
Worker / 상태 버퍼: 데이터 처리
```

즉, **웹 UI는 React로 만들고, 3D 월드는 순수 Three.js로 직접 제어**하는 구조를 추천한다.

---

### 2.2 Three.js 직접 사용의 장점

순수 Three.js를 직접 사용하면 다음 장점이 있다.

- 렌더 루프를 직접 제어할 수 있다.
- 객체 생성, 삭제, 재사용 전략을 직접 관리할 수 있다.
- `InstancedMesh`, `BufferGeometry`, LOD, culling 등을 세밀하게 제어하기 쉽다.
- React reconciliation의 영향을 받지 않는다.
- 초당 수십 번 바뀌는 열차 위치, 센서 상태, 신호 상태를 처리하기 좋다.
- 장시간 실행되는 관제 화면에서 성능 예측이 쉽다.

특히 다음과 같은 경우에는 직접 Three.js를 쓰는 편이 유리하다.

```text
수천~수만 개 객체
실시간 위치 갱신
센서/알람 상태 갱신
대형 GLB 모델
구역별 culling
고정 FPS 제어
장시간 관제 화면
```

---

### 2.3 React Three Fiber의 장점과 주의점

React Three Fiber는 Three.js를 React 방식으로 사용할 수 있게 해주는 라이브러리다.

장점은 다음과 같다.

- 3D 객체를 React component처럼 구성할 수 있다.
- UI와 3D 구조를 함께 관리하기 쉽다.
- 선언형 코드로 빠르게 프로토타입을 만들기 좋다.
- React 생태계와 잘 맞는다.

하지만 관제 시스템에서는 주의해야 한다.

가장 위험한 구조는 다음과 같다.

```jsx
setTrainPositions(...)
setSensorStates(...)
setSignalStates(...)
```

이런 식으로 초당 여러 번 React state를 갱신하면 성능 병목이 생길 수 있다.

React Three Fiber를 사용하더라도 빠르게 변하는 값은 React state가 아니라 `ref`를 통해 직접 Three.js 객체를 수정하는 방식이 좋다.

```js
trainMesh.position.copy(newPosition);
signalMesh.material.color.set(statusColor);
```

---

### 2.4 추천 구조

가장 추천하는 구조는 다음과 같다.

```text
React
 ├─ 메뉴
 ├─ 알람 리스트
 ├─ 검색 패널
 ├─ 속성 패널
 └─ ThreeViewport
      └─ 내부는 순수 Three.js
          ├─ Scene
          ├─ Camera
          ├─ Renderer
          ├─ Object Pool
          ├─ InstancedMesh
          ├─ Zone Manager
          ├─ Train Manager
          ├─ Sensor Manager
          └─ requestAnimationFrame loop
```

React는 다음 용도에만 사용한다.

```text
선택된 열차 ID
알람 목록
검색 결과
필터 설정
속성 패널
사용자 메뉴
레이어 on/off 설정
```

Three.js 내부에서 직접 처리할 것들은 다음과 같다.

```text
열차 위치 보간
센서 상태 색상 변경
신호등 상태 변경
알람 마커 표시
카메라 이동
LOD 전환
구역 visibility 처리
```

---

## 3. Three.js 성능 최적화 핵심

Three.js 최적화의 핵심은 다음 순서다.

```text
1. Draw Call 줄이기
2. 객체 수 줄이기
3. Material 수 줄이기
4. Texture 수와 크기 줄이기
5. 정적 객체와 동적 객체 분리
6. InstancedMesh 사용
7. 구역별 culling 적용
8. LOD 적용
9. 그림자와 후처리 최소화
10. 실시간 데이터와 렌더링 분리
```

---

## 4. Draw Call 줄이기

Three.js 성능에서 가장 중요한 요소 중 하나는 draw call 수다.

나쁜 구조는 다음과 같다.

```js
for (let i = 0; i < 10000; i++) {
  scene.add(new THREE.Mesh(geometry, material));
}
```

같은 geometry와 material을 반복해서 사용하는 객체라면 `InstancedMesh`를 사용한다.

```js
const mesh = new THREE.InstancedMesh(geometry, material, 10000);
scene.add(mesh);
```

철도 역사 관제에서 `InstancedMesh` 후보는 다음과 같다.

```text
선로 침목
전봇대
조명
CCTV
신호등
센서 아이콘
좌석
난간
표지판
승강장 반복 구조물
작은 장비 박스
```

---

## 5. 정적 객체 병합

움직이지 않는 객체는 같은 재질끼리 geometry를 병합하는 것이 좋다.

예를 들어 다음 객체들은 병합 대상이다.

```text
역사 건물 벽
바닥
기둥
천장
계단
난간
플랫폼
고정된 선로 구조물
```

단, 역 전체를 하나의 거대한 mesh로 병합하면 culling 효과가 약해진다. 따라서 구역 단위로 병합하는 것이 좋다.

```text
B1_승강장_A
B1_승강장_B
1F_대합실
2F_상가
선로_동쪽
선로_서쪽
```

---

## 6. Material 최적화

객체마다 새로운 material을 만들면 성능과 메모리 모두에 좋지 않다.

나쁜 구조:

```js
const mat1 = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mat2 = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mat3 = new THREE.MeshStandardMaterial({ color: 0xff0000 });
```

좋은 구조:

```js
const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

mesh1.material = redMaterial;
mesh2.material = redMaterial;
mesh3.material = redMaterial;
```

상태별 material도 미리 만들어 재사용한다.

```js
const materials = {
  normal: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  warning: new THREE.MeshBasicMaterial({ color: 0xffff00 }),
  error: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
};
```

---

## 7. Texture 최적화

텍스처는 다음 원칙을 따른다.

```text
작은 장비: 256~512
일반 구조물: 1024
중요한 근접 모델: 2048
4K 텍스처: 제한적으로만 사용
```

아이콘, 표지판, 센서 마커는 texture atlas로 묶는 것이 좋다.

```text
표지판 텍스처 100장
→ 큰 atlas 1장
```

대형 웹 3D에서는 KTX2 / Basis Universal 같은 압축 텍스처도 고려한다.

---

## 8. 조명과 그림자 최적화

PBR material과 실시간 조명은 비용이 있다.

관제 시스템에서는 사실적인 조명보다 정보 전달이 중요하다. 따라서 다음처럼 구분하는 것이 좋다.

```text
기본 구조물: MeshBasicMaterial 또는 baked texture
중요 설비: MeshLambertMaterial 또는 MeshStandardMaterial
열차: MeshStandardMaterial 가능
센서/알람: MeshBasicMaterial 또는 Sprite
유리/금속 강조 부분: MeshPhysicalMaterial 제한 사용
```

실시간 shadow는 대규모 역사 모델에서 비용이 크다.

가능하면 다음을 사용한다.

```text
Blender에서 baked shadow
AO texture
간단한 반투명 원형 shadow plane
```

실시간 shadow는 기본적으로 끄는 것이 좋다.

```js
renderer.shadowMap.enabled = false;
```

---

## 9. LOD 적용

멀리 있는 객체는 저해상도 모델로 바꾼다.

```js
const lod = new THREE.LOD();

lod.addLevel(highDetailMesh, 0);
lod.addLevel(midDetailMesh, 50);
lod.addLevel(lowDetailMesh, 150);

scene.add(lod);
```

LOD 적용 후보는 다음과 같다.

```text
열차
역사 외부 건물
승강장 설비
사람 모델
CCTV
표지판
```

---

## 10. Culling 전략

Three.js는 기본적으로 frustum culling을 제공한다.

```js
mesh.frustumCulled = true;
```

하지만 철도 역사처럼 실내 구역이 많은 경우에는 이것만으로 부족하다.

직접 구역 기반 visibility를 관리하는 것이 좋다.

```js
zone.visible = isZoneVisible(camera.position);
```

추천 구조:

```text
Zone / Portal 시스템
층별 visibility
카메라 높이 기준 visibility
운영자 관심 구역 기준 visibility
```

---

## 11. 렌더링 해상도와 FPS 제한

고해상도 모니터에서는 `devicePixelRatio`가 성능에 큰 영향을 준다.

```js
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
```

관제 시스템은 항상 60fps가 필요하지 않다.

추천 기준:

```text
평상시: 30fps
카메라 조작 중: 60fps
정적 화면: on-demand rendering 가능
```

FPS 제한 예시:

```js
const targetFPS = 30;
const interval = 1000 / targetFPS;
let last = 0;

function animate(now) {
  requestAnimationFrame(animate);

  if (now - last < interval) return;
  last = now;

  update();
  renderer.render(scene, camera);
}
```

---

## 12. 실시간 데이터 처리 구조

나쁜 구조:

```text
WebSocket 수신
→ 즉시 Three.js 객체 변경
→ 즉시 render
```

좋은 구조:

```text
WebSocket 수신
→ 상태 버퍼에 저장
→ 렌더 루프에서 일정 주기로 반영
```

예시:

```js
const trainStateBuffer = new Map();

socket.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  trainStateBuffer.set(data.id, data);
};

function update() {
  for (const [id, state] of trainStateBuffer) {
    const train = trains.get(id);
    train.position.lerp(state.position, 0.2);
  }
}
```

서버에서 들어오는 위치를 그대로 순간 이동시키기보다 보간하는 것이 좋다.

```js
mesh.position.lerp(targetPosition, 0.15);
```

---

## 13. Object Pool 사용

객체를 자주 생성하고 삭제하면 GC와 GPU 리소스 관리 비용이 생긴다.

나쁜 구조:

```js
scene.remove(marker);
marker.geometry.dispose();
marker.material.dispose();

const newMarker = new THREE.Mesh(...);
scene.add(newMarker);
```

좋은 구조:

```js
marker.visible = false;
```

필요할 때 재사용한다.

```js
const marker = markerPool.pop() ?? createMarker();
marker.visible = true;
```

알람 마커, 센서 마커, 임시 하이라이트, 경로 표시 등에 중요하다.

---

## 14. Raycasting 최적화

전체 scene에 raycast하면 느려질 수 있다.

나쁜 구조:

```js
raycaster.intersectObjects(scene.children, true);
```

좋은 구조:

```js
raycaster.intersectObjects(pickableObjects, false);
```

추천 방식:

```text
선택 가능한 객체만 별도 배열 관리
복잡한 mesh 대신 picking 전용 단순 mesh 사용
아이콘/마커는 2D overlay 또는 sprite로 선택
복잡한 mesh에는 BVH 고려
```

---

## 15. Scene Graph 단순화

너무 깊은 계층은 traversal 비용이 생긴다.

나쁜 구조:

```text
Station
 └─ Floor
    └─ Area
       └─ Room
          └─ EquipmentGroup
             └─ Equipment
                └─ Mesh
```

성능 중심 구조:

```text
Zone_A_Static
Zone_A_Dynamic
Zone_B_Static
Zone_B_Dynamic
```

논리 계층은 별도 데이터 구조로 관리하고, 렌더링 계층은 단순하게 유지하는 것이 좋다.

---

## 16. 모델 포맷과 경량화

Three.js에서는 GLB/glTF 사용을 추천한다.

권장 파이프라인:

```text
CAD / BIM / Blender
→ 필요한 레이어만 추출
→ 불필요한 내부 부품 제거
→ polygon 감소
→ material 정리
→ texture atlas
→ GLB export
→ gltf-transform 최적화
→ Three.js 로딩
```

CAD/BIM 모델을 그대로 웹에 올리면 다음 문제가 생긴다.

```text
객체 수 과다
삼각형 수 과다
재질 수 과다
중복 geometry
보이지 않는 내부 부품 포함
좌표계/스케일 문제
```

따라서 웹용 경량화 파이프라인이 필수다.

---

## 17. WebGPU 지원에 대한 판단

Three.js는 WebGPU를 지원하는 방향으로 발전하고 있다. 하지만 현재 프로젝트에서 기본 렌더러를 WebGPU만으로 잡는 것은 아직 위험하다.

추천 전략은 다음과 같다.

```text
1순위: WebGLRenderer 기반으로 안정 구현
2순위: WebGPURenderer를 선택 옵션 또는 실험 옵션으로 추가
3순위: 특정 고부하 기능만 WebGPU 전용으로 점진 도입
```

WebGPU가 유리할 수 있는 영역은 다음과 같다.

```text
대량 particle
GPU compute
대량 instance 업데이트
시뮬레이션
복잡한 custom shader
GPU 기반 picking/culling
수십만~수백만 단위 데이터 시각화
```

철도 역사 관제에서 WebGPU가 특히 도움이 될 수 있는 기능은 다음이다.

```text
승객 흐름 particle
열차/센서 대량 상태 시각화
heatmap
위험구역 overlay
GPU picking
GPU 기반 culling
실시간 시뮬레이션
```

하지만 일반적인 역사 모델 렌더링, GLB 표시, 열차/신호등/센서 표시 정도는 WebGLRenderer로도 충분히 가능하다.

초기 버전에서는 다음 전략이 가장 안전하다.

```text
기본값: WebGLRenderer
선택 옵션: WebGPURenderer
구조: RendererAdapter로 추상화
```

예시 구조:

```text
RendererAdapter
 ├─ WebGLRendererAdapter
 └─ WebGPURendererAdapter
```

결론:

```text
WebGPU는 미래 확장성에는 좋다.
하지만 초기 핵심 기술로 잡기에는 리스크가 있다.
WebGL을 기본값으로 두고, WebGPU는 선택적 고성능 경로로 두는 것이 안전하다.
```

---

## 18. PBR Material 사용 여부

Three.js에서는 PBR material을 사용할 수 있다.

대표적으로 다음 두 가지를 사용한다.

```js
const mat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.2,
  roughness: 0.6,
});
```

더 고급 표현이 필요하면 `MeshPhysicalMaterial`을 사용한다.

```js
const mat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.2,
  roughness: 0.4,
  clearcoat: 1.0,
  clearcoatRoughness: 0.2,
  transmission: 0.5,
});
```

---

## 19. PBR에 필요한 주요 맵

PBR material에서 많이 쓰는 맵은 다음과 같다.

```text
baseColor / albedo
normalMap
roughnessMap
metalnessMap
aoMap
emissiveMap
environmentMap
```

예시:

```js
const loader = new THREE.TextureLoader();

const mat = new THREE.MeshStandardMaterial({
  map: loader.load('/textures/albedo.jpg'),
  normalMap: loader.load('/textures/normal.jpg'),
  roughnessMap: loader.load('/textures/roughness.jpg'),
  metalnessMap: loader.load('/textures/metalness.jpg'),
  aoMap: loader.load('/textures/ao.jpg'),
  metalness: 1.0,
  roughness: 0.4,
});
```

PBR이 제대로 보이려면 환경맵이 중요하다.

```js
scene.environment = hdrTexture;
```

GLB/glTF에 포함된 PBR material은 Three.js에서 자연스럽게 사용할 수 있다.

```js
const loader = new GLTFLoader();

loader.load('/station.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

---

## 20. 관제 시스템에서의 PBR 사용 전략

철도 역사 관제 시스템에서 모든 객체를 PBR로 만드는 것은 비효율적일 수 있다.

추천 전략:

```text
역사 건물, 바닥, 벽, 선로: MeshStandardMaterial 가능
센서 아이콘, 알람 표시, UI 마커: MeshBasicMaterial 또는 Sprite
반복 설비 수천 개: InstancedMesh + 단순 material
유리/금속 강조 부분: MeshPhysicalMaterial 제한 사용
```

PBR은 다음에만 집중적으로 사용하는 것이 좋다.

```text
사용자가 가까이 보는 구조물
열차
중요 설비
금속/유리 표현이 중요한 부분
데모에서 시각 품질이 중요한 장면
```

대량 객체나 상태 표시 객체는 단순 material을 사용하는 것이 좋다.

---

## 21. 추천 기본 렌더러 설정

관제 시스템용 기본 설정 예시는 다음과 같다.

```js
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = false;
```

---

## 22. 추천 전체 아키텍처

최종적으로 다음 구조를 추천한다.

```text
Frontend
 ├─ React UI
 │   ├─ 알람 리스트
 │   ├─ 설비 검색
 │   ├─ 속성 패널
 │   ├─ 레이어 필터
 │   └─ 사용자 설정
 │
 ├─ Three.js Viewport
 │   ├─ WebGLRenderer
 │   ├─ Scene
 │   ├─ Camera
 │   ├─ Orbit/Custom Controls
 │   ├─ Zone Manager
 │   ├─ Static Model Manager
 │   ├─ Dynamic Object Manager
 │   ├─ Train Manager
 │   ├─ Sensor Manager
 │   ├─ Alarm Marker Manager
 │   └─ Picking Manager
 │
 ├─ Data Layer
 │   ├─ WebSocket Client
 │   ├─ State Buffer
 │   ├─ Interpolation Logic
 │   └─ Event Dispatcher
 │
 └─ Worker
     ├─ 데이터 파싱
     ├─ 좌표 변환
     ├─ 필터링
     └─ 경로/구역 계산
```

---

## 23. 가장 피해야 할 구조

다음 구조는 피하는 것이 좋다.

```text
CAD/BIM 모델 원본 그대로 로딩
객체마다 Mesh 하나씩 생성
객체마다 Material 하나씩 생성
센서 상태를 React state로 초당 갱신
모든 라벨을 DOM으로 표시
실시간 그림자 사용
SSAO/Bloom 같은 후처리 과다 사용
전체 scene에 raycast
모든 데이터를 항상 3D에 표시
```

이런 구조는 데모에서는 돌아갈 수 있지만, 실제 관제 데이터가 붙으면 급격히 느려질 가능성이 높다.

---

## 24. 실무적 최종 결론

철도 역사 3D 관제 시스템에서는 다음 방향이 가장 현실적이다.

```text
Three.js 직접 사용
React는 UI 전용
WebGLRenderer를 기본 렌더러로 사용
WebGPU는 선택적 실험 기능으로 준비
정적 역사 모델은 구역별 GLB로 분할
반복 설비는 InstancedMesh 사용
실시간 객체는 dynamic layer로 분리
센서/알람은 zoom/filter 기반 표시
WebSocket 데이터는 buffer 후 렌더 루프에서 반영
기본 30fps 기준
PBR은 중요한 구조물에만 제한적으로 사용
대량 객체와 상태 표시 객체는 단순 material 사용
```

핵심은 렌더링 기술 자체보다 **데이터 구조, 객체 수 관리, draw call 관리, 실시간 업데이트 구조**다.

초기부터 이 구조를 잡아두면 이후 WebGPU, GPU picking, heatmap, 승객 흐름 시뮬레이션 같은 고급 기능을 추가하기도 쉽다.
