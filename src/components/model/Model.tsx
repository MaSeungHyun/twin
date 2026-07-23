import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Light, Mesh, type Object3D, type WebGLRenderer } from "three";

import { useModelStore } from "@/stores/modelStore";
import { useLightBankStore, type DetachedLight } from "@/stores/lightBankStore";
import { dedupeGltfResources } from "@/three/dedupeGltf";
import { releaseGltf } from "@/three/disposeGltf";
import { convertRepeatedMeshesToInstanced } from "@/three/instancedMeshes";
import { applyTextureBudget } from "@/three/textureBudget";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";
import { isMobileDevice } from "@/lib/device";

/** scene 인스턴스당 1회만 전처리 (useGLTF 캐시 공유) */
const preparedScenes = new WeakSet<Object3D>();
const detachedLightsByScene = new WeakMap<Object3D, DetachedLight[]>();

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

/** 씬에서 분리만 하고 dispose 하지 않음 — 버튼으로 하나씩 재부착 */
function detachAllLights(root: Object3D): DetachedLight[] {
  const lights = collectLights(root);
  const entries: DetachedLight[] = [];

  for (const light of lights) {
    const parent = light.parent;
    if (!parent) continue;
    parent.remove(light);
    entries.push({ light, parent });
  }

  return entries;
}

function enableMeshShadows(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
}

/** primitive에 넣기 전 동기 전처리 */
function prepareScene(scene: Object3D, url: string) {
  if (preparedScenes.has(scene)) return scene;

  const lights = detachAllLights(scene);
  detachedLightsByScene.set(scene, lights);

  const dedupe = dedupeGltfResources(scene);
  const instancing = convertRepeatedMeshesToInstanced(scene);
  enableMeshShadows(scene);
  applyTextureBudget(scene, isMobileDevice() ? 1 : 2);

  console.log("[Model] Lights detached", { url, count: lights.length });
  console.log("[Model] Dedupe", { url, ...dedupe });
  console.log("[Model] Instancing", { url, ...instancing });
  preparedScenes.add(scene);
  return scene;
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

  // useEffect 후처리 X — render 단계에서 준비한 뒤 primitive에 전달
  const scene = useMemo(() => prepareScene(gltf.scene, url), [gltf.scene, url]);

  useEffect(() => {
    window.renderer = gl;
  }, [gl]);

  useEffect(() => {
    const entries = detachedLightsByScene.get(scene) ?? [];
    useLightBankStore.getState().setBank(entries);

    return () => {
      useLightBankStore.getState().reset();
    };
  }, [scene]);

  useEffect(() => {
    holdRef.current = {
      url,
      scene,
      gltf: { scene: gltf.scene, scenes: gltf.scenes },
    };
    invalidate();
    requestAnimationFrame(() => {
      if (holdRef.current?.url === url) {
        logRendererInfo("After load", gl, { url });
      }
    });
  }, [scene, gltf, invalidate, gl, url, holdRef]);

  const activeCount = useLightBankStore((s) => s.activeCount);
  useEffect(() => {
    invalidate();
  }, [activeCount, invalidate]);

  return <primitive object={scene} />;
}

/**
 * 언마운트(렌더 트리 제거) → 1프레임 → dispose → gap → load
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

    holdRef.current = null;
    flushSync(() => {
      setDisplayUrl(null);
    });

    let raf1 = 0;
    let raf2 = 0;
    let timer = 0;

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
