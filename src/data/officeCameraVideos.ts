import platform1 from "@/assets/video/platform1.mp4";
import platform2 from "@/assets/video/platform2.mp4";
import platform3 from "@/assets/video/platform3.mp4";
import platform4 from "@/assets/video/platform4.mp4";
import transfer1 from "@/assets/video/transfer1.mp4";
import transfer2 from "@/assets/video/transfer2.mp4";
import transfer3 from "@/assets/video/transfer3.mp4";

export const OFFICE_CAMERA_VIDEO_URLS = [
  platform1,
  platform2,
  platform3,
  platform4,
  transfer1,
  transfer2,
  transfer3,
] as const;

/** 마커 순서별 1:1 영상 — URL당 video 1개 풀과 충돌 방지 */
export function getCctvVideoByIndex(index: number): string {
  return OFFICE_CAMERA_VIDEO_URLS[index % OFFICE_CAMERA_VIDEO_URLS.length];
}
