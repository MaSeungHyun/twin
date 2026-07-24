import { useEffect, useState } from "react";

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

    window.setTimeout(() => {
      if (get().suppressedUntil[cameraId] !== until) return;
      set((state) => {
        const next = { ...state.suppressedUntil };
        delete next[cameraId];
        return { suppressedUntil: next };
      });
    }, CCTV_ALARM_SUPPRESS_MS);
  },
}));

/** 억제 시간이 끝나면 리렌더되어 ring/배지가 다시 켜짐 */
export function useCctvAlarmActive(cameraId: string): boolean {
  const suppressedUntil = useCctvAlarmStore(
    (state) => state.suppressedUntil[cameraId] ?? null,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (suppressedUntil == null) return;
    const remaining = suppressedUntil - Date.now();
    if (remaining <= 0) {
      setNow(Date.now());
      return;
    }
    const timer = window.setTimeout(() => setNow(Date.now()), remaining + 16);
    return () => window.clearTimeout(timer);
  }, [suppressedUntil]);

  if (suppressedUntil == null) return true;
  return now >= suppressedUntil;
}
