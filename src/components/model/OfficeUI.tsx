import { cn } from "@/lib/utils";
import { OFFICE_FLOOR_ACTIONS } from "@/data/officeFloorActions";
import { useOfficeStore } from "@/stores/officeStore";

const btnBase =
  "cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors backdrop-blur-md disabled:cursor-not-allowed disabled:opacity-40";

export default function OfficeUI() {
  const availableFloorActions = useOfficeStore((s) => s.availableFloorActions);
  const activeFloorAction = useOfficeStore((s) => s.activeFloorAction);
  const floorCommand = useOfficeStore((s) => s.floorCommand);
  const playFloorAction = useOfficeStore((s) => s.playFloorAction);

  const floorBusy = floorCommand !== null;
  const floorActions = OFFICE_FLOOR_ACTIONS.filter((action) =>
    availableFloorActions.includes(action.id),
  );

  if (floorActions.length === 0) return null;

  return (
    <div
      className="pointer-events-auto absolute top-6 left-60 z-2 flex flex-col gap-2"
      aria-label="Office floor controls"
    >
      <div className="flex flex-wrap gap-2" aria-label="Office floor actions">
        {floorActions.map(({ id, label }) => {
          const isActive = activeFloorAction === id;
          const isRunning = floorCommand === id;

          return (
            <button
              key={id}
              type="button"
              disabled={floorBusy}
              onClick={() => playFloorAction(id)}
              className={cn(
                btnBase,
                isActive || isRunning
                  ? "border-accent bg-accent text-text"
                  : "border-border bg-bg/85 text-muted hover:border-white/20 hover:bg-bg hover:text-text",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
