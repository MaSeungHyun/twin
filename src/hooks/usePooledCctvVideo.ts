import { useEffect } from "react";

import {
  mountPooledCctvVideo,
  unmountPooledCctvVideo,
} from "@/lib/cctvVideoPool";

type UsePooledCctvVideoOptions = {
  className?: string;
};

/** src당 video 1개 재사용 — 마커 카드용(저화질 풀) */
export function usePooledCctvVideo(
  container: HTMLElement | null,
  src: string,
  active: boolean,
  options: UsePooledCctvVideoOptions = {},
) {
  const { className } = options;

  useEffect(() => {
    if (!container || !active || !src) return;

    mountPooledCctvVideo(container, src, { className });

    return () => {
      unmountPooledCctvVideo(container);
    };
  }, [container, src, active, className]);
}
