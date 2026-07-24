import { cn } from "@/lib/utils";
import {
  OFFICE_CAMERA_IDS,
  useOfficeCameraStore,
} from "@/stores/officeCameraStore";
import { useOfficeStore } from "@/stores/officeStore";

const btnBase =
  "cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors backdrop-blur-md disabled:cursor-not-allowed disabled:opacity-40";

export default function OfficeUI() {
  const isCeilingOpen = useOfficeStore((s) => s.isCeilingOpen);
  const ceilingCommand = useOfficeStore((s) => s.ceilingCommand);
  const openCeiling = useOfficeStore((s) => s.openCeiling);
  const closeCeiling = useOfficeStore((s) => s.closeCeiling);

  const views = useOfficeCameraStore((s) => s.views);
  const activeId = useOfficeCameraStore((s) => s.activeId);
  const isFlying = useOfficeCameraStore((s) => s.isFlying);
  const flyTo = useOfficeCameraStore((s) => s.flyTo);

  const ceilingBusy = ceilingCommand !== null;

  return (
    <div
      className="pointer-events-auto absolute top-12 left-10 z-2 flex flex-col gap-2"
      aria-label="Office controls"
    >
      <div className="flex gap-2" aria-label="Office ceiling controls">
        <button
          type="button"
          disabled={isCeilingOpen || ceilingBusy}
          onClick={openCeiling}
          className={cn(
            btnBase,
            "border-accent bg-accent text-text hover:bg-accent/30",
          )}
        >
          Open
        </button>
        <button
          type="button"
          disabled={!isCeilingOpen || ceilingBusy}
          onClick={closeCeiling}
          className={cn(
            btnBase,
            "border-border bg-bg/85 text-text hover:border-white/20 hover:bg-bg",
          )}
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label="Office camera views">
        {OFFICE_CAMERA_IDS.map((id) => {
          const view = views[id];
          const isActive = activeId === id;

          return (
            <button
              key={id}
              type="button"
              disabled={!view || isFlying}
              onClick={() => flyTo(id)}
              className={cn(
                btnBase,
                "capitalize",
                isActive
                  ? "border-accent/40 bg-accent text-text"
                  : "border-border bg-bg/85 text-muted hover:border-white/20 hover:bg-bg hover:text-text",
              )}
            >
              {id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
