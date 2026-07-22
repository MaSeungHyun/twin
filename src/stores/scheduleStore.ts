import { create } from 'zustand'

import { tagoTrainClient } from '@/adapters/TagoTrainClient'
import { getStationBundle } from '@/data/stations/registry'
import type { TagoTrainRow } from '@/types/tago'

export type ScheduleTab = 'depart' | 'arrive'
export type ScheduleStatus = 'idle' | 'loading' | 'fresh' | 'stale' | 'error'

interface ScheduleState {
  status: ScheduleStatus
  tab: ScheduleTab
  gradeFilter: string
  departures: TagoTrainRow[]
  arrivals: TagoTrainRow[]
  lastUpdatedAt: string | null
  errorMessage: string | null

  setTab: (tab: ScheduleTab) => void
  setGradeFilter: (grade: string) => void
  refresh: (stationId?: string) => Promise<void>
}

let inflight: AbortController | null = null

function hasData(state: Pick<ScheduleState, 'departures' | 'arrivals'>) {
  return state.departures.length > 0 || state.arrivals.length > 0
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  status: 'idle',
  tab: 'depart',
  gradeFilter: 'ALL',
  departures: [],
  arrivals: [],
  lastUpdatedAt: null,
  errorMessage: null,

  setTab: (tab) => set({ tab }),

  setGradeFilter: (grade) => set({ gradeFilter: grade }),

  refresh: async (stationId = 'SEOUL') => {
    inflight?.abort()
    const controller = new AbortController()
    inflight = controller

    const prev = get()
    set({
      status: hasData(prev) ? prev.status : 'loading',
      errorMessage: null,
    })

    const nodeId = getStationBundle(stationId).config.tagoNodeId

    try {
      const { departures, arrivals } = await tagoTrainClient.fetchBoth(
        nodeId,
        undefined,
        controller.signal,
      )

      if (controller.signal.aborted) return

      set({
        status: 'fresh',
        departures,
        arrivals,
        lastUpdatedAt: new Date().toISOString(),
        errorMessage: null,
      })
    } catch (err) {
      if (controller.signal.aborted) return

      const message =
        err instanceof Error ? err.message : 'Failed to load TAGO schedule'
      const current = get()

      if (hasData(current)) {
        set({ status: 'stale', errorMessage: message })
      } else {
        set({ status: 'error', errorMessage: message })
      }
    } finally {
      if (inflight === controller) inflight = null
    }
  },
}))

export function filterByGrade(rows: TagoTrainRow[], gradeFilter: string) {
  if (gradeFilter === 'ALL') return rows
  return rows.filter((row) =>
    row.gradeName.toUpperCase().includes(gradeFilter.toUpperCase()),
  )
}

export function collectGrades(
  departures: TagoTrainRow[],
  arrivals: TagoTrainRow[],
): string[] {
  const set = new Set<string>()
  for (const row of [...departures, ...arrivals]) {
    if (row.gradeName && row.gradeName !== '—') set.add(row.gradeName)
  }
  return [...set].sort()
}
