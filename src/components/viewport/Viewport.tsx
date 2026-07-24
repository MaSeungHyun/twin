import { useState } from "react";

import { cn } from "@/lib/utils";

import ModelSelector from "../model/ModelSelector";
import ViewportScene, { MAX_POINT_LIGHTS } from "./ViewportScene";

const STEP = 10;

export default function Viewport() {
  const [lightCount, setLightCount] = useState(0);

  const add = () =>
    setLightCount((n) => Math.min(MAX_POINT_LIGHTS, n + STEP));
  const remove = () => setLightCount((n) => Math.max(0, n - STEP));

  return (
    <div className="relative flex flex-1 w-full h-full">
      <ModelSelector />

      <div
        className="pointer-events-auto absolute right-10 bottom-10 z-2 flex w-56 flex-col gap-2 rounded-lg border border-border bg-bg/85 px-3 py-2.5 backdrop-blur-md"
        aria-label="Point light count"
      >
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Point lights</span>
          <span className="tabular-nums text-text">
            {lightCount}/{MAX_POINT_LIGHTS}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={lightCount <= 0}
            onClick={remove}
            className={cn(
              "flex-1 cursor-pointer rounded-md border border-border bg-bg/90 py-1.5 text-xs text-text transition-colors",
              "hover:border-white/20 hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            −{STEP}
          </button>
          <button
            type="button"
            disabled={lightCount >= MAX_POINT_LIGHTS}
            onClick={add}
            className={cn(
              "flex-1 cursor-pointer rounded-md border border-accent/40 bg-accent/20 py-1.5 text-xs text-text transition-colors",
              "hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            +{STEP}
          </button>
        </div>
      </div>

      <ViewportScene lightCount={lightCount} />
    </div>
  );
}
