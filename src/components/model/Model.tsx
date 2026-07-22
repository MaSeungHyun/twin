import { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Light, type Object3D } from "three";

import { useModelStore } from "@/stores/modelStore";
import { releaseGltf } from "@/three/disposeGltf";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";

function collectLights(root: Object3D) {
  const lights: Light[] = [];
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light);
  });
  return lights;
}

function stripAllLights(root: Object3D) {
  for (const light of collectLights(root)) {
    light.parent?.remove(light);
    light.dispose?.();
  }
}

function ModelScene({ url }: { url: string }) {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const { scene } = useGLTF(
    url,
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  );

  // clone 없이 캐시 scene 직접 사용 → 메모리 2배 방지

  useEffect(() => {
    window.renderer = gl;
  }, [gl]);
  useEffect(() => {
    stripAllLights(scene);
    invalidate();
  }, [scene, invalidate]);

  useEffect(() => {
    return () => {
      releaseGltf(url, scene);
      // WebGL이 해제된 텍스처를 빨리 반영하도록 한 프레임 렌더
      gl.renderLists?.dispose?.();
    };
  }, [url, scene, gl]);

  return <primitive object={scene} />;
}

/**
 * 모델 전환: 이전 모델 언마운트·dispose → 여유 프레임 → 새 모델 로드
 * (태블릿 OOM 방지: 170+69 동시 상주 피함)
 */
export default function Model() {
  const selectedUrl = useModelStore((s) => s.selectedUrl);
  const [displayUrl, setDisplayUrl] = useState<string | null>(selectedUrl);
  const displayUrlRef = useRef(displayUrl);
  displayUrlRef.current = displayUrl;

  useEffect(() => {
    if (selectedUrl === displayUrlRef.current) return;

    // 1) 현재 모델 제거 (ModelScene unmount → releaseGltf)
    setDisplayUrl(null);

    let cancelled = false;
    let outerRaf = 0;
    let innerRaf = 0;
    let timer = 0;

    outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        // 2) GC·VRAM 정리 여유 (태블릿)
        timer = window.setTimeout(() => {
          if (!cancelled) setDisplayUrl(selectedUrl);
        }, 100);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      window.clearTimeout(timer);
    };
  }, [selectedUrl]);

  if (!displayUrl) return null;

  return <ModelScene key={displayUrl} url={displayUrl} />;
}
