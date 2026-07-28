import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { useCctvPopupStore } from "@/stores/cctvPopupStore";

/**
 * CCTV 팝업이 열려 있으면 Canvas frameloop을 멈춰 백그라운드 렌더/useFrame 중단.
 */
export default function FrameloopPauseOnPopup() {
  const setFrameloop = useThree((s) => s.set);
  const isOpen = useCctvPopupStore((s) => s.isOpen);

  useEffect(() => {
    setFrameloop({ frameloop: isOpen ? "never" : "always" });
    return () => {
      setFrameloop({ frameloop: "always" });
    };
  }, [isOpen, setFrameloop]);

  return null;
}
