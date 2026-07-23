import { GALLERY_MODELS } from "@/assets/model";
import { cn } from "@/lib/utils";
import { useCameraStore } from "@/stores/cameraStore";

const GROUPS = [
  { id: "model" as const, title: "Model" },
  { id: "company" as const, title: "Company" },
];

export default function ModelSelector() {
  const soloId = useCameraStore((s) => s.soloId);
  const activeId = useCameraStore((s) => s.activeId);
  const flyTo = useCameraStore((s) => s.flyTo);
  const focuses = useCameraStore((s) => s.focuses);
  const isFlying = useCameraStore((s) => s.isFlying);
  const readyCount = Object.keys(focuses).length;
  const total = GALLERY_MODELS.length;

  return (
    <div
      className="pointer-events-auto absolute top-12 left-10 z-2 flex flex-col gap-2"
      aria-label="Model gallery focus"
    >
      {readyCount < total ? (
        <span className="text-[10px] text-muted tabular-nums">
          loading {readyCount}/{total}
        </span>
      ) : null}

      {GROUPS.map((group) => (
        <div key={group.id} className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-[10px] tracking-wide text-muted uppercase">
            {group.title}
          </span>
          {GALLERY_MODELS.filter((m) => m.group === group.id).map((option) => {
            const isActive =
              soloId === option.id || activeId === option.id;
            const ready = Boolean(focuses[option.id]);

            return (
              <button
                key={option.id}
                type="button"
                disabled={!ready || isFlying}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs leading-tight select-none backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] disabled:cursor-wait disabled:opacity-50",
                  isActive
                    ? "border-accent bg-accent/20 text-text"
                    : "border-border bg-bg/85 text-muted hover:border-white/20 hover:bg-bg/90 hover:text-text",
                )}
                onClick={() => flyTo(option.id)}
              >
                {option.label.replace(/^(Model|Company|City)\s/, "")}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
