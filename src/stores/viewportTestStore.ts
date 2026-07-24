import { create } from "zustand";

type ViewportTestState = {
  postProcessingEnabled: boolean;
  shadowsEnabled: boolean;
  antialiasEnabled: boolean;
  togglePostProcessing: () => void;
  toggleShadows: () => void;
  toggleAntialias: () => void;
};

export const useViewportTestStore = create<ViewportTestState>((set) => ({
  postProcessingEnabled: true,
  shadowsEnabled: true,
  antialiasEnabled: true,
  togglePostProcessing: () =>
    set((s) => ({ postProcessingEnabled: !s.postProcessingEnabled })),
  toggleShadows: () =>
    set((s) => ({ shadowsEnabled: !s.shadowsEnabled })),
  toggleAntialias: () =>
    set((s) => ({ antialiasEnabled: !s.antialiasEnabled })),
}));
