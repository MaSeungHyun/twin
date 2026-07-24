import platform1 from "@/assets/video/platform1.mp4";
import platform3 from "@/assets/video/platform3.mp4";
import platform4 from "@/assets/video/platform4.mp4";
import transfer2 from "@/assets/video/transfer2.mp4";
import { scheduleOfficeVideoPreload } from "@/lib/cctvVideoPool";

/** GLB 카메라 name(소문자) → CCTV 영상 */
export const OFFICE_CAMERA_VIDEO_BY_NAME: Record<string, string> = {
  office: platform1,
  office2: platform3,
  cafe: platform4,
  camera: transfer2,
};

export const OFFICE_CAMERA_VIDEO_URLS = [
  platform1,
  platform3,
  platform4,
  transfer2,
] as const;

export function getOfficeCameraVideo(cameraName: string): string | undefined {
  return OFFICE_CAMERA_VIDEO_BY_NAME[cameraName.toLowerCase()];
}

scheduleOfficeVideoPreload(OFFICE_CAMERA_VIDEO_URLS);
