import { cn } from "@/lib/utils";

export type CctvAlarmSeverity = "critical" | "warning";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** 카메라마다 고정된 알람 등급 (critical=빨강, warning=노랑) */
export function getStableCctvAlarmSeverity(
  cameraId: string,
): CctvAlarmSeverity {
  return hashString(cameraId) % 2 === 0 ? "critical" : "warning";
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
