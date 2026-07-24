import { create } from "zustand";

import type { CctvAlarmSeverity } from "@/lib/cctvAlarm";

type CctvPopupPayload = {
  cameraId: string;
  cameraName: string;
  videoSrc: string;
  alarmSeverity: CctvAlarmSeverity;
  startTime: number;
};

type CctvPopupState = CctvPopupPayload & {
  isOpen: boolean;
  open: (payload: CctvPopupPayload) => void;
  close: () => void;
};

const initialState: CctvPopupPayload & { isOpen: boolean } = {
  isOpen: false,
  cameraId: "",
  cameraName: "",
  videoSrc: "",
  alarmSeverity: "warning",
  startTime: 0,
};

export const useCctvPopupStore = create<CctvPopupState>((set) => ({
  ...initialState,
  open: (payload) => set({ isOpen: true, ...payload }),
  close: () => set({ isOpen: false }),
}));
