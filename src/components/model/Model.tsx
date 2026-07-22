import { useLayoutEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Light, type Object3D } from "three";
import { modelUrl } from "../../assets/model";

useGLTF.preload(modelUrl, true);

/** MeshStandardMaterial fragment uniform 한도를 넘지 않도록 GLB 라이트 상한 */
const MAX_LIGHTS = 100;

function limitLights(root: Object3D, max = MAX_LIGHTS) {
  const lights: Light[] = [];
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light);
  });

  if (lights.length <= max) return;

  // 밝은 라이트 우선 유지
  lights.sort((a, b) => b.intensity - a.intensity);
  for (const light of lights.slice(max)) {
    light.parent?.remove(light);
  }
}

export default function Model() {
  const { scene } = useGLTF(modelUrl);

  useLayoutEffect(() => {
    limitLights(scene);
  }, [scene]);

  return <primitive object={scene} />;
}
