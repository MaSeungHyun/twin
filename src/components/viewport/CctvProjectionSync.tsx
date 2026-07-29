import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Vector3,
  type Camera,
} from "three";

import { CCTV_MARKER_LIFT_Y } from "@/data/cctvMarkerOffsets";
import { worldToScreen } from "@/lib/cctvLeaderLine";
import {
  resolveCctvHtmlMarkerLayout,
  updateCctvHtmlMarker,
} from "@/lib/cctvHtmlLayout";
import { matchesCctvMarkerZone } from "@/lib/zones";
import {
  CCTV_MARKER_Z_INDEX_DEFAULT,
  CCTV_MARKER_Z_INDEX_HOVER,
  useCctvMarkerHoverStore,
} from "@/stores/cctvMarkerHoverStore";
import { useCctvPopupStore } from "@/stores/cctvPopupStore";
import {
  getCctvOverlayAnchors,
  useCctvOverlayStore,
} from "@/stores/cctvOverlayStore";
import { useOfficeStore } from "@/stores/officeStore";
import { useUiStore } from "@/stores/uiStore";

const _markerWorld = new Vector3();
const _cameraWorld = new Vector3();
const _camPos = new Vector3();
const _camPosPrev = new Vector3();
const _camQuat = new Quaternion();
const _camQuatPrev = new Quaternion();
const _ndcMarker = new Vector3();
const _ndcCamera = new Vector3();

/** 카메라가 이보다 덜 움직이면 투영을 2프레임에 1회 */
const MOVE_EPS = 2e-4;
const QUAT_EPS = 1e-6;

function computeDistanceZIndex(
  worldPos: Vector3,
  camera: Camera,
  zIndexRange: [number, number],
): number {
  if (
    !(
      camera instanceof PerspectiveCamera ||
      camera instanceof OrthographicCamera
    )
  ) {
    return zIndexRange[0];
  }

  camera.getWorldPosition(_camPos);
  const dist = worldPos.distanceTo(_camPos);
  const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near);
  const B = zIndexRange[1] - A * camera.far;
  return Math.round(A * dist + B);
}

/**
 * Canvas 내부 — 3D 앵커 → 스크린 좌표 투영 후 React 오버레이 레이아웃에 반영.
 * 카메라 정지 시 투영은 2프레임에 1회, 레이아웃 보간은 매 프레임.
 */
export default function CctvProjectionSync() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const markers = useCctvOverlayStore((s) => s.markers);
  const frameRef = useRef(0);
  const camInitialized = useRef(false);

  useFrame(() => {
    frameRef.current += 1;
    const office = useOfficeStore.getState();
    const popupOpen = useCctvPopupStore.getState().isOpen;

    if (popupOpen || office.floorCommand !== null) {
      for (const marker of markers) {
        updateCctvHtmlMarker(marker.id, { active: false });
      }
      return;
    }

    const activeFloor = office.activeFloorAction;
    if (activeFloor == null) {
      for (const marker of markers) {
        updateCctvHtmlMarker(marker.id, { active: false });
      }
      resolveCctvHtmlMarkerLayout(size);
      return;
    }

    const selectedZoneId = useUiStore.getState().selectedZoneId;
    const showAllFloors = activeFloor === "Default";

    camera.getWorldPosition(_camPos);
    camera.getWorldQuaternion(_camQuat);

    let cameraMoved = true;
    if (camInitialized.current) {
      cameraMoved =
        _camPos.distanceToSquared(_camPosPrev) > MOVE_EPS * MOVE_EPS ||
        Math.abs(_camQuat.dot(_camQuatPrev)) < 1 - QUAT_EPS;
    }
    camInitialized.current = true;
    _camPosPrev.copy(_camPos);
    _camQuatPrev.copy(_camQuat);

    const shouldProject = cameraMoved || frameRef.current % 2 === 0;

    if (shouldProject) {
      const anchors = getCctvOverlayAnchors();
      const hoveredId = useCctvMarkerHoverStore.getState().hoveredId;

      for (const marker of markers) {
        const floorOk = showAllFloors || marker.floor === activeFloor;
        const zoneOk = matchesCctvMarkerZone(marker.videoTitle, selectedZoneId);
        if (!floorOk || !zoneOk) {
          updateCctvHtmlMarker(marker.id, { active: false });
          continue;
        }

        const anchor = anchors.get(marker.id);
        if (!anchor) continue;

        // R3F 렌더 후 matrixWorld는 이미 갱신됨 — 전체 트리 재계산 생략
        anchor.getWorldPosition(_cameraWorld);
        _markerWorld.copy(_cameraWorld);
        _markerWorld.y += CCTV_MARKER_LIFT_Y;

        _ndcMarker.copy(_markerWorld).project(camera);
        const screen = worldToScreen(
          _ndcMarker.x,
          _ndcMarker.y,
          _ndcMarker.z,
          size,
        );

        _ndcCamera.copy(_cameraWorld).project(camera);
        const cameraScreen = worldToScreen(
          _ndcCamera.x,
          _ndcCamera.y,
          _ndcCamera.z,
          size,
        );

        const zIndex =
          hoveredId === marker.id
            ? CCTV_MARKER_Z_INDEX_HOVER
            : computeDistanceZIndex(
                _markerWorld,
                camera,
                CCTV_MARKER_Z_INDEX_DEFAULT,
              );

        updateCctvHtmlMarker(marker.id, {
          active: true,
          anchorX: screen.x,
          anchorY: screen.y,
          lineStartX: cameraScreen.x - screen.x,
          lineStartY: cameraScreen.y - screen.y,
          showLine: screen.offScreen || CCTV_MARKER_LIFT_Y > 0,
          zIndex,
        });
      }
    }

    // sep 보간은 매 프레임 유지
    resolveCctvHtmlMarkerLayout(size);
  }, 1);

  return null;
}
