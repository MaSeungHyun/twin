/** CCTV Html 마커 — 카메라 world 위치에서 위(Y)로 띄우는 높이(m). 카메라별 설정 없음 */
export const CCTV_MARKER_LIFT_Y = 20;

export function getCctvMarkerWorldOffset(): [number, number, number] {
  return [0, CCTV_MARKER_LIFT_Y, 0];
}
