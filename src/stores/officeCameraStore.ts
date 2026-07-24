import { create } from "zustand";

import {
  OFFICE_CAMERA_IDS,
  type OfficeCameraId,
} from "@/three/officeCamera";

export type Vec3 = [number, number, number];
export type Quat4 = [number, number, number, number];

export type CameraProjection = {
  near: number;
  far: number;
  aspect: number;
  fov: number;
};

export type OfficeCameraView = {
  id: OfficeCameraId;
  label: string;
  sourceName: string;
  position: Vec3;
  rotation: Quat4;
  projection: CameraProjection;
  target: Vec3;
};

type OfficeCameraState = {
  cameraIds: OfficeCameraId[];
  views: Partial<Record<OfficeCameraId, OfficeCameraView>>;
  activeId: OfficeCameraId | null;
  goal: OfficeCameraView | null;
  isFlying: boolean;
  setViews: (views: OfficeCameraView[]) => void;
  flyTo: (id: OfficeCameraId) => void;
  onArrive: () => void;
};

export const useOfficeCameraStore = create<OfficeCameraState>((set, get) => ({
  cameraIds: [...OFFICE_CAMERA_IDS],
  views: {},
  activeId: null,
  goal: null,
  isFlying: false,

  setViews: (views) => {
    const viewsMap = Object.fromEntries(views.map((v) => [v.id, v])) as Partial<
      Record<OfficeCameraId, OfficeCameraView>
    >;
    set({
      cameraIds: [...OFFICE_CAMERA_IDS],
      views: viewsMap,
      activeId: null,
      goal: null,
      isFlying: false,
    });
    console.log(
      "[OfficeCamera] views",
      views.map((v) => ({ id: v.id, from: v.sourceName })),
    );
  },

  flyTo: (id) => {
    const { isFlying, views } = get();
    const view = views[id];
    if (!view || isFlying) return;
    set({ goal: view, isFlying: true, activeId: id });
  },

  onArrive: () => set({ goal: null, isFlying: false }),
}));

export { OFFICE_CAMERA_IDS };
