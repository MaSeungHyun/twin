import { create } from "zustand";

export type GpuPowerPreference = "high-performance" | "low-power";

type ViewportTestState = {
  postProcessingEnabled: boolean;
  shadowsEnabled: boolean;
  antialiasEnabled: boolean;
  gpuPowerPreference: GpuPowerPreference;
  togglePostProcessing: () => void;
  toggleShadows: () => void;
  toggleAntialias: () => void;
  toggleGpuPowerPreference: () => void;
};

export const useViewportTestStore = create<ViewportTestState>((set) => ({
  postProcessingEnabled: true,
  shadowsEnabled: true,
  antialiasEnabled: true,
  gpuPowerPreference: "high-performance",
  togglePostProcessing: () =>
    set((s) => ({ postProcessingEnabled: !s.postProcessingEnabled })),
  toggleShadows: () =>
    set((s) => ({ shadowsEnabled: !s.shadowsEnabled })),
  toggleAntialias: () =>
    set((s) => ({ antialiasEnabled: !s.antialiasEnabled })),
  toggleGpuPowerPreference: () =>
    set((s) => ({
      gpuPowerPreference:
        s.gpuPowerPreference === "high-performance"
          ? "low-power"
          : "high-performance",
    })),
}));
