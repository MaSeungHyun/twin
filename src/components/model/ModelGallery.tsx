import { Suspense, useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Mesh,
  type Group,
  type Material,
  type Object3D,
} from "three";

import {
  GALLERY_MODELS,
  getModelUrl,
  type GalleryModelId,
} from "@/assets/model";
import { isMobileDevice } from "@/lib/device";
import { useCameraStore } from "@/stores/cameraStore";
import { dedupeGltfResources } from "@/three/dedupeGltf";
import { convertRepeatedMeshesToInstanced } from "@/three/instancedMeshes";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";
import { applyTextureBudget } from "@/three/textureBudget";

import { computeFocusFromObject } from "../viewport/CameraFlyer";

/** 앱 시작 시 갤러리 GLB 전부 프리로드 (클릭 전에 받기) */
for (const model of GALLERY_MODELS) {
  useGLTF.preload(
    getModelUrl(model.id),
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  );
}

const preparedScenes = new WeakSet<Object3D>();

type MatBackup = { opacity: number; transparent: boolean };
const matBackup = new WeakMap<Material, MatBackup>();

function enableMeshShadows(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
}

/** GLB 라이트는 제한 없이 유지 */
function prepareScene(scene: Object3D, url: string) {
  if (preparedScenes.has(scene)) return scene;

  dedupeGltfResources(scene);
  convertRepeatedMeshesToInstanced(scene);
  enableMeshShadows(scene);
  applyTextureBudget(scene, isMobileDevice() ? 1 : 2);

  console.log("[Gallery] prepared", { url });
  preparedScenes.add(scene);
  return scene;
}

function applyDim(root: Object3D, dim: number) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    const mesh = obj as Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      if (!matBackup.has(mat)) {
        matBackup.set(mat, {
          opacity: mat.opacity,
          transparent: mat.transparent,
        });
      }
      const backup = matBackup.get(mat)!;
      mat.transparent = dim < 0.999 || backup.transparent;
      mat.opacity = backup.opacity * dim;
      mat.depthWrite = dim > 0.9;
      mat.needsUpdate = true;
    }
  });
}

function restoreDim(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    const mesh = obj as Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      const backup = matBackup.get(mat);
      if (!backup) continue;
      mat.opacity = backup.opacity;
      mat.transparent = backup.transparent;
      mat.depthWrite = true;
      mat.needsUpdate = true;
    }
  });
}

function GalleryModel({
  id,
  position,
  dimTarget,
  shown,
}: {
  id: GalleryModelId;
  position: [number, number, number];
  dimTarget: number;
  shown: boolean;
}) {
  const url = getModelUrl(id);
  const groupRef = useRef<Group>(null);
  const dimRef = useRef(1);
  const invalidate = useThree((s) => s.invalidate);
  const gltf = useGLTF(url, GLTF_USE_DRACO, GLTF_USE_MESHOPT, extendGltfLoader);
  const scene = useMemo(() => prepareScene(gltf.scene, url), [gltf.scene, url]);
  const registerFocus = useCameraStore((s) => s.registerFocus);
  const notifyReady = useCameraStore((s) => s.notifyReady);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const raf = requestAnimationFrame(() => {
      registerFocus(computeFocusFromObject(id, group));
      notifyReady(id);
      invalidate();
    });
    return () => cancelAnimationFrame(raf);
  }, [id, scene, position, registerFocus, notifyReady, invalidate]);

  useFrame((_, delta) => {
    if (!shown) return;
    const next =
      dimRef.current +
      (dimTarget - dimRef.current) * Math.min(1, delta * 3.2);
    if (
      Math.abs(next - dimRef.current) < 0.002 &&
      Math.abs(next - dimTarget) < 0.002
    ) {
      if (dimRef.current !== dimTarget) {
        dimRef.current = dimTarget;
        if (dimTarget >= 0.999) restoreDim(scene);
        else applyDim(scene, dimTarget);
      }
      return;
    }
    dimRef.current = next;
    applyDim(scene, next);
  });

  return (
    <group ref={groupRef} position={position} visible={shown}>
      <primitive object={scene} />
    </group>
  );
}

/** 활성·비행 대상만 표시. 나머지는 마운트/로드 유지 + visible=false */
function isShown(
  id: GalleryModelId,
  soloId: GalleryModelId,
  pendingSoloId: GalleryModelId | null,
  activeId: GalleryModelId,
  isFlying: boolean,
): boolean {
  if (isFlying) {
    return id === soloId || id === pendingSoloId || id === activeId;
  }
  return id === soloId;
}

export default function ModelGallery() {
  const soloId = useCameraStore((s) => s.soloId);
  const pendingSoloId = useCameraStore((s) => s.pendingSoloId);
  const isFlying = useCameraStore((s) => s.isFlying);
  const activeId = useCameraStore((s) => s.activeId);

  useEffect(() => {
    return () => {
      useCameraStore.getState().reset();
    };
  }, []);

  return (
    <>
      {GALLERY_MODELS.map((model) => {
        const shown = isShown(
          model.id,
          soloId,
          pendingSoloId,
          activeId,
          isFlying,
        );
        const keepFull =
          model.id === activeId ||
          model.id === pendingSoloId ||
          model.id === soloId;
        const dimTarget = isFlying && shown && !keepFull ? 0.12 : 1;

        return (
          <Suspense key={model.id} fallback={null}>
            <GalleryModel
              id={model.id}
              position={model.position}
              dimTarget={dimTarget}
              shown={shown}
            />
          </Suspense>
        );
      })}
    </>
  );
}
