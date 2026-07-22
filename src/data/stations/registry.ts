import type { StationConfig, DeviceMetadata, TracksFile } from '@/types/station'

import seoulConfig from './seoul/config.json'
import seoulDevices from './seoul/devices.json'
import seoulTracks from './seoul/tracks.json'

export interface StationBundle {
  config: StationConfig
  devices: DeviceMetadata[]
  tracks: TracksFile
}

const REGISTRY: Record<string, StationBundle> = {
  SEOUL: {
    config: seoulConfig as unknown as StationConfig,
    devices: seoulDevices as DeviceMetadata[],
    tracks: seoulTracks as unknown as TracksFile,
  },
}

export function getStationBundle(stationId: string): StationBundle {
  const bundle = REGISTRY[stationId]
  if (!bundle) {
    throw new Error(`Unknown stationId: ${stationId}`)
  }
  return bundle
}

export function listStationIds(): string[] {
  return Object.keys(REGISTRY)
}
