import { cn } from "@/lib/utils";

/** 카메라 런타임 상태 — safe면 알람/히트맵 없음 */
export type CctvCameraStatus = "safe" | "warning" | "critical";

/** 알람 UI용 (safe 제외) */
export type CctvAlarmSeverity = Exclude<CctvCameraStatus, "safe">;

export function isCctvAlarmSeverity(
  status: CctvCameraStatus,
): status is CctvAlarmSeverity {
  return status === "warning" || status === "critical";
}

export function cctvAlarmLabel(severity: CctvAlarmSeverity): string {
  return severity === "critical" ? "Critical" : "Warning";
}

export function cctvAlarmBadgeClass(severity: CctvAlarmSeverity): string {
  return cn(
    "ml-auto cursor-pointer rounded-full px-1.5 py-px text-[10px] font-bold tracking-wide uppercase",
    severity === "critical" && "bg-severity-critical text-white",
    severity === "warning" && "bg-severity-warning text-[#1a1408]",
  );
}

export function cctvAlarmRingClass(severity: CctvAlarmSeverity): string {
  return cn(
    "animate-[cctv-alarm-ring-pulse_1.8s_ease-in-out_infinite]",
    severity === "critical" &&
      "border-severity-critical [--cctv-alarm-color:var(--color-severity-critical)]",
    severity === "warning" &&
      "border-severity-warning [--cctv-alarm-color:var(--color-severity-warning)]",
  );
}

/** 리더 선 stroke — safe는 기본 액센트 블루 */
export function cctvLeaderLineStroke(status: CctvCameraStatus): string {
  switch (status) {
    case "critical":
      return "rgba(232, 121, 127, 0.95)";
    case "warning":
      return "rgba(212, 168, 75, 0.95)";
    default:
      return "rgba(77, 163, 255, 0.9)";
  }
}
