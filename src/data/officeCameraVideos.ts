import platform1_240 from "@/assets/video/240p/platform1.mp4";
import platform2_240 from "@/assets/video/240p/platform2.mp4";
import platform3_240 from "@/assets/video/240p/platform3.mp4";
import platform4_240 from "@/assets/video/240p/platform4.mp4";
import transfer1_240 from "@/assets/video/240p/transfer1.mp4";
import transfer2_240 from "@/assets/video/240p/transfer2.mp4";
import transfer3_240 from "@/assets/video/240p/transfer3.mp4";
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

type VideoId = (typeof OFFICE_CAMERA_VIDEO_ORDER)[number];

/** GLB 카메라 name → 영상 제목(파일명) — 타이틀/소스 공통 */
const CAMERA_NAME_TO_VIDEO: Record<string, VideoId> = {
  office: "platform1",
  office2: "platform2",
  office3: "platform3",
  cafe: "platform4",
  road: "transfer1",
  /** 구 이름 호환 */
  camera: "transfer1",
  lobby: "transfer2",
  "conf-room": "transfer3",
};

const VIDEOS_240 = {
  platform1: platform1_240,
  platform2: platform2_240,
  platform3: platform3_240,
  platform4: platform4_240,
  transfer1: transfer1_240,
  transfer2: transfer2_240,
  transfer3: transfer3_240,
} as const satisfies Record<VideoId, string>;

const VIDEOS_720 = {
  platform1: platform1_720,
  platform2: platform2_720,
  platform3: platform3_720,
  platform4: platform4_720,
  transfer1: transfer1_720,
  transfer2: transfer2_720,
  transfer3: transfer3_720,
} as const satisfies Record<VideoId, string>;

const VIDEOS_1080 = {
  platform1: platform1_1080,
  platform2: platform2_1080,
  platform3: platform3_1080,
  platform4: platform4_1080,
  transfer1: transfer1_1080,
  transfer2: transfer2_1080,
  transfer3: transfer3_1080,
} as const satisfies Record<VideoId, string>;

function videoIdAt(index: number): VideoId {
  return OFFICE_CAMERA_VIDEO_ORDER[index % OFFICE_CAMERA_VIDEO_ORDER.length];
}

function videoIdForCameraName(cameraName: string, fallbackIndex = 0): VideoId {
  const key = cameraName.trim().toLowerCase();
  return CAMERA_NAME_TO_VIDEO[key] ?? videoIdAt(fallbackIndex);
}

const PLATFORM_IDS = [
  "platform1",
  "platform2",
  "platform3",
  "platform4",
] as const satisfies readonly VideoId[];

const TRANSFER_IDS = [
  "transfer1",
  "transfer2",
  "transfer3",
] as const satisfies readonly VideoId[];

/** devices.json ID → 로컬 영상 키
 * - sld-00N (플랫폼) → platform1~4
 * - cm-00N (환승) → transfer1~3
 */
export function resolveOfficeCameraVideoId(
  deviceId: string,
  zoneId?: string,
): VideoId {
  const sld = /^sld-(\d+)$/i.exec(deviceId);
  if (sld) {
    const n = Number.parseInt(sld[1], 10);
    return PLATFORM_IDS[(Math.max(n, 1) - 1) % PLATFORM_IDS.length];
  }

  const cm = /^cm-(\d+)$/i.exec(deviceId);
  if (cm) {
    const n = Number.parseInt(cm[1], 10);
    return TRANSFER_IDS[(Math.max(n, 1) - 1) % TRANSFER_IDS.length];
  }

  // 알람 id가 GLB 카메라 name인 경우 (office, lobby …)
  const fromCamera = CAMERA_NAME_TO_VIDEO[deviceId.trim().toLowerCase()];
  if (fromCamera) return fromCamera;

  if (zoneId === "platform-56") return "platform1";
  if (zoneId === "transfer") return "transfer1";
  return "platform1";
}

export function getCctvMarkerVideoByVideoId(videoId: VideoId | string): string {
  const id = (
    OFFICE_CAMERA_VIDEO_ORDER.includes(videoId as VideoId)
      ? videoId
      : "platform1"
  ) as VideoId;
  return VIDEOS_240[id];
}

/** CCTV 패널 메인 — 데스크톱 1080p / 모바일·태블릿 720p */
export function getCctvPanelVideo(
  deviceId: string,
  zoneId?: string,
): string {
  const id = resolveOfficeCameraVideoId(deviceId, zoneId);
  return isMobileDevice() ? VIDEOS_720[id] : VIDEOS_1080[id];
}

export function getCctvPanelVideoByVideoId(videoId: VideoId | string): string {
  const id = (
    OFFICE_CAMERA_VIDEO_ORDER.includes(videoId as VideoId)
      ? videoId
      : "platform1"
  ) as VideoId;
  return isMobileDevice() ? VIDEOS_720[id] : VIDEOS_1080[id];
}

/** 오버레이 마커 카드용 — 항상 240p */
export function getCctvMarkerVideoByCameraName(
  cameraName: string,
  fallbackIndex = 0,
): string {
  return VIDEOS_240[videoIdForCameraName(cameraName, fallbackIndex)];
}

/** 팝업 확대용 — 데스크톱 1080p / 모바일·태블릿 720p */
export function getCctvPopupVideoByCameraName(
  cameraName: string,
  fallbackIndex = 0,
): string {
  const id = videoIdForCameraName(cameraName, fallbackIndex);
  return isMobileDevice() ? VIDEOS_720[id] : VIDEOS_1080[id];
}

/** @deprecated index 기반 — 카메라 name 기반 API 사용 */
export function getCctvMarkerVideoByIndex(index: number): string {
  return VIDEOS_240[videoIdAt(index)];
}

/** @deprecated index 기반 — 카메라 name 기반 API 사용 */
export function getCctvPopupVideoByIndex(index: number): string {
  const id = videoIdAt(index);
  return isMobileDevice() ? VIDEOS_720[id] : VIDEOS_1080[id];
}

/**
 * @deprecated 마커는 getCctvMarkerVideoByCameraName, 팝업은 getCctvPopupVideoByCameraName 사용
 */
export function getCctvVideoByIndex(index: number): string {
  return getCctvMarkerVideoByIndex(index);
}

/** 초기 preload — 마커(240p) 위주 (항상 보이는 쪽) */
export function getOfficeCameraVideoUrls(): readonly string[] {
  return OFFICE_CAMERA_VIDEO_ORDER.map((id) => VIDEOS_240[id]);
}

/** 마커/팝업 타이틀 — platform1, transfer2 등 영상 파일명 */
export function getCctvVideoTitleByCameraName(
  cameraName: string,
  fallbackIndex = 0,
): string {
  return videoIdForCameraName(cameraName, fallbackIndex);
}

/** @deprecated */
export function getCctvVideoTitleByIndex(index: number): string {
  return videoIdAt(index);
}
