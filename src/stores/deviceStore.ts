import { create } from 'zustand'

import type {
  CctvStatusEvent,
  CctvConnectionStatus,
  ToiletEvent,
  ToiletStallState,
} from '@/types/events'
import type { DeviceMetadata } from '@/types/station'

export type DeviceRuntime = DeviceMetadata & {
  cctvStatus: CctvConnectionStatus
}

interface DeviceState {
  byId: Record<string, DeviceRuntime>
  toiletById: Record<string, ToiletStallState>

  hydrate: (devices: DeviceMetadata[]) => void
  setToiletSnapshot: (stalls: ToiletStallState[]) => void
  patchCctvStatus: (event: CctvStatusEvent) => void
  patchToilet: (event: ToiletEvent) => void
  get: (deviceId: string) => DeviceRuntime | undefined
  listByZone: (zoneId: string) => DeviceRuntime[]
}

function toRuntime(device: DeviceMetadata): DeviceRuntime {
  return { ...device, cctvStatus: 'ONLINE' }
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  byId: {},
  toiletById: {},

  hydrate: (devices) => {
    const byId: Record<string, DeviceRuntime> = {}
    for (const device of devices) {
      if (!device.enabled) continue
      byId[device.deviceId] = toRuntime(device)
    }
    set({ byId })
  },

  setToiletSnapshot: (stalls) => {
    const toiletById: Record<string, ToiletStallState> = {}
    for (const stall of stalls) {
      toiletById[stall.deviceId] = stall
    }
    set({ toiletById })
  },

  patchCctvStatus: (event) =>
    set((state) => {
      const current = state.byId[event.deviceId]
      if (!current) return state
      return {
        byId: {
          ...state.byId,
          [event.deviceId]: { ...current, cctvStatus: event.status },
        },
      }
    }),

  patchToilet: (event) =>
    set((state) => ({
      toiletById: {
        ...state.toiletById,
        [event.deviceId]: {
          deviceId: event.deviceId,
          zoneId: event.zoneId,
          label: event.label,
          status: event.status,
          updatedAt: event.updatedAt,
        },
      },
    })),

  get: (deviceId) => get().byId[deviceId],

  listByZone: (zoneId) =>
    Object.values(get().byId)
      .filter((device) => device.zoneId === zoneId)
      .sort((a, b) => a.displayOrder - b.displayOrder),
}))
