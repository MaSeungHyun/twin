import { create } from "zustand";

import type { CardinalDirection } from "@/lib/compassNavigation";

type CompassState = {
  /** rad, 0=북 */
  heading: number;
  rotateTarget: CardinalDirection | null;
  setHeading: (heading: number) => void;
  requestRotateTo: (direction: CardinalDirection) => void;
  clearRotateTarget: () => void;
};

export const useCompassStore = create<CompassState>((set) => ({
  heading: 0,
  rotateTarget: null,
  setHeading: (heading) => set({ heading }),
  requestRotateTo: (direction) => set({ rotateTarget: direction }),
  clearRotateTarget: () => set({ rotateTarget: null }),
}));
