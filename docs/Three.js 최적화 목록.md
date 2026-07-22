아래 순서로 최적화하면 됩니다. 중요도 순입니다.

## 1. Draw Call 줄이기

Three.js 최적화의 1순위입니다.

나쁜 구조:

```js
for (let i = 0; i < 10000; i++) {
  scene.add(new THREE.Mesh(geometry, material));
}
```

좋은 구조:

```js
const mesh = new THREE.InstancedMesh(geometry, material, 10000);
scene.add(mesh);
```

철도 관제라면 다음은 거의 반드시 `InstancedMesh` 후보입니다.

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

`InstancedMesh`는 같은 geometry/material을 여러 위치에 그릴 때 draw call을 크게 줄이는 공식 기능입니다. ([Three.js][1])

---

## 2. 객체 수 줄이기

Three.js에서 `Mesh`가 많으면 CPU 부담이 커집니다.

가능하면 다음처럼 합칩니다.

```text
개별 Mesh 1000개
→ 같은 재질끼리 병합한 Mesh 1~10개
```

방법:

```js
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const merged = mergeGeometries(geometries);
const mesh = new THREE.Mesh(merged, material);
scene.add(mesh);
```

정적 구조물은 병합하세요.

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

움직이거나 상태가 바뀌는 것만 별도 객체로 둡니다.

---

## 3. Geometry는 `BufferGeometry` 사용

요즘 Three.js는 기본적으로 `BufferGeometry` 중심입니다.

피해야 할 것:

```text
매 프레임 geometry 새로 생성
매 프레임 vertex 배열 재할당
불필요하게 세밀한 모델
```

좋은 방식:

```js
geometry.attributes.position.needsUpdate = true;
```

단, 이것도 매 프레임 많이 하면 비쌉니다. 가능하면 정적 geometry와 동적 geometry를 분리하세요.

---

## 4. Material 수 줄이기

재질이 많으면 draw call과 shader switch가 늘어납니다.

나쁜 구조:

```text
객체마다 새 MeshStandardMaterial
```

좋은 구조:

```js
const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

mesh1.material = redMaterial;
mesh2.material = redMaterial;
mesh3.material = redMaterial;
```

상태 색상도 무작정 material을 새로 만들지 말고 재사용하세요.

```js
const materials = {
  normal: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  warning: new THREE.MeshBasicMaterial({ color: 0xffff00 }),
  error: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
};
```

---

## 5. Texture Atlas 사용

작은 텍스처 여러 장은 비효율적입니다.

```text
표지판 텍스처 100장
→ 큰 atlas 1장
```

효과:

```text
텍스처 바인딩 감소
draw call 감소
GPU 메모리 관리 쉬움
```

관제 시스템의 아이콘, 표지판, 센서 마커는 atlas로 묶는 게 좋습니다.

---

## 6. 텍스처 크기 줄이기

무조건 4K 텍스처를 쓰면 안 됩니다.

권장:

```text
작은 장비: 256~512
일반 구조물: 1024
중요한 근접 모델: 2048
4K: 매우 제한적으로만
```

그리고 가능하면 압축 텍스처를 쓰세요.

```text
KTX2 / Basis Universal
```

Three.js는 KTX2Loader를 제공합니다. 압축 텍스처는 GPU 메모리와 로딩 시간을 줄이는 데 유리합니다.

---

## 7. 조명 줄이기

`MeshStandardMaterial`, `MeshPhysicalMaterial`은 조명 계산이 들어가서 무겁습니다.

관제 시스템이면 사실적인 조명보다 정보 전달이 중요하므로 다음을 많이 쓰는 게 좋습니다.

```js
new THREE.MeshBasicMaterial()
```

또는

```js
new THREE.MeshLambertMaterial()
```

무거운 순서:

```text
MeshBasicMaterial      가벼움
MeshLambertMaterial
MeshPhongMaterial
MeshStandardMaterial
MeshPhysicalMaterial   무거움
```

관제 화면에서는 `MeshBasicMaterial` + baked texture 조합이 실용적입니다.

---

## 8. 그림자 최소화

실시간 shadow는 매우 비쌉니다.

피해야 할 것:

```js
renderer.shadowMap.enabled = true;
mesh.castShadow = true;
mesh.receiveShadow = true;
```

대규모 역사 모델에서는 그림자를 실시간으로 계산하지 말고:

```text
Blender에서 baked shadow
AO texture 사용
간단한 반투명 원형 shadow plane 사용
```

