/** GLB 카메라 name(소문자) → world offset (x, y, z) — 초기 분리 */
export const CCTV_MARKER_WORLD_OFFSET: Record<string, [number, number, number]> =
  {
    office: [0, 1.2, 0],
    office2: [1.4, 0.9, 0],
    cafe: [-1.4, 0.9, 0],
    camera: [0, 1.6, 0],
  };

export function getCctvMarkerWorldOffset(cameraName: string): [number, number, number] {
  return CCTV_MARKER_WORLD_OFFSET[cameraName.toLowerCase()] ?? [0, 1, 0];
}
