import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Light, Mesh, type Object3D } from "three";

import mapsBigCompanyUrl from "@/assets/model/Maps_BigCompany256.glb?url";
import {
  useLightBankStore,
  type DetachedLight,
} from "@/stores/lightBankStore.ts";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";

const preparedScenes = new WeakSet<Object3D>();
const lightBankByScene = new WeakMap<Object3D, DetachedLight[]>();

function enableMeshShadows(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
}

function collectLights(root: Object3D): DetachedLight[] {
  const entries: DetachedLight[] = [];
  root.traverse((obj) => {
    if (!(obj as Light).isLight) return;
    const light = obj as Light;
    if (!light.parent) return;
    entries.push({ light, parent: light.parent });
  });

  entries.sort((a, b) =>
    (a.light.name || "").localeCompare(b.light.name || ""),
  );

  for (const { light } of entries) {
    light.removeFromParent();
  }

  return entries;
}

function prepareModel(scene: Object3D): DetachedLight[] {
  if (!preparedScenes.has(scene)) {
    enableMeshShadows(scene);
    const entries = collectLights(scene);
    lightBankByScene.set(scene, entries);
    preparedScenes.add(scene);
    console.log("[Testing] lights collected", entries.length);
  }
  return lightBankByScene.get(scene) ?? [];
}

function MapsBigCompanyModel() {
  const setBank = useLightBankStore((s) => s.setBank);
  const reset = useLightBankStore((s) => s.reset);

  const gltf = useGLTF(
    mapsBigCompanyUrl,
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  );

  const entries = useMemo(() => prepareModel(gltf.scene), [gltf.scene]);

  useEffect(() => {
    setBank(entries);
    return () => reset();
  }, [entries, setBank, reset]);

  return <primitive object={gltf.scene} />;
}

/** Maps_BigCompany512.glb — 조명 배열, 버튼으로 씬에 add/remove */
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
