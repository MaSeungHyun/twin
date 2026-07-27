/** GLB에서 CCTV 마커 앵커로 찾을 노드 name (소문자, 정확히 일치) */
export const CCTV_MARKER_NODE_NAMES = [
  "office",
  "office2",
  "office3",
  "cafe",
  "camera",
  "lobby",
  "conf-room",
] as const;

/** 위 name이 없을 때 primary fallback (GLB: silling_cctv* 6개) */
export const CCTV_MARKER_FALLBACK_PATTERNS = [/^silling_cctv/i] as const;

/** primary가 7개 미만일 때 보충 (GLB: camera_426, camera2_429 등) */
export const CCTV_MARKER_SUPPLEMENT_PATTERNS = [/^camera\d/i] as const;

export const CCTV_MARKER_FALLBACK_MAX = 7;
