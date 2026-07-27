import { useProgress } from "@react-three/drei";
import { useEffect } from "react";

import { useInitialLoadStore } from "@/stores/initialLoadStore";

/** Canvas 내부 — drei useProgress → initialLoadStore 동기화 */
export default function LoadProgressSync() {
  const { progress } = useProgress();
  const setModelProgress = useInitialLoadStore((s) => s.setModelProgress);

  useEffect(() => {
    setModelProgress(progress);
  }, [progress, setModelProgress]);

  return null;
}
