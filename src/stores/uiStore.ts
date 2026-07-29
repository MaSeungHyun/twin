import { create } from "zustand";

import {
  flyToZone,
  focusAlarm as bridgeFocusAlarm,
  focusDevice as bridgeFocusDevice,
} from "@/three/engine/engineBridge";
import type { AlarmEvent } from "@/types/events";

export type RightPanelMode = "schedule" | "cctv" | "restroom";

interface UiState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelMode: RightPanelMode;
  cctvExpanded: boolean;
  selectedZoneId: string;
  selectedAlarmId: string | null;
  selectedDeviceId: string | null;
  isPointerOverPanel: boolean;
  panelPointerDepth: number;

  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleCctvExpanded: () => void;
  selectZone: (zoneId: string) => void;
  enterPanelPointer: () => void;
  leavePanelPointer: () => void;
  dismissFocus: () => void;
  selectAlarm: (alarm: AlarmEvent) => void;
  setSelectedDeviceId: (deviceId: string | null) => void;
  selectRestroomStall: (deviceId: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  rightPanelMode: "schedule",
  cctvExpanded: false,
  selectedZoneId: "overview",
  selectedAlarmId: null,
  selectedDeviceId: null,
  isPointerOverPanel: false,
  panelPointerDepth: 0,

  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),

  toggleRightPanel: () =>
    set((s) => ({
      rightPanelOpen: !s.rightPanelOpen,
      cctvExpanded: false,
    })),

  toggleCctvExpanded: () =>
    set((s) => {
      const next = !s.cctvExpanded;
      return {
        cctvExpanded: next,
        leftPanelOpen: next ? false : s.leftPanelOpen,
      };
    }),

  selectZone: (zoneId) => {
    set({ selectedZoneId: zoneId });
    flyToZone(zoneId);
  },

  enterPanelPointer: () =>
    set((s) => {
      const panelPointerDepth = s.panelPointerDepth + 1;
      return { panelPointerDepth, isPointerOverPanel: panelPointerDepth > 0 };
    }),

  leavePanelPointer: () =>
    set((s) => {
      const panelPointerDepth = Math.max(0, s.panelPointerDepth - 1);
      return { panelPointerDepth, isPointerOverPanel: panelPointerDepth > 0 };
    }),

  dismissFocus: () =>
    set({
      selectedAlarmId: null,
      selectedDeviceId: null,
    }),

  selectAlarm: (alarm) => {
    const rightPanelMode: RightPanelMode =
      alarm.type === "TOILET_EMERGENCY" ? "restroom" : "cctv";

    set({
      selectedAlarmId: alarm.id,
      selectedDeviceId: alarm.deviceId ?? null,
      leftPanelOpen: true,
      rightPanelMode,
      rightPanelOpen: true,
      cctvExpanded: false,
    });

    bridgeFocusAlarm(alarm);
  },

  setSelectedDeviceId: (deviceId) => set({ selectedDeviceId: deviceId }),

  selectRestroomStall: (deviceId) => {
    set({ selectedDeviceId: deviceId });
    bridgeFocusDevice(deviceId);
  },
}));
