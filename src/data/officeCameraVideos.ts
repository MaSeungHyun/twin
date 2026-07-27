import platform1 from "@/assets/video/platform1.mp4";
import platform2 from "@/assets/video/platform2.mp4";
import platform3 from "@/assets/video/platform3.mp4";
import platform4 from "@/assets/video/platform4.mp4";
import transfer1 from "@/assets/video/transfer1.mp4";
import transfer2 from "@/assets/video/transfer2.mp4";
import transfer3 from "@/assets/video/transfer3.mp4";
import { scheduleOfficeVideoPreload } from "@/lib/cctvVideoPool";

export const OFFICE_CAMERA_VIDEO_URLS = [
  platform1,
  platform2,
  platform3,
  platform4,
  transfer1,
  transfer2,
  transfer3,
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** 마커 id/name 기준 pseudo-random — 새로고침 전까지 동일 영상 유지 */
export function getCctvVideoForMarker(markerKey: string): string {
  const index = hashString(markerKey) % OFFICE_CAMERA_VIDEO_URLS.length;
  return OFFICE_CAMERA_VIDEO_URLS[index];
}

scheduleOfficeVideoPreload(OFFICE_CAMERA_VIDEO_URLS);
