import { Suspense, useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { Group } from "three";

import model from "@/assets/model/Seperate_Office.glb";
import { getCctvVideoByIndex, getCctvVideoTitleByIndex } from "@/data/officeCameraVideos";
import { useInitialLoadStore } from "@/stores/initialLoadStore";
import { useOfficeCameraStore } from "@/stores/officeCameraStore";
import { useOfficeStore } from "@/stores/officeStore";
import { collectCctvMarkers } from "@/three/cctvMarkers";
import {
  animateOfficeFloorLayout,
  createOfficeFloorLayout,
  disposeOfficeFloorLayout,
  getAvailableFloorActions,
  type OfficeFloorLayout,
} from "@/three/officeFloorGsap";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";
import { collectOfficeCameras } from "@/three/officeCamera";
import { collectOfficeFloorObjects } from "@/three/officeFloorVisibility";
import { ensureOfficeFloorClones } from "@/three/officeFloorClones";
import { buildOfficeFloorInstances } from "@/three/officeFloorInstancing";
import { prepareOfficeScene } from "@/three/prepareOfficeScene";

import CctvHtmlLayoutSync from "../viewport/CctvHtmlLayoutSync";
import CameraWithVideo from "./CameraWithVideo";

function OfficeModel() {
  const group = useRef<Group>(null);
  const floorLayoutRef = useRef<OfficeFloorLayout | null>(null);
  const floorLayoutReadyRef = useRef(false);

  const gltf = useGLTF(
    model,
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  );

  const scene = useMemo(() => {
    const instance = gltf.scene.clone(true);
    prepareOfficeScene(instance);
    if (!buildOfficeFloorInstances(instance)) {
      ensureOfficeFloorClones(instance);
    }
    return instance;
  }, [gltf.scene]);

  const floorCommand = useOfficeStore((s) => s.floorCommand);
  const clearFloorCommand = useOfficeStore((s) => s.clearFloorCommand);
  const setActiveFloorAction = useOfficeStore((s) => s.setActiveFloorAction);
  const setAvailableFloorActions = useOfficeStore(
    (s) => s.setAvailableFloorActions,
  );
  const setViews = useOfficeCameraStore((s) => s.setViews);
  const setModelProgress = useInitialLoadStore((s) => s.setModelProgress);

  const cctvMarkers = useMemo(
    () => collectCctvMarkers(scene),
    [scene],
  );

  const floorObjects = useMemo(
    () => collectOfficeFloorObjects(scene),
    [scene],
  );

  useEffect(() => {
    setModelProgress(100);
  }, [scene, setModelProgress]);

  useEffect(() => {
    setViews(collectOfficeCameras(scene));
  }, [scene, setViews]);

  useEffect(() => {
    floorLayoutReadyRef.current = false;
    floorLayoutRef.current = null;

    if (floorObjects.size === 0) {
      setAvailableFloorActions([]);
      setActiveFloorAction(null);
      return;
    }

    const frameId = requestAnimationFrame(() => {
      disposeOfficeFloorLayout(floorLayoutRef.current);

      const layout = createOfficeFloorLayout(scene, floorObjects);
      floorLayoutRef.current = layout;
      floorLayoutReadyRef.current = layout !== null;

      setAvailableFloorActions(getAvailableFloorActions(floorObjects));
      setActiveFloorAction(layout ? "Default" : null);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    floorObjects,
    scene,
    setActiveFloorAction,
    setAvailableFloorActions,
  ]);

  useEffect(() => {
    return () => {
      disposeOfficeFloorLayout(floorLayoutRef.current);
      floorLayoutRef.current = null;
      floorLayoutReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!floorCommand) return;

    const layout = floorLayoutRef.current;
    if (!layout) {
      clearFloorCommand();
      return;
    }

    animateOfficeFloorLayout(layout, floorCommand, () => {
      setActiveFloorAction(floorCommand);
      clearFloorCommand();
    });
  }, [clearFloorCommand, floorCommand, setActiveFloorAction]);

  return (
    <group ref={group}>
      <CctvHtmlLayoutSync />
      <primitive object={scene} />
      {cctvMarkers.map((marker, index) => (
        <CameraWithVideo
          key={marker.id}
          anchor={marker.node}
          floor={marker.floor}
          markerName={marker.name}
          videoTitle={getCctvVideoTitleByIndex(index)}
          videoSrc={getCctvVideoByIndex(index)}
        />
      ))}
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
