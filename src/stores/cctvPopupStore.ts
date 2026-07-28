import { create } from "zustand";

type CctvPopupPayload = {
  cameraId: string;
  cameraName: string;
  /** 상태 조회용 GLB 카메라 name */
  statusKey: string;
  videoSrc: string;
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
  statusKey: "",
  videoSrc: "",
  startTime: 0,
};

export const useCctvPopupStore = create<CctvPopupState>((set) => ({
  ...initialState,
  open: (payload) => set({ isOpen: true, ...payload }),
  close: () => set({ isOpen: false }),
}));
