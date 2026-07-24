import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  ACESFilmicToneMapping,
  Light,
  Mesh,
  type Object3D,
  type WebGLRenderer,
} from "three";

import trainStationUrl from "@/assets/model/TrainStation.glb?url";
import { applyBlenderLightIntensities } from "@/three/blenderLights";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";

const preparedScenes = new WeakSet<Object3D>();
/** GLB에서 읽은 원본 intensity — 모드 변경/HMR 시 재적용용 */
const originalIntensity = new WeakMap<Light, number>();

/**
 * TrainStation.glb intensity 해석 모드
 * - blender-energy: Blender Power(W) → cd  (× ~54) → 더 밝아짐
 * - gltf-unitless: ×683 → 더 밝아짐
 * - gltf-standard: 이미 cd/lx → 변환 없음 (이 파일이 해당)
 *
 * 실측 Point ~200–3000 cd → blender-energy 적용하면 더 밝아짐 (잘못)
 */
const LIGHT_INTENSITY_MODE = "gltf-standard" as const;
const FORCED_LIGHT_INTENSITY = 0.3;

function enableMeshShadows(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
}

function restoreOriginalIntensities(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Light).isLight) return;
    const light = obj as Light;
    const stored = originalIntensity.get(light);
    if (stored !== undefined) {
      light.intensity = stored;
      return;
    }
    originalIntensity.set(light, light.intensity);
  });
}

/** 테스트용: 모든 Light.intensity 고정 */
function forceLightIntensity(root: Object3D, value: number) {
  const report: Array<{ name: string; type: string; before: number }> = [];
  root.traverse((obj) => {
    if (!(obj as Light).isLight) return;
    const light = obj as Light;
    report.push({
      name: light.name || "(unnamed)",
      type: light.type,
      before: light.intensity,
    });
    light.intensity = value;
  });
  console.log("[Testing] forced light intensity", value, report);
}

function prepareTrainStation(scene: Object3D) {
  restoreOriginalIntensities(scene);

  if (!preparedScenes.has(scene)) {
    enableMeshShadows(scene);
    preparedScenes.add(scene);
  }

  applyBlenderLightIntensities(scene, LIGHT_INTENSITY_MODE);
  forceLightIntensity(scene, FORCED_LIGHT_INTENSITY);
  return scene;
}

function TrainStationModel() {
  const gl = useThree((s) => s.gl) as WebGLRenderer;
  const gltf = useGLTF(
    trainStationUrl,
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  );

  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
  }, [gl]);

  const scene = useMemo(() => prepareTrainStation(gltf.scene), [gltf.scene]);

  return <primitive object={scene} />;
}

/** TrainStation.glb — glTF Standard(cd/lx) 그대로 사용 */
export default function Testing() {
  return (
    <Suspense fallback={null}>
      <TrainStationModel />
    </Suspense>
  );
}

// blender-energy로 이미 키워둔 씬 캐시 제거 → 파일 원본 cd/lx 재로드
useGLTF.clear(trainStationUrl);
useGLTF.preload(
  trainStationUrl,
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
);
