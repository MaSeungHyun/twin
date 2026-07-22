import { create } from 'zustand'

import { railwayAdapter } from '@/adapters'
import { countUnacked, mergeById } from '@/lib/alarms'
import type { AlarmEvent } from '@/types/events'

interface AlarmState {
  items: AlarmEvent[]
  unackedCount: number

  upsert: (event: AlarmEvent) => void
  setAll: (items: AlarmEvent[]) => void
  ack: (id: string) => void
}

function withCounts(items: AlarmEvent[]) {
  return { items, unackedCount: countUnacked(items) }
}

export const useAlarmStore = create<AlarmState>((set) => ({
  items: [],
  unackedCount: 0,

  upsert: (event) =>
    set((state) => {
      const idx = state.items.findIndex((item) => item.id === event.id)
      const items =
        idx >= 0
          ? state.items.map((item, i) => (i === idx ? event : item))
          : [event, ...state.items]
      return withCounts(items)
    }),

  setAll: (items) => set(withCounts(items)),

  ack: (id) => {
    const mockAdapter = railwayAdapter as { acknowledgeAlarm?: (alarmId: string) => void }
    mockAdapter.acknowledgeAlarm?.(id)

    const now = new Date().toISOString()
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id && !item.acknowledgedAt
          ? { ...item, acknowledgedAt: now, acknowledgedBy: 'operator' }
          : item,
      )
      return withCounts(items)
    })
  },
}))

export { mergeById }
