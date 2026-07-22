import { create } from 'zustand'

export type WasteInstance = {
  id: string
  position: [number, number, number]
}

function randomPosition(): [number, number, number] {
  const axis = () => Math.random() * 6 - 3
  return [axis(), axis(), axis()]
}

interface WasteModelState {
  instances: WasteInstance[]
  spawn: () => void
  clear: () => void
}

export const useWasteModelStore = create<WasteModelState>((set) => ({
  instances: [],
  spawn: () =>
    set((state) => ({
      instances: [
        ...state.instances,
        {
          id: `waste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          position: randomPosition(),
        },
      ],
    })),
  clear: () => set({ instances: [] }),
}))
