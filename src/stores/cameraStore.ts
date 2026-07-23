import { create } from "zustand";
import type { GalleryModelId } from "@/assets/model";

export type Vec3 = [number, number, number];

export type CameraFocus = {
  id: GalleryModelId;
  target: Vec3;
  position: Vec3;
};

type ViewMode = "overview" | "solo";

type CameraState = {
  focuses: Partial<Record<GalleryModelId, CameraFocus>>;
  activeId: GalleryModelId | null;
  pendingSoloId: GalleryModelId | null;
  warmingId: GalleryModelId | null;
  viewMode: ViewMode;
  soloId: GalleryModelId | null;
  goal: CameraFocus | null;
  isFlying: boolean;
  registerFocus: (focus: CameraFocus) => void;
  notifyReady: (id: GalleryModelId) => void;
  flyTo: (id: GalleryModelId) => void;
  onArrive: () => void;
  showOverview: () => void;
  reset: () => void;
};

function startFlight(id: GalleryModelId, focus: CameraFocus) {
  return {
    activeId: id,
    pendingSoloId: id,
    warmingId: null as GalleryModelId | null,
    goal: { ...focus },
    isFlying: true,
  };
}

export const useCameraStore = create<CameraState>((set, get) => ({
  focuses: {},
  activeId: null,
  pendingSoloId: null,
  warmingId: null,
  viewMode: "overview",
  soloId: null,
  goal: null,
  isFlying: false,

  registerFocus: (focus) =>
    set((state) => ({
      focuses: { ...state.focuses, [focus.id]: focus },
    })),

  notifyReady: (id) => {
    const { warmingId, pendingSoloId, focuses, goal, isFlying } = get();
    const focus = focuses[id];
    if (!focus) return;
    if (warmingId === id && pendingSoloId === id && !goal && !isFlying) {
      set(startFlight(id, focus));
    }
  },

  flyTo: (id) => {
    const focus = get().focuses[id];
    if (focus) {
      // 이미 로드·포커스된 모델 → 즉시 비행 (재요청 없음)
      set(startFlight(id, focus));
      return;
    }
    set({
      activeId: id,
      pendingSoloId: id,
      warmingId: id,
      goal: null,
      isFlying: false,
    });
  },

  onArrive: () => {
    const { pendingSoloId } = get();
    if (!pendingSoloId) {
      set({ goal: null, isFlying: false });
      return;
    }
    set({
      goal: null,
      isFlying: false,
      viewMode: "solo",
      soloId: pendingSoloId,
      pendingSoloId: null,
      warmingId: null,
    });
  },

  showOverview: () => {
    set({
      viewMode: "overview",
      soloId: null,
      pendingSoloId: null,
      warmingId: null,
      activeId: null,
      goal: null,
      isFlying: false,
    });
  },

  reset: () =>
    set({
      focuses: {},
      activeId: null,
      pendingSoloId: null,
      warmingId: null,
      viewMode: "overview",
      soloId: null,
      goal: null,
      isFlying: false,
    }),
}));
