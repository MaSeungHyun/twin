import { create } from "zustand";

export type CeilingCommand = "open" | "close";

type OfficeState = {
  ceilingCommand: CeilingCommand | null;
  isCeilingOpen: boolean;
  openCeiling: () => void;
  closeCeiling: () => void;
  clearCeilingCommand: () => void;
  setCeilingOpen: (open: boolean) => void;
};

export const useOfficeStore = create<OfficeState>((set, get) => ({
  ceilingCommand: null,
  isCeilingOpen: false,
  openCeiling: () => {
    if (get().isCeilingOpen) return;
    set({ ceilingCommand: "open" });
  },
  closeCeiling: () => {
    if (!get().isCeilingOpen) return;
    set({ ceilingCommand: "close" });
  },
  clearCeilingCommand: () => set({ ceilingCommand: null }),
  setCeilingOpen: (open) => set({ isCeilingOpen: open }),
}));
