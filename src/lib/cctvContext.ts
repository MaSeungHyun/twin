import type { DeviceRuntime } from '@/stores/deviceStore'

export function shortCameraLabel(label: string): string {
  return label.replace(/^Safety line |^Congestion cam /, '')
}

/** 알람 앵커 + 동일 구역 인근 최대 3대 — F-09 고정 컨텍스트 (클릭해도 줄바꿈 없음) */
export function buildCctvContextIds(
  anchorDeviceId: string,
  byId: Record<string, DeviceRuntime>,
  maxTotal = 4,
): string[] {
  const anchor = byId[anchorDeviceId]
  if (!anchor) return [anchorDeviceId]

  const zoneCameras = Object.values(byId)
    .filter(
      (device) =>
        device.zoneId === anchor.zoneId &&
        device.category !== 'restroom' &&
        Boolean(device.streamUrl),
    )
    .sort((a, b) => a.displayOrder - b.displayOrder)

  const anchorIdx = zoneCameras.findIndex((device) => device.deviceId === anchorDeviceId)
  if (anchorIdx < 0) return [anchorDeviceId]

  const ids = [anchorDeviceId]
  const after = zoneCameras.slice(anchorIdx + 1)
  const before = zoneCameras.slice(0, anchorIdx).reverse()

  for (const device of after) {
    if (ids.length >= maxTotal) break
    ids.push(device.deviceId)
  }
  for (const device of before) {
    if (ids.length >= maxTotal) break
    ids.push(device.deviceId)
  }

  return ids
}