정도로 처리하는 게 좋습니다.

---

## 9. LOD 적용

멀리 있는 객체는 저해상도 모델로 바꿉니다.

```js
const lod = new THREE.LOD();

lod.addLevel(highDetailMesh, 0);
lod.addLevel(midDetailMesh, 50);
lod.addLevel(lowDetailMesh, 150);

scene.add(lod);
```

적용 대상:

```text
열차
역사 외부 건물
승강장 설비
사람 모델
CCTV
표지판
```

---

## 10. Frustum Culling 활용

카메라 밖 객체는 렌더링하지 않아야 합니다.

Three.js는 기본적으로 frustum culling을 합니다.

```js
mesh.frustumCulled = true;
```

단, `InstancedMesh`나 병합 Mesh는 bounding volume이 너무 크면 culling 효과가 약해질 수 있습니다.

그래서 공간별로 나누는 게 좋습니다.

```text
역 전체를 하나로 병합 X
구역별 병합 O

B1_승강장_A
B1_승강장_B
1F_대합실
2F_상가
선로_동쪽
선로_서쪽
```

---

## 11. Occlusion Culling은 직접 설계

Three.js는 강력한 occlusion culling을 자동으로 해주지 않습니다.

철도 역사처럼 실내 구조가 많으면 직접 구역 기반으로 끄는 게 좋습니다.

```text
현재 카메라가 대합실에 있음
→ 지하 승강장 세부 객체 비활성화
→ 반대편 플랫폼 장비 비활성화
```

간단한 방식:

```js
zone.visible = isZoneVisible(camera.position);
```

더 좋은 방식:

```text
Zone / Portal 시스템
층별 visibility
카메라 높이 기준 visibility
운영자 관심 구역 기준 visibility
```

---

## 12. 렌더링 해상도 조정

고해상도 모니터에서는 `devicePixelRatio`가 성능을 많이 잡아먹습니다.

```js
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
```

관제용 대형 모니터에서는 `2.0`보다 `1.0~1.5`가 현실적입니다.

---

## 13. Antialias 끄거나 후처리로 대체

```js
const renderer = new THREE.WebGLRenderer({
  antialias: false,
});
```

MSAA는 비용이 큽니다. 대신 FXAA/SMAA를 쓰거나, 관제 화면이면 안티앨리어싱을 줄여도 됩니다.

---

## 14. Post-processing 최소화

무거운 효과:

```text
Bloom
SSAO
SSR
Depth of Field
Motion Blur
Volumetric Light
```

관제 시스템에서는 대부분 불필요합니다.

가능하면:

```text
후처리 없음
또는 FXAA 정도만
```

---

## 15. Render on Demand

항상 60fps로 렌더링할 필요가 없는 화면이면 변경될 때만 렌더링합니다.

Three.js 공식 매뉴얼에도 on-demand rendering 패턴이 있습니다. ([Three.js][1])

예:

```js
let renderRequested = false;

function requestRenderIfNotRequested() {
  if (!renderRequested) {
    renderRequested = true;
    requestAnimationFrame(render);
  }
}

function render() {
  renderRequested = false;
  renderer.render(scene, camera);
}
```

하지만 철도 관제처럼 열차가 계속 움직이면 완전한 on-demand보다는:

```text
평상시 15~30fps
사용자 조작 중 60fps
이벤트 발생 시 즉시 렌더
```

가 좋습니다.

---

## 16. FPS를 의도적으로 제한

항상 60fps가 필요하지 않습니다.

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

관제 시스템은 보통 30fps도 충분합니다.

---

## 17. 실시간 데이터와 렌더링 분리

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

예:

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

---

## 18. React state와 분리

React를 쓰더라도 3D 객체 위치를 React state로 관리하면 안 됩니다.

피해야 함:

```jsx
setTrainPosition(...)
```

좋은 방식:

```js
trainMesh.position.copy(pos);
```

React는 다음에만 사용하세요.

```text
선택된 열차 ID
알람 목록
속성 패널
검색 결과
사용자 메뉴
필터 설정
```

3D 월드의 초당 갱신 데이터는 Three.js 내부에서 직접 처리하세요.

---

## 19. Object Pool 사용

객체를 자주 생성/삭제하지 마세요.

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

필요할 때 재사용:

```js
const marker = markerPool.pop() ?? createMarker();
marker.visible = true;
```

관제 시스템에서는 알람 마커, 센서 마커, 임시 하이라이트, 경로 표시 등에 중요합니다.

---

