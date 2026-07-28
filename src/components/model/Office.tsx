import { Suspense, useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { Group } from "three";

import model from "@/assets/model/Seperate_Office.glb";
import {
  getCctvMarkerVideoByIndex,
  getCctvPopupVideoByIndex,
  getCctvVideoTitleByIndex,
} from "@/data/officeCameraVideos";
import { useInitialLoadStore } from "@/stores/initialLoadStore";
import { useCctvCameraStatusStore } from "@/stores/cctvCameraStatusStore";
import { useCctvOverlayStore } from "@/stores/cctvOverlayStore";
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
import {
  buildOfficeFloorInstances,
  disposeOfficeFloorInstances,
} from "@/three/officeFloorInstancing";
import { ensureOfficeFloorRoot } from "@/three/officeFloorRoot";
import { prepareOfficeScene } from "@/three/prepareOfficeScene";

import CctvAnchorBinder from "../viewport/CctvAnchorBinder";
import CctvProjectionSync from "../viewport/CctvProjectionSync";
import CctvFloorHeatmap from "./CctvFloorHeatmap";

function OfficeModel() {
  const group = useRef<Group>(null);
  const floorLayoutRef = useRef<OfficeFloorLayout | null>(null);

  const gltf = useGLTF(
    model,
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  );

  const scene = useMemo(() => {
    const instance = gltf.scene.clone(true);
    prepareOfficeScene(instance);
    ensureOfficeFloorRoot(instance);
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
  const setOverlayMarkers = useCctvOverlayStore((s) => s.setMarkers);
  const clearOverlayMarkers = useCctvOverlayStore((s) => s.clearMarkers);

  const cctvMarkers = useMemo(() => collectCctvMarkers(scene), [scene]);

  useEffect(() => {
    useCctvCameraStatusStore
      .getState()
      .registerCameras(cctvMarkers.map((m) => m.name));
  }, [cctvMarkers]);

  useEffect(() => {
    setOverlayMarkers(
      cctvMarkers.map((marker, index) => ({
        id: marker.id,
        markerName: marker.name,
        floor: marker.floor,
        videoTitle: getCctvVideoTitleByIndex(index),
        videoSrc: getCctvMarkerVideoByIndex(index),
        videoSrcFull: getCctvPopupVideoByIndex(index),
      })),
    );
    return () => clearOverlayMarkers();
  }, [cctvMarkers, clearOverlayMarkers, setOverlayMarkers]);

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
    if (floorObjects.size === 0) {
      setAvailableFloorActions([]);
      setActiveFloorAction(null);
      return;
    }

    const frameId = requestAnimationFrame(() => {
      disposeOfficeFloorLayout(floorLayoutRef.current);

      const layout = createOfficeFloorLayout(scene, floorObjects);
      floorLayoutRef.current = layout;

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
      disposeOfficeFloorInstances(scene);
      scene.removeFromParent();
    };
  }, [scene]);

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
      <CctvProjectionSync />
      <primitive object={scene} />
      <CctvFloorHeatmap
        sceneRoot={scene}
        markers={cctvMarkers}
        floorObjects={floorObjects}
      />
      {cctvMarkers.map((marker) => (
        <CctvAnchorBinder
          key={marker.id}
          id={marker.id}
          anchor={marker.node}
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
