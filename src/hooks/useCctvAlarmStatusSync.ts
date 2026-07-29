import { useEffect } from "react";

import type { CctvCameraStatus } from "@/lib/cctvAlarm";
import { useAlarmStore } from "@/stores/alarmStore";
import { useCctvCameraStatusStore } from "@/stores/cctvCameraStatusStore";
import type { Severity } from "@/types/common";

function severityToCameraStatus(
  severity: Severity,
): CctvCameraStatus | null {
  switch (severity) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "warning";
    default:
      return null;
  }
}

function rank(status: CctvCameraStatus): number {
  switch (status) {
    case "critical":
      return 2;
    case "warning":
      return 1;
    default:
      return 0;
  }
}

function mergeStatus(
  target: Record<string, CctvCameraStatus>,
  key: string,
  next: CctvCameraStatus,
) {
  const current = target[key];
  if (!current || rank(next) > rank(current)) {
    target[key] = next;
  }
}

export function useCctvAlarmStatusSync() {
  const alarms = useAlarmStore((state) => state.items);

  useEffect(() => {
    const nextByAlias: Record<string, CctvCameraStatus> = {};

    for (const alarm of alarms) {
      if (alarm.acknowledgedAt) continue;

      const status = severityToCameraStatus(alarm.severity);
      if (!status) continue;

      mergeStatus(nextByAlias, alarm.id, status);
    }

    useCctvCameraStatusStore.getState().setAlarmStatusesByAlias(nextByAlias);
  }, [alarms]);
}
