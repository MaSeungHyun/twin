import { getStationBundle } from "@/data/stations/registry";
import { useClock } from "@/hooks/useClock";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";
import { cn } from "@/lib/utils";
import type { ScheduleStatus } from "@/stores/scheduleStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useUiStore } from "@/stores/uiStore";

const STATION = getStationBundle("SEOUL");
const ZONES = [...STATION.config.zones].sort(
  (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
);

function tagoBadgeForStatus(status: ScheduleStatus) {
  switch (status) {
    case "fresh":
      return { label: "Live", className: "hud-badge--live" };
    case "stale":
      return { label: "TAGO delayed", className: "hud-badge--warn" };
    case "error":
      return { label: "TAGO offline", className: "hud-badge--error" };
    case "loading":
      return { label: "TAGO…", className: "hud-badge--muted" };
    default:
      return { label: "TAGO", className: "hud-badge--muted" };
  }
}

export function HeaderBar() {
  const clock = useClock();
  const selectedZoneId = useUiStore((s) => s.selectedZoneId);
  const selectZone = useUiStore((s) => s.selectZone);
  const scheduleStatus = useScheduleStore((s) => s.status);
  const tagoBadge = tagoBadgeForStatus(scheduleStatus);
  const mobile = useIsMobileDevice();
  const videoQuality = mobile ? "720p" : "1080p";

  return (
    <header className="hud-top">
      <div className="hud-island hud-island--brand">
        <div className="hud-brand__text">
          <span className="hud-brand__eyebrow">Station Twin</span>
          <span className="hud-brand__station">
            {STATION.config.displayName}
          </span>
        </div>
        <time className="hud-brand__clock tabular-nums" dateTime={clock}>
          {clock}
        </time>
      </div>

      <nav className="hud-island hud-island--zones" aria-label="구역 선택">
        {ZONES.map((zone) => (
          <button
            key={zone.zoneId}
            type="button"
            className={cn(
              "hud-zone",
              selectedZoneId === zone.zoneId && "hud-zone--active",
            )}
            onClick={() => selectZone(zone.zoneId)}
          >
            {zone.name}
          </button>
        ))}
      </nav>

      <div className="hud-island hud-island--meta" aria-label="데이터 상태">
        <span className={cn("hud-badge", tagoBadge.className)}>
          {tagoBadge.label}
        </span>
        <span
          className="hud-badge hud-badge--resolution"
          aria-label={mobile ? "모바일 720p 영상" : "데스크톱 1080p 영상"}
        >
          {videoQuality}
        </span>
        <span className="hud-badge hud-badge--muted">CCTV</span>
      </div>
    </header>
  );
}
