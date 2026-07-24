import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, type Object3D } from "three";

import mapsBigCompanyUrl from "@/assets/model/Maps_BigCompany256.glb?url";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";
import { limitSceneLights } from "@/three/limitLights";

const MAX_LIGHTS = 20;
const preparedScenes = new WeakSet<Object3D>();

function enableMeshShadows(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
}

function prepareModel(scene: Object3D) {
  if (preparedScenes.has(scene)) return scene;

  const lights = limitSceneLights(scene, MAX_LIGHTS);
  enableMeshShadows(scene);
  preparedScenes.add(scene);
  console.log("[Testing] lights limited", lights);
  return scene;
}

function MapsBigCompanyModel() {
  const gltf = useGLTF(
    mapsBigCompanyUrl,
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  );

  const scene = useMemo(() => prepareModel(gltf.scene), [gltf.scene]);

  return <primitive object={scene} />;
}

/** Maps_BigCompany256.glb — intensity 상위 20개 조명만 유지 */
export default function Testing() {
  return (
    <Suspense fallback={null}>
      <MapsBigCompanyModel />
    </Suspense>
  );
}

useGLTF.preload(
  mapsBigCompanyUrl,
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
);
