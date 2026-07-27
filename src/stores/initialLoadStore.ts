import { create } from "zustand";

const MODEL_WEIGHT = 0.75;
const VIDEO_WEIGHT = 0.25;

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

type InitialLoadState = {
  modelProgress: number;
  videoProgress: number;
  dismissed: boolean;
  setModelProgress: (progress: number) => void;
  setVideoProgress: (progress: number) => void;
};

function tryDismiss(get: () => InitialLoadState, set: (partial: Partial<InitialLoadState>) => void) {
  const { modelProgress, videoProgress, dismissed } = get();
  if (dismissed) return;
  if (modelProgress < 100 || videoProgress < 100) return;
  if (dismissTimer) return;

  dismissTimer = setTimeout(() => {
    set({ dismissed: true });
    dismissTimer = null;
  }, 400);
}

export const useInitialLoadStore = create<InitialLoadState>((set, get) => ({
  modelProgress: 0,
  videoProgress: 0,
  dismissed: false,

  setModelProgress: (modelProgress) => {
    set({ modelProgress });
    tryDismiss(get, set);
  },

  setVideoProgress: (videoProgress) => {
    set({ videoProgress });
    tryDismiss(get, set);
  },
}));

export function useInitialLoadProgress(): number {
  const modelProgress = useInitialLoadStore((s) => s.modelProgress);
  const videoProgress = useInitialLoadStore((s) => s.videoProgress);
  return modelProgress * MODEL_WEIGHT + videoProgress * VIDEO_WEIGHT;
}

export function useInitialLoadVisible(): boolean {
  return useInitialLoadStore((s) => !s.dismissed);
}
