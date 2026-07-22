import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Light, type Object3D } from "three";

import { useModelStore } from "@/stores/modelStore";

function collectLights(root: Object3D) {
  const lights: Light[] = [];
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light);
  });
  return lights;
}

/** GLB 내장 라이트는 WebGL/WebGPU 모두 셰이더 한도를 초과할 수 있어 제거 */
function stripAllLights(root: Object3D) {
  for (const light of collectLights(root)) {
    light.parent?.remove(light);
    light.dispose?.();
  }
}

function ModelScene({ url }: { url: string }) {
  const invalidate = useThree((s) => s.invalidate);
  const { scene } = useGLTF(url);

  const modelScene = useMemo(() => {
    const clone = scene.clone(true);
    // stripAllLights(clone);
    return clone;
  }, [scene]);

  useEffect(() => {
    invalidate();
  }, [modelScene, invalidate]);

  return <primitive object={modelScene} />;
}

export default function Model({ enableGPU }: { enableGPU: boolean }) {
  const modelUrl = useModelStore((s) => s.selectedUrl);
  const prevUrlRef = useRef(modelUrl);

  useEffect(() => {
    const prevUrl = prevUrlRef.current;
    if (prevUrl !== modelUrl) {
      useGLTF.clear(prevUrl);
      prevUrlRef.current = modelUrl;
    }
  }, [modelUrl]);

  return (
    <ModelScene
      key={`${modelUrl}-${enableGPU ? "gpu" : "gl"}`}
      url={modelUrl}
    />
  );
}
