import { useEffect } from "react";

import { getOfficeCameraVideoUrls } from "@/data/officeCameraVideos";
import { preloadOfficeVideosWithProgress } from "@/lib/cctvVideoPool";
import { useInitialLoadStore } from "@/stores/initialLoadStore";

/** 앱 최초 1회 — CCTV 영상 preload 진행률 추적 */
export default function InitialLoadBootstrap() {
  const setVideoProgress = useInitialLoadStore((s) => s.setVideoProgress);

  useEffect(() => {
    preloadOfficeVideosWithProgress(getOfficeCameraVideoUrls(), setVideoProgress);
  }, [setVideoProgress]);

  return null;
}
