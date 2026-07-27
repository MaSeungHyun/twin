import { useEffect } from "react";

import { OFFICE_CAMERA_VIDEO_URLS } from "@/data/officeCameraVideos";
import { preloadOfficeVideosWithProgress } from "@/lib/cctvVideoPool";
import { useInitialLoadStore } from "@/stores/initialLoadStore";

/** 앱 최초 1회 — CCTV 영상 preload 진행률 추적 */
export default function InitialLoadBootstrap() {
  const setVideoProgress = useInitialLoadStore((s) => s.setVideoProgress);

  useEffect(() => {
    preloadOfficeVideosWithProgress(OFFICE_CAMERA_VIDEO_URLS, setVideoProgress);
  }, [setVideoProgress]);

  return null;
}
