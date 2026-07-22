import { useGLTF } from "@react-three/drei";

import { MODEL_OPTIONS, useModelStore } from "@/stores/modelStore";
import { cn } from "@/lib/utils";
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from "@/three/gltfLoader";

export default function ModelSelector() {
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const selectModel = useModelStore((s) => s.selectModel);

  if (MODEL_OPTIONS.length === 0) return null;

  return (
    <div
      className="pointer-events-auto absolute top-4 left-10 z-2 flex flex-wrap gap-2"
      aria-label="Model selection"
    >
      {MODEL_OPTIONS.map((option) => {
        const isActive = selectedModelId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs leading-tight select-none backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97]",
              isActive
                ? "border-accent bg-accent/20 text-text"
                : "border-border bg-bg/85 text-muted hover:border-white/20 hover:bg-bg/90 hover:text-text",
            )}
            onPointerEnter={() =>
              useGLTF.preload(
                option.url,
                GLTF_USE_DRACO,
                GLTF_USE_MESHOPT,
                extendGltfLoader,
              )
            }
            onClick={() => selectModel(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
