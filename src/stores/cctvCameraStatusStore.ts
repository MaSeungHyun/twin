import { create } from "zustand";

import type { CctvCameraStatus } from "@/lib/cctvAlarm";

type CctvCameraStatusState = {
  /** 기본 상태 — 등록 시 safe, 알람이 없으면 유지 */
  statusByName: Record<string, CctvCameraStatus>;
  /** 활성 알람이 밀어 넣는 상태 (우선) */
  alarmStatusByName: Record<string, CctvCameraStatus>;
  aliasToName: Record<string, string>;
  registerCameras: (names: readonly string[]) => void;
  registerCameraAliases: (
    cameraName: string,
    aliases: readonly string[],
  ) => void;
  setAlarmStatusesByAlias: (
    statuses: Readonly<Record<string, CctvCameraStatus>>,
  ) => void;
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function statusRank(status: CctvCameraStatus): number {
  switch (status) {
    case "critical":
      return 2;
    case "warning":
      return 1;
    default:
      return 0;
  }
}

function maxStatus(
  current: CctvCameraStatus | undefined,
  next: CctvCameraStatus,
): CctvCameraStatus {
  if (!current) return next;
  return statusRank(next) > statusRank(current) ? next : current;
}

export const useCctvCameraStatusStore = create<CctvCameraStatusState>(
  (set, get) => ({
    statusByName: {},
    alarmStatusByName: {},
    aliasToName: {},

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
    },

    registerCameraAliases: (cameraName, aliases) => {
      const normalizedName = cameraName.trim();
      if (!normalizedName) return;

      set((state) => {
        const aliasToName = { ...state.aliasToName };
        aliasToName[normalizeKey(normalizedName)] = normalizedName;
        for (const alias of aliases) {
          const key = normalizeKey(alias);
          if (!key) continue;
          aliasToName[key] = normalizedName;
        }
        return { aliasToName };
      });
    },

    setAlarmStatusesByAlias: (statuses) => {
      const aliasToName = get().aliasToName;
      const alarmStatusByName: Record<string, CctvCameraStatus> = {};

      for (const [alias, status] of Object.entries(statuses)) {
        const cameraName = aliasToName[normalizeKey(alias)];
        if (!cameraName) continue;
        alarmStatusByName[cameraName] = maxStatus(
          alarmStatusByName[cameraName],
          status,
        );
      }

      set({ alarmStatusByName });
    },
  }),
);

export function getCctvCameraStatus(cameraName: string): CctvCameraStatus {
  const state = useCctvCameraStatusStore.getState();
  return (
    state.alarmStatusByName[cameraName] ??
    state.statusByName[cameraName] ??
    "safe"
  );
}

export function useCctvCameraStatus(cameraName: string): CctvCameraStatus {
  return useCctvCameraStatusStore(
    (s) =>
      s.alarmStatusByName[cameraName] ?? s.statusByName[cameraName] ?? "safe",
  );
}
