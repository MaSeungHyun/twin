import { Suspense, useEffect, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { Group, LoopOnce, Mesh } from "three";

import model from "@/assets/model/Seperate_Office.glb";
import { useOfficeCameraStore } from "@/stores/officeCameraStore";
import { useOfficeStore } from "@/stores/officeStore";
import {
  collectOfficeCameras,
} from "@/three/officeCamera";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";

const ACTION_NAME = "cellingAction";

function OfficeModel() {
  const group = useRef<Group>(null);
  const gltf = useGLTF(
    model,
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  );

  const applyShadow = () => {
    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  useEffect(() => {
    applyShadow();
  }, [gltf.scene]);
  
  const { actions, mixer } = useAnimations(gltf.animations, group);

  const ceilingCommand = useOfficeStore((s) => s.ceilingCommand);
  const clearCeilingCommand = useOfficeStore((s) => s.clearCeilingCommand);
  const setCeilingOpen = useOfficeStore((s) => s.setCeilingOpen);
  const setViews = useOfficeCameraStore((s) => s.setViews);

  useEffect(() => {
    setViews(collectOfficeCameras(gltf.scene));
  }, [gltf.scene, setViews]);

  useEffect(() => {
    const action = actions[ACTION_NAME];
    if (!action) return;

    action.clampWhenFinished = true;
    action.setLoop(LoopOnce, 1);
    action.play();
    action.paused = true;
    action.time = 0;
  }, [actions]);

  useEffect(() => {
    if (!mixer) return;

    const onFinished = (event: {
      action: { getClip: () => { name: string } };
    }) => {
      if (event.action.getClip().name !== ACTION_NAME) return;
      const action = actions[ACTION_NAME];
      if (!action) return;

      const open = action.timeScale >= 0;
      setCeilingOpen(open);
      clearCeilingCommand();
    };

    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [actions, mixer, clearCeilingCommand, setCeilingOpen]);

  useEffect(() => {
    const action = actions[ACTION_NAME];
    if (!action || !ceilingCommand) return;

    action.clampWhenFinished = true;
    action.setLoop(LoopOnce, 1);
    action.paused = false;

    if (ceilingCommand === "open") {
      action.timeScale = 1;
      action.play();
      return;
    }

    action.timeScale = -1;
    if (action.time <= 0) {
      action.time = action.getClip().duration;
    }
    action.play();
  }, [actions, ceilingCommand]);

  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}

export default function Office() {
  return (
    <Suspense fallback={null}>
      <OfficeModel />
    </Suspense>
  );
}

useGLTF.clear(model);
useGLTF.preload(model, GLTF_USE_DRACO, GLTF_USE_MESHOPT, extendGltfLoader);
