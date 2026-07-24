import { create } from "zustand";

export const CCTV_ALARM_SUPPRESS_MS = 10_000;

type CctvAlarmState = {
  suppressedUntil: Record<string, number>;
  dismiss: (cameraId: string) => void;
};

export const useCctvAlarmStore = create<CctvAlarmState>((set, get) => ({
  suppressedUntil: {},

  dismiss: (cameraId) => {
    const until = Date.now() + CCTV_ALARM_SUPPRESS_MS;
    set((state) => ({
      suppressedUntil: { ...state.suppressedUntil, [cameraId]: until },
    }));

    setTimeout(() => {
      if (get().suppressedUntil[cameraId] !== until) return;
      set((state) => {
        const next = { ...state.suppressedUntil };
        delete next[cameraId];
        return { suppressedUntil: next };
      });
    }, CCTV_ALARM_SUPPRESS_MS);
  },
}));

export function useCctvAlarmActive(cameraId: string): boolean {
  const suppressedUntil = useCctvAlarmStore(
    (state) => state.suppressedUntil[cameraId],
  );
  return suppressedUntil == null || Date.now() >= suppressedUntil;
}
