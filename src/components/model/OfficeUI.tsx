import { cn } from "@/lib/utils";
import { OFFICE_FLOOR_ACTIONS } from "@/data/officeFloorActions";
import { useOfficeStore } from "@/stores/officeStore";

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
    <nav
      className="hud-floor-bar"
      aria-label="Office floor controls"
    >
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
              "hud-floor-bar__btn",
              (isActive || isRunning) && "hud-floor-bar__btn--active",
            )}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
