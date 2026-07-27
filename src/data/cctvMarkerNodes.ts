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

/** 위 name이 없을 때 fallback (예: silling_cctv*) */
export const CCTV_MARKER_FALLBACK_PATTERNS = [/^silling_cctv/i] as const;

export const CCTV_MARKER_FALLBACK_MAX = 7;
