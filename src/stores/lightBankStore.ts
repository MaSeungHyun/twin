import { create } from "zustand";
import type { Light, Object3D } from "three";

export type DetachedLight = {
  light: Light;
  parent: Object3D;
};

type LightBankState = {
  entries: DetachedLight[];
  activeCount: number;
  setBank: (entries: DetachedLight[]) => void;
  addMany: (count?: number) => number;
  removeMany: (count?: number) => number;
  reset: () => void;
};

export const useLightBankStore = create<LightBankState>((set, get) => ({
  entries: [],
  activeCount: 0,

  setBank: (entries) => {
    set({ entries, activeCount: 0 });
    console.log("[LightBank] loaded", {
      total: entries.length,
      types: entries.reduce<Record<string, number>>((acc, { light }) => {
        const type = light.type || light.constructor.name;
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      }, {}),
    });
  },

  addMany: (count = 1) => {
    const { entries, activeCount } = get();
    const n = Math.max(1, Math.floor(count));
    const end = Math.min(activeCount + n, entries.length);

    for (let i = activeCount; i < end; i++) {
      const entry = entries[i];
      if (entry && !entry.light.parent) {
        entry.parent.add(entry.light);
      }
    }

    set({ activeCount: end });
    console.log("[LightBank] add", {
      added: end - activeCount,
      active: end,
      total: entries.length,
    });
    return end;
  },

  removeMany: (count = 1) => {
    const { entries, activeCount } = get();
    const n = Math.max(1, Math.floor(count));
    const next = Math.max(0, activeCount - n);

    for (let i = activeCount - 1; i >= next; i--) {
      entries[i]?.light.removeFromParent();
    }

    set({ activeCount: next });
    console.log("[LightBank] remove", {
      removed: activeCount - next,
      active: next,
      total: entries.length,
    });
    return next;
  },

  reset: () => {
    const { entries } = get();
    for (const { light } of entries) {
      light.removeFromParent();
    }
    set({ entries: [], activeCount: 0 });
  },
}));
