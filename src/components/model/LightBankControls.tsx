import { useLightBankStore } from "@/stores/lightBankStore";
import { cn } from "@/lib/utils";

const STEPS = [1, 10, 50] as const;

export default function LightBankControls() {
  const total = useLightBankStore((s) => s.entries.length);
  const activeCount = useLightBankStore((s) => s.activeCount);
  const addMany = useLightBankStore((s) => s.addMany);

  const remaining = Math.max(0, total - activeCount);
  const done = total > 0 && remaining === 0;

  return (
    <div
      className="pointer-events-auto absolute top-12 right-10 z-2 flex flex-wrap items-center justify-end gap-2"
      aria-label="Model light bank"
    >
      <span className="rounded-full border border-border bg-bg/85 px-3 py-1.5 text-xs text-muted backdrop-blur-md tabular-nums">
        Lights {activeCount} / {total}
      </span>
      {STEPS.map((step) => {
        const disabled = total === 0 || done;
        const label = done ? "All" : `+${Math.min(step, remaining || step)}`;

        return (
          <button
            key={step}
            type="button"
            disabled={disabled}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs leading-tight select-none backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
              "border-border bg-bg/85 text-muted hover:border-white/20 hover:bg-bg/90 hover:text-text",
            )}
            onClick={() => addMany(step)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