## 20. Raycasting 최적화

마우스 클릭 선택을 위해 전체 scene에 raycast하면 느립니다.

나쁜 구조:

```js
raycaster.intersectObjects(scene.children, true);
```

좋은 구조:

```js
raycaster.intersectObjects(pickableObjects, false);
```

더 좋은 방식:

```text
선택 가능한 객체만 별도 배열 관리
큰 객체는 BVH 적용
아이콘/마커는 2D overlay에서 선택
```

복잡한 mesh raycast에는 `three-mesh-bvh` 사용을 고려할 수 있습니다.

---

## 21. Picking 전용 저해상도 객체 사용

정밀 모델을 직접 raycast하지 말고 단순 collision mesh를 따로 둡니다.

```text
보이는 모델: 복잡한 열차 모델
선택 모델: 단순 box
```

```js
pickMesh.userData.target = realTrainObject;
```

---

## 22. Static / Dynamic 분리

Scene을 다음처럼 나누세요.

```text
staticScene
 - 역사 건물
 - 선로
 - 플랫폼
 - 벽/기둥/천장

dynamicScene
 - 열차
 - 신호등
 - 센서 상태
 - 알람 마커
 - 작업자 위치
```

정적 객체는 병합, 동적 객체는 개별 관리합니다.

---

## 23. 모델 파일은 glTF/GLB 사용

Three.js에서는 일반적으로 glTF/GLB가 가장 적합합니다.

권장 파이프라인:

```text
Blender / CAD / BIM
→ polygon 감소
→ material 정리
→ texture atlas
→ GLB export
→ gltf-transform 최적화
→ Three.js 로딩
```

FBX, OBJ보다 GLB가 웹 배포에 적합합니다.

---

## 24. Draco / Meshopt 압축

GLB 용량을 줄이려면:

```text
Draco: geometry 압축률 좋음, decode 비용 있음
Meshopt: 로딩 성능 좋음, 실시간 웹에 적합
```

대규모 역사 모델은 `meshopt`를 우선 고려하세요.

---

## 25. 모델 폴리곤 수 줄이기

철도 역사 관제는 AAA 게임 그래픽이 목적이 아닙니다.

권장:

```text
멀리서만 보는 구조물: 매우 단순화
운영자가 자주 확대하는 설비: 중간 품질
열차/중요 장비: 상대적으로 고품질
```

불필요한 세부 모델은 제거:

```text
볼트
나사
내부 케이블
장비 뒷면
보이지 않는 면
실내 천장 위 구조물
```

---

## 26. CAD/BIM 모델 그대로 쓰지 않기

철도 역사 모델이 CAD/BIM에서 오면 웹에서 거의 그대로 못 씁니다.

문제:

```text
객체 수 과다
삼각형 수 과다
재질 수 과다
텍스처 없음/과다
중복 geometry
보이지 않는 내부 부품 포함
좌표계/스케일 문제
```

반드시 경량화 파이프라인이 필요합니다.

```text
원본 CAD/BIM
→ 필요한 레이어만 추출
→ 객체 병합
→ Decimate
→ 재질 통합
→ GLB 변환
→ 웹 최적화
```

---

## 27. Matrix 업데이트 줄이기

움직이지 않는 객체는 matrix 자동 업데이트를 끕니다.

```js
mesh.matrixAutoUpdate = false;
mesh.updateMatrix();
```

정적 객체에 효과가 있습니다.

```js
staticMesh.matrixAutoUpdate = false;
```

---

## 28. `visible = false` 적극 사용

카메라 밖, 필터링된 설비, 꺼진 레이어는 제거하지 말고 숨깁니다.

```js
object.visible = false;
```

단, 너무 많은 숨김 객체가 scene graph에 남아 있으면 traversal 비용은 여전히 있습니다. 대규모면 zone 단위로 관리하세요.

---

## 29. Scene Graph 깊이 줄이기

너무 깊은 계층은 traversal 비용이 생깁니다.

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

성능 중시 구조:

```text
Zone_A_Static
Zone_A_Dynamic
Zone_B_Static
Zone_B_Dynamic
```

논리 계층은 별도 데이터 구조로 관리하고, 렌더링 계층은 단순하게 유지하세요.

---

## 30. `Object3D.userData` 남용하지 않기

소량이면 괜찮지만, 대규모 객체에서 복잡한 데이터를 `userData`에 다 넣으면 관리가 지저분해집니다.

추천:

```js
const objectMap = new Map(); // object.uuid -> domain data
```

