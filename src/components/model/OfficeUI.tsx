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
      className="pointer-events-auto absolute bottom-[calc(var(--shell-bottom)+0.35rem)] left-1/2 z-[44] flex max-w-[min(96vw,36rem)] -translate-x-1/2 flex-wrap justify-center gap-[0.35rem] rounded-[0.85rem] border border-border bg-panel p-[0.35rem] shadow-[var(--shadow-float)] backdrop-blur-[var(--glass-blur)]"
      aria-label="Office floor controls"
    >
      {floorActions.map(({ id, label }) => {
        const selected = activeFloorAction === id || floorCommand === id;

        return (
          <button
            key={id}
            type="button"
            disabled={floorBusy}
            onClick={() => playFloorAction(id)}
            className={cn(
              "inline-flex min-h-[2.1rem] min-w-[2.75rem] cursor-pointer items-center justify-center rounded-[0.65rem] border border-transparent bg-transparent px-[0.85rem] py-[0.35rem] font-ui text-[0.78rem] font-semibold text-muted transition-[color,background,border-color] duration-150",
              "enabled:hover:border-white/12 enabled:hover:bg-white/5 enabled:hover:text-text",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              "disabled:cursor-not-allowed disabled:opacity-40",
              selected && "border-accent/35 bg-accent/16 text-text",
            )}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
