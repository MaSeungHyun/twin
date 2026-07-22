import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

import ModelSelector from "../model/ModelSelector";
import { useWasteModelStore } from "@/stores/wasteModelStore";

import Fallback from "./Fallback";
import ViewportScene from "./ViewportScene";

/** 초기 로드 중에만 Fallback 표시 (모델 전환·waste spawn 시에는 숨김) */
function ModelLoadingOverlay() {
  const { active } = useProgress();
  const startedRef = useRef(false);
  const [initialDone, setInitialDone] = useState(false);

  useEffect(() => {
    if (active) startedRef.current = true;
    if (startedRef.current && !active) setInitialDone(true);
  }, [active]);

  if (initialDone) return null;
  return <Fallback />;
}

export default function Viewport() {
  const spawn = useWasteModelStore((s) => s.spawn);
  const clear = useWasteModelStore((s) => s.clear);
  const count = useWasteModelStore((s) => s.instances.length);

  return (
    <div className="relative flex flex-1 w-full h-full">
      <ModelSelector />
      <div className="pointer-events-auto absolute top-4 right-10 z-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="cursor-pointer rounded-full border border-border bg-bg/85 px-3 py-1.5 text-xs text-muted backdrop-blur-md hover:border-white/20 hover:bg-bg/90 hover:text-text"
          onClick={() => spawn()}
        >
          Add model02 ({count})
        </button>
        {count > 0 ? (
          <button
            type="button"
            className="cursor-pointer rounded-full border border-border bg-bg/85 px-3 py-1.5 text-xs text-muted backdrop-blur-md hover:border-white/20 hover:bg-bg/90 hover:text-text"
            onClick={() => clear()}
          >
            Clear waste
          </button>
        ) : null}
      </div>
      <ModelLoadingOverlay />
      <ViewportScene />
    </div>
  );
}
