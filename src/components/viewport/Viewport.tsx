import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

import ModelSelector from "../model/ModelSelector";

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
  return (
    <div className="relative flex flex-1 w-full h-full">
      <ModelSelector />

      {/* <ModelLoadingOverlay /> */}
      <ViewportScene />
    </div>
  );
}