또는:

```js
const trainMap = new Map(); // trainId -> mesh
```

---

## 31. 투명 객체 줄이기

투명 재질은 정렬과 overdraw 때문에 비쌉니다.

피해야 할 것:

```js
material.transparent = true;
material.opacity = 0.3;
```

대안:

```text
투명 영역 최소화
alphaTest 사용
반투명 레이어 수 제한
유리 표현 단순화
```

```js
material.alphaTest = 0.5;
material.transparent = false;
```

---

## 32. Overdraw 줄이기

반투명 평면, 큰 UI plane, 겹치는 바닥 효과가 많으면 GPU가 같은 픽셀을 여러 번 그립니다.

피해야 할 것:

```text
넓은 반투명 바닥 overlay 여러 장
전체 역사 위에 투명 heatmap 여러 장
반투명 경로 표시 과다
```

대안:

```text
필요 영역만 작은 mesh로 표시
shader에서 discard 최소화
2D canvas overlay로 분리
```

---

## 33. 3D 텍스트 주의

`TextGeometry`는 무겁습니다.

관제 라벨은 보통 3D mesh text보다 다음이 낫습니다.

```text
CSS2DRenderer
CSS3DRenderer
CanvasTexture label
Sprite label
HTML overlay
```

대량 라벨은 표시 개수를 제한하세요.

```text
카메라 거리 가까울 때만 표시
선택된 객체만 표시
마우스 hover 시 표시
```

---

## 34. Sprite 사용

항상 카메라를 보는 아이콘은 `Sprite`가 적합합니다.

```js
const sprite = new THREE.Sprite(spriteMaterial);
```

센서, 경고, 위치 마커에 좋습니다.

단, 수천 개 이상이면 sprite도 atlas + instancing 식으로 최적화해야 합니다.

---

## 35. CSS2DRenderer 남용 주의

HTML 라벨은 만들기 쉽지만 DOM이 많아지면 느립니다.

```text
수십 개: 괜찮음
수백 개: 주의
수천 개: 위험
```

대량 라벨은 WebGL 내부에서 처리하는 편이 낫습니다.

---

## 36. Web Worker 사용

실시간 관제 데이터 파싱, 필터링, 좌표 변환은 Worker로 빼세요.

Worker에 적합:

```text
WebSocket 데이터 파싱
열차 위치 보간 계산
경로 탐색
센서 상태 집계
알람 필터링
좌표계 변환
대량 JSON 처리
```

렌더링은 메인 스레드에서 하지만, 계산은 Worker로 분리할 수 있습니다.

---

## 37. JSON보다 binary protocol 고려

관제 데이터가 많으면 JSON 파싱 비용도 생깁니다.

가능하면:

```text
MessagePack
Protocol Buffers
FlatBuffers
ArrayBuffer 직접 파싱
```

열차 위치 같은 것은 binary가 유리합니다.

---

## 38. 좌표 업데이트는 보간

서버에서 초당 1~10회 위치가 오더라도 렌더링은 부드럽게 보간합니다.

```js
mesh.position.lerp(targetPosition, 0.15);
```

서버 업데이트를 그대로 순간 이동시키지 마세요.

---

## 39. 시간 기반 업데이트 사용

프레임 속도에 따라 움직임이 달라지면 안 됩니다.

```js
const delta = clock.getDelta();
train.position.x += speed * delta;
```

---

## 40. 카메라 컨트롤 제한

관제 시스템에서 사용자가 무한히 확대/회전하면 렌더링 부하가 커집니다.

제한하세요.

```text
최대 줌아웃 제한
최대 줌인 제한
회전 각도 제한
층별 카메라 프리셋
관심 구역 이동
```

---

## 41. 레이어 시스템 사용

Three.js에는 `Layers`가 있습니다.

```js
object.layers.set(1);
camera.layers.enable(1);
```

활용:

```text
기본 구조물
열차
센서
알람
CCTV
유지보수 구역
승객 흐름
```

필요한 레이어만 렌더링합니다.

---

## 42. 여러 씬 또는 여러 패스 분리

관제 화면에서는 다음처럼 나눌 수 있습니다.

```text
3D 역사 scene
2D/3D 아이콘 overlay scene
선택 outline scene
```

다만 postprocess pass가 많아지면 손해입니다. 꼭 필요한 경우만 분리하세요.

---

## 43. Outline 효과 주의

선택 객체 outline은 편하지만 비쌀 수 있습니다.

대안:

