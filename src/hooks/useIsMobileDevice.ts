import { useSyncExternalStore } from "react";

import { isMobileDevice } from "@/lib/device";

function subscribe(onStoreChange: () => void) {
  const coarse = window.matchMedia("(pointer: coarse)");
  const narrow = window.matchMedia("(max-width: 1024px)");
  coarse.addEventListener("change", onStoreChange);
  narrow.addEventListener("change", onStoreChange);
  return () => {
    coarse.removeEventListener("change", onStoreChange);
    narrow.removeEventListener("change", onStoreChange);
  };
}

/** 뷰포트·포인터 변경 시 모바일/태블릿 여부 반영 */
export function useIsMobileDevice(): boolean {
  return useSyncExternalStore(subscribe, isMobileDevice, () => false);
}
