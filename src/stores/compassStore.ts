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

/** ~0.05° — 매 프레임 zustand 구독 리렌더 방지 */
const HEADING_EPS = 0.001;

export const useCompassStore = create<CompassState>((set) => ({
  heading: 0,
  rotateTarget: null,
  setHeading: (heading) =>
    set((s) =>
      Math.abs(s.heading - heading) < HEADING_EPS ? s : { heading },
    ),
  requestRotateTo: (direction) => set({ rotateTarget: direction }),
  clearRotateTarget: () => set({ rotateTarget: null }),
}));
