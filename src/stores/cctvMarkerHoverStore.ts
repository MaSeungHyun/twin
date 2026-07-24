import { create } from "zustand";
import {
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Vector3,
  type Camera,
} from "three";

type CctvMarkerHoverState = {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  clearHoveredId: (id: string) => void;
};

export const useCctvMarkerHoverStore = create<CctvMarkerHoverState>((set) => ({
  hoveredId: null,
  setHoveredId: (id) => set({ hoveredId: id }),
  clearHoveredId: (id) =>
    set((state) => (state.hoveredId === id ? { hoveredId: null } : state)),
}));

/** drei Html 기본 depth 정렬 범위 */
export const CCTV_MARKER_Z_INDEX_DEFAULT: [number, number] = [100, 0];

/** hover 시 다른 마커·UI 위로 올림 */
export const CCTV_MARKER_Z_INDEX_HOVER = 2_000_000;

const _objectPos = new Vector3();
const _cameraPos = new Vector3();

/** drei Html.objectZIndex 와 동일 */
export function computeCctvHtmlZIndex(
  object: Object3D,
  camera: Camera,
  zIndexRange: [number, number],
): number {
  if (
    !(camera instanceof PerspectiveCamera || camera instanceof OrthographicCamera)
  ) {
    return zIndexRange[0];
  }

  object.getWorldPosition(_objectPos);
  camera.getWorldPosition(_cameraPos);
  const dist = _objectPos.distanceTo(_cameraPos);
  const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near);
  const B = zIndexRange[1] - A * camera.far;
  return Math.round(A * dist + B);
}