```text
선택 객체만 emissive color 변경
간단한 bounding box 표시
얇은 wireframe box 표시
```

```js
const box = new THREE.BoxHelper(object);
scene.add(box);
```

---

## 44. Skeleton animation 최소화

사람, 작업자, 승객을 많이 넣으면 skinned mesh가 비쌉니다.

대안:

```text
사람은 billboard/sprite
멀리서는 점/아이콘
중요 인물만 skinned mesh
```

---

## 45. Particle도 제한

화재, 연기, 승객 흐름 등을 particle로 표현할 수 있지만 대량이면 비용이 큽니다.

가능하면:

```text
InstancedMesh particle
GPU particle
간단한 shader
표시 개수 제한
```

---

## 46. Material compile 사전 처리

새 material이 처음 화면에 나오면 shader compile로 끊길 수 있습니다.

초기 로딩 후:

```js
renderer.compile(scene, camera);
```

또는 주요 객체를 미리 한 번 렌더링합니다.

---

## 47. 첫 로딩 분산

거대한 GLB를 한 번에 로딩하면 멈춥니다.

구역별로 나누세요.

```text
station_base.glb
platform_A.glb
platform_B.glb
concourse.glb
equipment.glb
signals.glb
```

필요할 때 lazy load:

```text
처음: 기본 구조 + 현재 층
나중: 다른 층, 세부 설비
```

---

## 48. Asset Streaming

대형 역사라면 처음부터 전체를 올리지 말고 구역별 스트리밍 구조가 좋습니다.

```text
카메라 위치
→ 주변 zone 필요 여부 판단
→ GLB 로드
→ 멀어진 zone unload 또는 hide
```

---

## 49. GPU 메모리 해제

Three.js는 GPU 리소스를 자동으로 완전히 정리하지 않습니다. geometry, material, texture는 명시적으로 `dispose()` 해야 합니다. 공식 매뉴얼에도 dispose 패턴이 따로 있습니다. ([Three.js][1])

```js
geometry.dispose();
material.dispose();
texture.dispose();
```

material에 텍스처가 있으면 같이 해제:

```js
function disposeMaterial(material) {
  for (const key in material) {
    const value = material[key];
    if (value && value.isTexture) {
      value.dispose();
    }
  }
  material.dispose();
}
```

---

## 50. Renderer 정보 확인

디버깅에 유용합니다.

```js
console.log(renderer.info);
```

확인할 것:

```text
renderer.info.render.calls
renderer.info.render.triangles
renderer.info.memory.geometries
renderer.info.memory.textures
```

특히 `render.calls`가 draw call입니다.

대략 목표:

```text
좋음: 100~300 draw calls
주의: 500~1000
위험: 1000+
```

물론 장비와 씬에 따라 다릅니다.

---

## 51. 성능 측정 도구 사용

필수 도구:

```text
Chrome DevTools Performance
Chrome Memory
Spector.js
stats.js
renderer.info
```

Spector.js는 WebGL draw call 분석에 유용합니다.

---

## 52. Bounding Volume 직접 관리

병합 mesh나 instanced mesh는 bounding box/sphere가 중요합니다.

```js
geometry.computeBoundingBox();
geometry.computeBoundingSphere();
```

동적 geometry라면 갱신 필요:

```js
geometry.computeBoundingSphere();
```

---

## 53. InstancedMesh 업데이트 최적화

매 프레임 모든 instance matrix를 갱신하면 비쌉니다.

```js
mesh.setMatrixAt(index, matrix);
mesh.instanceMatrix.needsUpdate = true;
```

`needsUpdate`는 한 프레임에 한 번만 설정하세요.

```js
let instanceDirty = false;

function updateInstance(i, matrix) {
  instancedMesh.setMatrixAt(i, matrix);
  instanceDirty = true;
}

function render() {
  if (instanceDirty) {
    instancedMesh.instanceMatrix.needsUpdate = true;
    instanceDirty = false;
  }
}
```

---

## 54. 색상도 instance attribute 사용

상태 색상이 많은 센서/신호등은 material을 나누지 말고 instance color를 씁니다.

```js
instancedMesh.setColorAt(index, color);
instancedMesh.instanceColor.needsUpdate = true;
```

---

## 55. 동적 객체 수 제한

관제 시스템에서 모든 데이터를 3D로 표시하면 망합니다.

예:

```text
센서 50,000개
CCTV 5,000개
설비 100,000개
```

전부 항상 표시하지 말고:

