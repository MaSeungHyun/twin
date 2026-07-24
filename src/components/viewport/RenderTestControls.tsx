import { cn } from "@/lib/utils";
import { useViewportTestStore } from "@/stores/viewportTestStore";

function ToggleButton({
  label,
  enabled,
  onClick,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors",
        enabled
          ? "border-accent/40 bg-accent/20 text-text hover:bg-accent/30"
          : "border-border bg-bg/90 text-muted hover:border-white/20 hover:bg-bg hover:text-text",
      )}
    >
      {label}: {enabled ? "ON" : "OFF"}
    </button>
  );
}

export default function RenderTestControls() {
  const postProcessingEnabled = useViewportTestStore(
    (s) => s.postProcessingEnabled,
  );
  const shadowsEnabled = useViewportTestStore((s) => s.shadowsEnabled);
  const antialiasEnabled = useViewportTestStore((s) => s.antialiasEnabled);
  const gpuPowerPreference = useViewportTestStore((s) => s.gpuPowerPreference);
  const togglePostProcessing = useViewportTestStore(
    (s) => s.togglePostProcessing,
  );
  const toggleShadows = useViewportTestStore((s) => s.toggleShadows);
  const toggleAntialias = useViewportTestStore((s) => s.toggleAntialias);
  const toggleGpuPowerPreference = useViewportTestStore(
    (s) => s.toggleGpuPowerPreference,
  );

  const gpuHigh = gpuPowerPreference === "high-performance";

  return (
    <div
      className="pointer-events-auto absolute bottom-10 right-10 z-2 flex flex-col gap-2 rounded-lg border border-border bg-bg/85 px-3 py-2.5 backdrop-blur-md"
      aria-label="Render test toggles"
    >
      <span className="text-[10px] tracking-wide text-muted uppercase">
        Render test
      </span>
      <ToggleButton
        label="Post-processing"
        enabled={postProcessingEnabled}
        onClick={togglePostProcessing}
      />
      <ToggleButton
        label="Shadows"
        enabled={shadowsEnabled}
        onClick={toggleShadows}
      />
      <ToggleButton
        label="Antialias"
        enabled={antialiasEnabled}
        onClick={toggleAntialias}
      />
      <button
        type="button"
        onClick={toggleGpuPowerPreference}
        className={cn(
          "cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors",
          gpuHigh
            ? "border-accent/40 bg-accent/20 text-text hover:bg-accent/30"
            : "border-border bg-bg/90 text-muted hover:border-white/20 hover:bg-bg hover:text-text",
        )}
      >
        GPU Power: {gpuHigh ? "HIGH" : "LOW"}
      </button>
    </div>
  );
}
