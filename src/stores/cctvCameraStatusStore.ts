import { create } from "zustand";

import type { CctvCameraStatus } from "@/lib/cctvAlarm";

const SAFE_MS = 10_000;
const WARNING_MS_MIN = 8_000;
const WARNING_MS_MAX = 14_000;
const CRITICAL_MS_MIN = 6_000;
const CRITICAL_MS_MAX = 12_000;

type CctvCameraStatusState = {
  statusByName: Record<string, CctvCameraStatus>;
  /** 카메라 이름 등록 — 미등록 시 safe로 시작하고 랜덤 전이 스케줄 */
  registerCameras: (names: readonly string[]) => void;
};

const timers = new Map<string, number>();

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function durationFor(status: CctvCameraStatus): number {
  switch (status) {
    case "safe":
      return SAFE_MS;
    case "warning":
      return randBetween(WARNING_MS_MIN, WARNING_MS_MAX);
    case "critical":
      return randBetween(CRITICAL_MS_MIN, CRITICAL_MS_MAX);
  }
}

function pickNext(current: CctvCameraStatus): CctvCameraStatus {
  const options: CctvCameraStatus[] = ["safe", "warning", "critical"];
  // 동일 상태 연속 방지
  const pool = options.filter((s) => s !== current);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function scheduleTransition(
  name: string,
  get: () => CctvCameraStatusState,
  set: (
    partial:
      | Partial<CctvCameraStatusState>
      | ((s: CctvCameraStatusState) => Partial<CctvCameraStatusState>),
  ) => void,
) {
  const prev = timers.get(name);
  if (prev != null) window.clearTimeout(prev);

  const current = get().statusByName[name] ?? "safe";
  const delay = durationFor(current);

  const id = window.setTimeout(() => {
    const next = pickNext(get().statusByName[name] ?? "safe");
    set((state) => ({
      statusByName: { ...state.statusByName, [name]: next },
    }));
    scheduleTransition(name, get, set);
  }, delay);

  timers.set(name, id);
}

export const useCctvCameraStatusStore = create<CctvCameraStatusState>(
  (set, get) => ({
    statusByName: {},

    registerCameras: (names) => {
      const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
      if (unique.length === 0) return;

      set((state) => {
        const statusByName = { ...state.statusByName };
        for (const name of unique) {
          if (statusByName[name] == null) statusByName[name] = "safe";
        }
        return { statusByName };
      });

      for (const name of unique) {
        if (timers.has(name)) continue;
        // 첫 safe 구간을 2~10초로 어긋나게 시작해 동시 전환 방지
        const firstSafeMs = randBetween(2_000, SAFE_MS);
        const id = window.setTimeout(() => {
          const next = pickNext("safe");
          set((state) => ({
            statusByName: { ...state.statusByName, [name]: next },
          }));
          scheduleTransition(name, get, set);
        }, firstSafeMs);
        timers.set(name, id);
      }
    },
  }),
);

export function getCctvCameraStatus(cameraName: string): CctvCameraStatus {
  return useCctvCameraStatusStore.getState().statusByName[cameraName] ?? "safe";
}

export function useCctvCameraStatus(cameraName: string): CctvCameraStatus {
  return useCctvCameraStatusStore(
    (s) => s.statusByName[cameraName] ?? "safe",
  );
}
