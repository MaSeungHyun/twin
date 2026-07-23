import { create } from "zustand";
import type { Light, Object3D } from "three";

export type DetachedLight = {
  light: Light;
  parent: Object3D;
};

type LightBankState = {
  entries: DetachedLight[];
  /** 씬에 다시 붙인 개수 */
  activeCount: number;
  setBank: (entries: DetachedLight[]) => void;
  /** 대기 중인 라이트를 count개까지 한 번에 추가. 성공 시 새 activeCount */
  addMany: (count?: number) => number | null;
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
    if (activeCount >= entries.length) return null;

    const n = Math.max(1, Math.floor(count));
    const end = Math.min(activeCount + n, entries.length);

    for (let i = activeCount; i < end; i++) {
      const entry = entries[i];
      if (entry) entry.parent.add(entry.light);
    }

    set({ activeCount: end });
    console.log("[LightBank] added batch", {
      added: end - activeCount,
      active: end,
      total: entries.length,
    });

    return end;
  },

  reset: () => {
    const { entries, activeCount } = get();
    for (let i = activeCount; i < entries.length; i++) {
      entries[i]?.light.dispose?.();
    }
    set({ entries: [], activeCount: 0 });
  },
}));
