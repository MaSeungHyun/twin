/**
 * 알람 id ↔ GLB 카메라 name 매핑.
 * 시나리오 alarm id를 카메라 name과 같게 두면 별칭 없이 동작한다.
 * (CCTV_MARKER_NODE_NAMES: office, office2, office3, cafe, road, lobby, conf-room)
 *
 * 필요 시 여기에만 추가 alias를 넣는다.
 */
const EXTRA_ALIASES_BY_CAMERA_NAME: Record<string, readonly string[]> = {};

export function getCctvMarkerAlarmAliases(
  cameraName: string,
): readonly string[] {
  return EXTRA_ALIASES_BY_CAMERA_NAME[cameraName] ?? [];
}
