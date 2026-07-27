import platform1_720 from "@/assets/video/720p/platform1.mp4";
import platform2_720 from "@/assets/video/720p/platform2.mp4";
import platform3_720 from "@/assets/video/720p/platform3.mp4";
import platform4_720 from "@/assets/video/720p/platform4.mp4";
import transfer1_720 from "@/assets/video/720p/transfer1.mp4";
import transfer2_720 from "@/assets/video/720p/transfer2.mp4";
import transfer3_720 from "@/assets/video/720p/transfer3.mp4";
import platform1_1080 from "@/assets/video/1080p/platform1.mp4";
import platform2_1080 from "@/assets/video/1080p/platform2.mp4";
import platform3_1080 from "@/assets/video/1080p/platform3.mp4";
import platform4_1080 from "@/assets/video/1080p/platform4.mp4";
import transfer1_1080 from "@/assets/video/1080p/transfer1.mp4";
import transfer2_1080 from "@/assets/video/1080p/transfer2.mp4";
import transfer3_1080 from "@/assets/video/1080p/transfer3.mp4";

import { isMobileDevice } from "@/lib/device";

const OFFICE_CAMERA_VIDEO_ORDER = [
  "platform1",
  "platform2",
  "platform3",
  "platform4",
  "transfer1",
  "transfer2",
  "transfer3",
] as const;

const VIDEOS_720 = {
  platform1: platform1_720,
  platform2: platform2_720,
  platform3: platform3_720,
  platform4: platform4_720,
  transfer1: transfer1_720,
  transfer2: transfer2_720,
  transfer3: transfer3_720,
} as const;

const VIDEOS_1080 = {
  platform1: platform1_1080,
  platform2: platform2_1080,
  platform3: platform3_1080,
  platform4: platform4_1080,
  transfer1: transfer1_1080,
  transfer2: transfer2_1080,
  transfer3: transfer3_1080,
} as const;

/** 데스크톱·웹 → 1080p, 모바일·태블릿 → 720p */
export function getOfficeCameraVideoUrls(): readonly string[] {
  const tier = isMobileDevice() ? VIDEOS_720 : VIDEOS_1080;
  return OFFICE_CAMERA_VIDEO_ORDER.map((id) => tier[id]);
}

/** 마커 순서별 1:1 영상 — URL당 video 1개 풀과 충돌 방지 */
export function getCctvVideoByIndex(index: number): string {
  const urls = getOfficeCameraVideoUrls();
  return urls[index % urls.length];
}

/** 마커 제목용 — 비디오 파일명(확장자 제외) */
export function getCctvVideoTitleByIndex(index: number): string {
  return OFFICE_CAMERA_VIDEO_ORDER[index % OFFICE_CAMERA_VIDEO_ORDER.length];
}