```text
현재 층만 표시
현재 줌 레벨에서 중요한 것만 표시
알람 상태만 표시
검색/필터 결과만 표시
```

---

## 56. 거리 기반 표시

```js
const distance = camera.position.distanceTo(object.position);

object.visible = distance < 200;
```

하지만 객체마다 매 프레임 계산하면 비쌉니다. 구역 단위나 grid 단위로 하세요.

---

## 57. Spatial Index 사용

대규모 객체는 배열 전체를 매번 순회하지 마세요.

사용 가능 구조:

```text
Grid
Quadtree
Octree
BVH
R-tree
```

역사 관제는 대개 층/구역 기반 grid가 충분합니다.

---

## 58. 데이터 ID와 렌더 객체 분리

도메인 데이터와 Three.js 객체를 분리하세요.

```js
const trains = new Map();       // trainId -> train data
const trainMeshes = new Map();  // trainId -> mesh
```

이렇게 해야 업데이트, 필터링, 삭제, 검색이 쉬워집니다.

---

## 59. 불필요한 `traverse()` 줄이기

매 프레임:

```js
scene.traverse(...)
```

는 피하세요.

초기화 때만 traverse하고, 이후에는 필요한 배열을 따로 유지합니다.

```js
const dynamicObjects = [];
const pickableObjects = [];
const visibleZones = [];
```

---

## 60. `clone()` 남발 금지

모델 복제 시 geometry/material을 공유해야 합니다.

```js
const clone = original.clone();
```

이 경우 geometry/material은 보통 공유됩니다. 하지만 material을 개별 수정하면 복제가 필요합니다.

가능하면:

```text
geometry 공유
material 공유
instance 사용
```

---

## 61. Shader 단순화

커스텀 shader를 쓰면 다음을 피하세요.

```text
복잡한 분기 if
많은 texture sampling
많은 light 계산
discard 남용
고정밀 연산 남용
```

관제용 shader는 단순해야 합니다.

---

## 62. WebGLRenderer 옵션 단순화

```js
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});
```

`alpha: true`는 필요 없으면 끄세요.

---

## 63. Canvas 크기 관리

CSS 크기와 drawing buffer 크기를 구분해야 합니다.

```js
renderer.setSize(width, height, false);
```

resize 이벤트에서만 갱신하세요. 매 프레임 갱신하면 안 됩니다.

---

## 64. 모바일/저사양 모드 제공

철도 관제는 보통 데스크톱이겠지만, 클라이언트 PC 사양이 다양할 수 있습니다.

옵션:

```text
고품질: 그림자/후처리/고해상도
표준: 그림자 없음, 30fps
저사양: 단순 모델, 라벨 제한, 20~30fps
```

---

## 65. 관제 시스템용 추천 기본값

```js
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = false;
```

재질:

```text
기본 구조물: MeshBasicMaterial 또는 baked texture
중요 설비: MeshLambertMaterial
열차: MeshStandardMaterial 가능
센서/알람: Sprite 또는 InstancedMesh
```

렌더링:

```text
기본 30fps
카메라 조작 중 60fps
정적 화면은 on-demand 가능
```

---

## 66. 가장 중요한 실전 원칙

우선순위는 이렇습니다.

```text
1. draw call 줄이기
2. 객체 수 줄이기
3. material/texture 수 줄이기
4. 정적/동적 분리
5. InstancedMesh 사용
6. GLB 경량화
7. 그림자/후처리 제거
8. culling/LOD 적용
9. React state와 3D 업데이트 분리
10. renderer.info로 계속 측정
```

철도 역사 관제 시스템이면 설계를 이렇게 잡는 게 좋습니다.

```text
Three.js 직접 제어
React는 UI 전용
정적 역사 모델은 구역별 GLB
반복 설비는 InstancedMesh
실시간 객체는 별도 dynamic layer
센서/알람은 zoom/filter 기반 표시
WebSocket 데이터는 buffer 후 렌더 루프에서 반영
30fps 기준
```

가장 피해야 하는 구조는 이것입니다.

```text
CAD/BIM 모델 원본 그대로 로딩
객체마다 Mesh 하나
객체마다 Material 하나
센서 상태를 React state로 초당 갱신
모든 라벨을 DOM으로 표시
그림자/SSAO/Bloom 켜기
전체 scene raycast
```

이렇게 만들면 초반 데모는 돌아가도 실제 관제 데이터가 붙는 순간 느려질 가능성이 큽니다.

[1]: https://threejs.org/manual/?utm_source=chatgpt.com "Manual"
