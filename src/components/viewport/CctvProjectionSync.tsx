import { useFrame, useThree } from "@react-three/fiber";
import {
  OrthographicCamera,
  PerspectiveCamera,
  Vector3,
  type Camera,
} from "three";

import { CCTV_MARKER_LIFT_Y } from "@/data/cctvMarkerOffsets";
import { worldToScreen } from "@/lib/cctvLeaderLine";
import {
  resolveCctvHtmlMarkerLayout,
  updateCctvHtmlMarker,
} from "@/lib/cctvHtmlLayout";
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
import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";

const _markerWorld = new Vector3();
const _cameraWorld = new Vector3();
const _camPos = new Vector3();
const _ndcMarker = new Vector3();
const _ndcCamera = new Vector3();

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

function isMarkerVisibleByFloor(
  floor: OfficeFloorObjectKey | null,
  activeFloorAction: string | null,
  floorCommand: string | null,
): boolean {
  if (floorCommand !== null) return false;
  return (
    activeFloorAction != null &&
    activeFloorAction !== "Default" &&
    floor != null &&
    activeFloorAction === floor
  );
}

/**
 * Canvas 내부 — 3D 앵커 → 스크린 좌표 투영 후 React 오버레이 레이아웃에 반영.
 */
export default function CctvProjectionSync() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const markers = useCctvOverlayStore((s) => s.markers);

  useFrame(() => {
    const anchors = getCctvOverlayAnchors();
    const office = useOfficeStore.getState();
    const popupOpen = useCctvPopupStore.getState().isOpen;
    const hoveredId = useCctvMarkerHoverStore.getState().hoveredId;

    for (const marker of markers) {
      const anchor = anchors.get(marker.id);
      if (!anchor) continue;

      const floorVisible = isMarkerVisibleByFloor(
        marker.floor,
        office.activeFloorAction,
        office.floorCommand,
      );

      if (!floorVisible || popupOpen) {
        updateCctvHtmlMarker(marker.id, { active: false });
        continue;
      }

      anchor.updateWorldMatrix(true, false);
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

    resolveCctvHtmlMarkerLayout(size);
  }, 1);

  return null;
}
