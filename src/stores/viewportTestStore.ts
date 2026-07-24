import { create } from "zustand";

type ViewportTestState = {
  postProcessingEnabled: boolean;
  shadowsEnabled: boolean;
  togglePostProcessing: () => void;
  toggleShadows: () => void;
};

export const useViewportTestStore = create<ViewportTestState>((set) => ({
  postProcessingEnabled: true,
  shadowsEnabled: true,
  togglePostProcessing: () =>
    set((s) => ({ postProcessingEnabled: !s.postProcessingEnabled })),
  toggleShadows: () =>
    set((s) => ({ shadowsEnabled: !s.shadowsEnabled })),
}));
