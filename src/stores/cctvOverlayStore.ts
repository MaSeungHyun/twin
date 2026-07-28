import type { Object3D } from "three";

import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";
import { create } from "zustand";

export type CctvOverlayMarkerDef = {
  id: string;
  markerName: string;
  videoTitle: string;
  /** 오버레이 카드용 저화질 */
  videoSrc: string;
  /** 팝업 확대용 고화질 */
  videoSrcFull: string;
  floor: OfficeFloorObjectKey | null;
};

type CctvOverlayState = {
  markers: CctvOverlayMarkerDef[];
  setMarkers: (markers: CctvOverlayMarkerDef[]) => void;
  clearMarkers: () => void;
};

/** React 오버레이용 마커 메타 (3D 앵커는 registry에 별도 등록) */
export const useCctvOverlayStore = create<CctvOverlayState>((set) => ({
  markers: [],
  setMarkers: (markers) => set({ markers }),
  clearMarkers: () => set({ markers: [] }),
}));

/** Canvas 내부 Object3D 앵커 — 투영용 */
const anchors = new Map<string, Object3D>();

export function registerCctvOverlayAnchor(id: string, anchor: Object3D) {
  anchors.set(id, anchor);
}

export function unregisterCctvOverlayAnchor(id: string) {
  anchors.delete(id);
}

export function getCctvOverlayAnchor(id: string): Object3D | undefined {
  return anchors.get(id);
}

export function getCctvOverlayAnchors(): ReadonlyMap<string, Object3D> {
  return anchors;
}
