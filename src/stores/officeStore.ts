import { create } from "zustand";

import type { OfficeFloorActionId } from "@/data/officeFloorActions";

type OfficeState = {
  availableFloorActions: OfficeFloorActionId[];
  activeFloorAction: OfficeFloorActionId | null;
  floorCommand: OfficeFloorActionId | null;
  setAvailableFloorActions: (actions: OfficeFloorActionId[]) => void;
  playFloorAction: (actionId: OfficeFloorActionId) => void;
  clearFloorCommand: () => void;
  setActiveFloorAction: (actionId: OfficeFloorActionId | null) => void;
};

export const useOfficeStore = create<OfficeState>((set, get) => ({
  availableFloorActions: [],
  activeFloorAction: null,
  floorCommand: null,

  setAvailableFloorActions: (availableFloorActions) =>
    set({ availableFloorActions }),

  playFloorAction: (actionId) => {
    if (get().floorCommand !== null) return;
    if (!get().availableFloorActions.includes(actionId)) return;
    set({ floorCommand: actionId });
  },

  clearFloorCommand: () => set({ floorCommand: null }),

  setActiveFloorAction: (activeFloorAction) => set({ activeFloorAction }),
}));
