import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Light, type Object3D, type WebGLRenderer } from "three";

import { useModelStore } from "@/stores/modelStore";
import { dedupeGltfResources } from "@/three/dedupeGltf";
import { releaseGltf } from "@/three/disposeGltf";
import { convertRepeatedMeshesToInstanced } from "@/three/instancedMeshes";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";

declare global {
  interface Window {
    renderer?: WebGLRenderer;
  }
}

function logRendererInfo(label: string, gl: WebGLRenderer, extra?: object) {
  const { memory, render, programs } = gl.info;
  console.log(`[Model] ${label}`, {
    geometries: memory.geometries,
    textures: memory.textures,
    calls: render.calls,
    triangles: render.triangles,
    programs: programs?.length ?? 0,
    ...extra,
  });
}

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

type SceneHold = {
  url: string;
  scene: Object3D;
  gltf: { scene: Object3D; scenes: Object3D[] };
};

function ModelScene({
  url,
  holdRef,
}: {
  url: string;
  holdRef: React.MutableRefObject<SceneHold | null>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl) as WebGLRenderer;
  const gltf = useGLTF(url, GLTF_USE_DRACO, GLTF_USE_MESHOPT, extendGltfLoader);

  console.log(gltf);

  const { scene } = gltf;
  const readyLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    window.renderer = gl;
  }, [gl]);

  useEffect(() => {
    holdRef.current = {
      url,
      scene,
      gltf: { scene: gltf.scene, scenes: gltf.scenes },
    };
    stripAllLights(scene);

    if (readyLoggedRef.current !== url) {
      readyLoggedRef.current = url;
      const dedupe = dedupeGltfResources(scene);
      const instancing = convertRepeatedMeshesToInstanced(scene);
      console.log("[Model] Dedupe", { url, ...dedupe });
      console.log("[Model] Instancing", { url, ...instancing });
      invalidate();
      requestAnimationFrame(() => {
        if (holdRef.current?.url === url) {
          logRendererInfo("After load", gl, { url });
        }
      });
    } else {
      invalidate();
    }
  }, [scene, gltf, invalidate, gl, url, holdRef]);

  return <primitive object={scene} />;
}

/**
 * 언마운트(렌더 트리 제거) → 1프레임 → dispose → gap → load
 * dispose를 먼저 하면 같은 프레임 렌더가 disposed geo를 다시 upload함
 */
export default function Model() {
  const selectedUrl = useModelStore((s) => s.selectedUrl);
  const [displayUrl, setDisplayUrl] = useState<string | null>(selectedUrl);
  const displayUrlRef = useRef(displayUrl);
  const holdRef = useRef<SceneHold | null>(null);
  const switchIdRef = useRef(0);
  displayUrlRef.current = displayUrl;

  useEffect(() => {
    if (selectedUrl === displayUrlRef.current) return;

    const switchId = ++switchIdRef.current;
    const prevUrl = displayUrlRef.current;
    const gl = window.renderer;
    const held = holdRef.current;

    if (gl) {
      logRendererInfo("Before switch", gl, { from: prevUrl, to: selectedUrl });
    }

    // 1) 먼저 React 트리에서 제거 (더 이상 렌더되지 않음)
    holdRef.current = null;
    flushSync(() => {
      setDisplayUrl(null);
    });

    let raf1 = 0;
    let raf2 = 0;
    let timer = 0;

    // 2) 커밋·렌더 1프레임 지난 뒤 dispose (재upload 방지)
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (switchId !== switchIdRef.current) return;

        if (held) {
          const disposed = releaseGltf(held.url, held.scene, held.gltf);
          gl?.renderLists?.dispose?.();
          console.log("[Model] Disposed resources", disposed);
        } else {
          console.warn("[Model] holdRef empty on switch", { prevUrl });
        }

        if (gl) {
          logRendererInfo("After dispose", gl, { disposed: prevUrl });
        }

        // 3) GC 여유 후 새 모델 로드
        timer = window.setTimeout(() => {
          if (switchId !== switchIdRef.current) return;
          if (window.renderer) {
            logRendererInfo("Before load", window.renderer, {
              next: selectedUrl,
            });
          }
          setDisplayUrl(selectedUrl);
        }, 100);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [selectedUrl]);

  if (!displayUrl) return null;

  return <ModelScene key={displayUrl} url={displayUrl} holdRef={holdRef} />;
}
