import { cn } from "@/lib/utils";
import { useLightBankStore } from "@/stores/lightBankStore";

const STEPS = [1, 5, 10] as const;

function StepButtons({
  direction,
  activeCount,
  total,
  onStep,
}: {
  direction: "add" | "remove";
  activeCount: number;
  total: number;
  onStep: (n: number) => void;
}) {
  const sign = direction === "add" ? "+" : "−";
  const isAdd = direction === "add";

  return (
    <div className="flex gap-1.5">
      {STEPS.map((step) => (
        <button
          key={`${direction}-${step}`}
          type="button"
          disabled={isAdd ? activeCount >= total : activeCount <= 0}
          onClick={() => onStep(step)}
          className={cn(
            "flex-1 cursor-pointer rounded-md border py-1.5 text-xs text-text transition-colors",
            isAdd
              ? "border-accent/40 bg-accent/20 hover:bg-accent/30"
              : "border-border bg-bg/90 hover:border-white/20 hover:bg-bg",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {sign}
          {step}
        </button>
      ))}
    </div>
  );
}

export default function LightBankControls() {
  const total = useLightBankStore((s) => s.entries.length);
  const activeCount = useLightBankStore((s) => s.activeCount);
  const addMany = useLightBankStore((s) => s.addMany);
  const removeMany = useLightBankStore((s) => s.removeMany);

  if (total === 0) return null;

  return (
    <div
      className="pointer-events-auto absolute right-10 bottom-10 z-2 flex w-56 flex-col gap-2 rounded-lg border border-border bg-bg/85 px-3 py-2.5 backdrop-blur-md"
      aria-label="Model light bank"
    >
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Model lights</span>
        <span className="tabular-nums text-text">
          {activeCount}/{total}
        </span>
      </div>
      <StepButtons
        direction="remove"
        activeCount={activeCount}
        total={total}
        onStep={removeMany}
      />
      <StepButtons
        direction="add"
        activeCount={activeCount}
        total={total}
        onStep={addMany}
      />
    </div>
  );
}
