import { create } from "zustand";
import { GALLERY_MODELS, type GalleryModelId } from "@/assets/model";

export type Vec3 = [number, number, number];

export type CameraFocus = {
  id: GalleryModelId;
  target: Vec3;
  position: Vec3;
};

export const DEFAULT_GALLERY_ID: GalleryModelId =
  GALLERY_MODELS[0]?.id ?? "model_32";

type CameraState = {
  focuses: Partial<Record<GalleryModelId, CameraFocus>>;
  activeId: GalleryModelId;
  pendingSoloId: GalleryModelId | null;
  warmingId: GalleryModelId | null;
  soloId: GalleryModelId;
  goal: CameraFocus | null;
  isFlying: boolean;
  /** 최초 카메라 스냅 완료 여부 */
  didInitialSnap: boolean;
  registerFocus: (focus: CameraFocus) => void;
  notifyReady: (id: GalleryModelId) => void;
  flyTo: (id: GalleryModelId) => void;
  onArrive: () => void;
  markInitialSnap: () => void;
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
  activeId: DEFAULT_GALLERY_ID,
  pendingSoloId: null,
  warmingId: null,
  soloId: DEFAULT_GALLERY_ID,
  goal: null,
  isFlying: false,
  didInitialSnap: false,

  registerFocus: (focus) =>
    set((state) => ({
      focuses: { ...state.focuses, [focus.id]: focus },
    })),

  markInitialSnap: () => set({ didInitialSnap: true }),

  notifyReady: (id) => {
    const { warmingId, pendingSoloId, focuses, goal, isFlying } = get();
    const focus = focuses[id];
    if (!focus) return;
    if (warmingId === id && pendingSoloId === id && !goal && !isFlying) {
      set(startFlight(id, focus));
    }
  },

  flyTo: (id) => {
    const { soloId, focuses, isFlying } = get();
    if (isFlying || id === soloId) return;

    const focus = focuses[id];
    if (focus) {
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
      soloId: pendingSoloId,
      activeId: pendingSoloId,
      pendingSoloId: null,
      warmingId: null,
    });
  },

  reset: () =>
    set({
      focuses: {},
      activeId: DEFAULT_GALLERY_ID,
      pendingSoloId: null,
      warmingId: null,
      soloId: DEFAULT_GALLERY_ID,
      goal: null,
      isFlying: false,
      didInitialSnap: false,
    }),
}));
