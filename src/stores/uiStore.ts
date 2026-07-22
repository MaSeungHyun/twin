import { create } from 'zustand'

import { buildCctvContextIds } from '@/lib/cctvContext'
import { useDeviceStore } from '@/stores/deviceStore'
import {
  flyToZone,
  focusAlarm as bridgeFocusAlarm,
  focusDevice as bridgeFocusDevice,
} from '@/three/engine/engineBridge'
import type { AlarmEvent } from '@/types/events'

export type RightPanelMode = 'schedule' | 'cctv' | 'restroom'

interface UiState {
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  rightPanelMode: RightPanelMode
  selectedZoneId: string
  selectedAlarmId: string | null
  selectedDeviceId: string | null
  cctvContextIds: string[]
  cameraPreset: string
  isPointerOverPanel: boolean
  panelPointerDepth: number

  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setRightPanelMode: (mode: RightPanelMode) => void
  selectZone: (zoneId: string, cameraPresetId?: string) => void
  enterPanelPointer: () => void
  leavePanelPointer: () => void
  setPointerOverPanel: (value: boolean) => void
  dismissFocus: () => void
  selectAlarm: (alarm: AlarmEvent) => void
  setSelectedDeviceId: (deviceId: string | null) => void
  selectRestroomStall: (deviceId: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  leftPanelOpen: false,
  rightPanelOpen: false,
  rightPanelMode: 'schedule',
  selectedZoneId: 'overview',
  selectedAlarmId: null,
  selectedDeviceId: null,
  cctvContextIds: [],
  cameraPreset: 'overview',
  isPointerOverPanel: false,
  panelPointerDepth: 0,

  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),

  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

  setRightPanelMode: (mode) => set({ rightPanelMode: mode }),

  selectZone: (zoneId, cameraPresetId) => {
    set({
      selectedZoneId: zoneId,
      cameraPreset: cameraPresetId ?? zoneId,
    })
    flyToZone(zoneId)
  },

  enterPanelPointer: () =>
    set((s) => {
      const panelPointerDepth = s.panelPointerDepth + 1
      return { panelPointerDepth, isPointerOverPanel: panelPointerDepth > 0 }
    }),

  leavePanelPointer: () =>
    set((s) => {
      const panelPointerDepth = Math.max(0, s.panelPointerDepth - 1)
      return { panelPointerDepth, isPointerOverPanel: panelPointerDepth > 0 }
    }),

  setPointerOverPanel: (value) =>
    set({ isPointerOverPanel: value, panelPointerDepth: value ? 1 : 0 }),

  dismissFocus: () =>
    set({
      selectedAlarmId: null,
      selectedDeviceId: null,
      cctvContextIds: [],
      rightPanelMode: 'schedule',
    }),

  selectAlarm: (alarm) => {
    const rightPanelMode: RightPanelMode =
      alarm.type === 'TOILET_EMERGENCY' ? 'restroom' : 'cctv'

    const byId = useDeviceStore.getState().byId
    const cctvContextIds =
      alarm.deviceId && rightPanelMode === 'cctv'
        ? buildCctvContextIds(alarm.deviceId, byId)
        : []

    set({
      selectedAlarmId: alarm.id,
      selectedDeviceId: alarm.deviceId ?? null,
      cctvContextIds,
      leftPanelOpen: true,
      rightPanelMode,
      rightPanelOpen: true,
    })

    bridgeFocusAlarm(alarm)
  },

  setSelectedDeviceId: (deviceId) => set({ selectedDeviceId: deviceId }),

  selectRestroomStall: (deviceId) => {
    set({ selectedDeviceId: deviceId })
    bridgeFocusDevice(deviceId)
  },
}))
