import { useEffect } from "react";

import {
  destroyTransientCctvVideo,
  mountTransientCctvVideo,
} from "@/lib/cctvVideoPool";

type UseTransientCctvVideoOptions = {
  className?: string;
  startTime?: number;
};

/** 팝업 전용 — 열릴 때 생성, 닫힐 때 src 해제 (풀 공유 없음) */
export function useTransientCctvVideo(
  container: HTMLElement | null,
  src: string,
  active: boolean,
  options: UseTransientCctvVideoOptions = {},
) {
  const { className, startTime = 0 } = options;

  useEffect(() => {
    if (!container || !active || !src) return;

    mountTransientCctvVideo(container, src, { className, startTime });

    return () => {
      destroyTransientCctvVideo(container);
    };
  }, [container, src, active, className, startTime]);
}
