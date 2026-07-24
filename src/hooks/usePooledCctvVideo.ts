import { useEffect, type RefObject } from "react";

import {
  mountPooledCctvVideo,
  unmountPooledCctvVideo,
} from "@/lib/cctvVideoPool";

type UsePooledCctvVideoOptions = {
  className?: string;
  controls?: boolean;
};

/** src당 video 1개를 재사용 — 마커↔팝업 전환 시 재로드 없음 */
export function usePooledCctvVideo(
  containerRef: RefObject<HTMLElement | null>,
  src: string,
  active: boolean,
  options: UsePooledCctvVideoOptions = {},
) {
  const { className, controls } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !active || !src) return;

    mountPooledCctvVideo(container, src, { className, controls });

    return () => {
      unmountPooledCctvVideo(container);
    };
  }, [containerRef, src, active, className, controls]);
}
