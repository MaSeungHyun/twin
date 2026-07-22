import { useEffect } from 'react'

import { railwayAdapter } from '@/adapters'
import { mergeById } from '@/lib/alarms'
import { useAlarmStore } from '@/stores/alarmStore'
import { useUiStore } from '@/stores/uiStore'
import type { AlarmEvent } from '@/types/events'

const STATION_ID = 'SEOUL'

/** Mock 구독 → alarmStore (스냅샷·push 레이스 방지) */
export function useAlarms() {
  const upsert = useAlarmStore((s) => s.upsert)
  const setAll = useAlarmStore((s) => s.setAll)

  useEffect(() => {
    const pending: AlarmEvent[] = []
    let snapshotReady = false

    void railwayAdapter.connect(STATION_ID)

    const off = railwayAdapter.subscribeAlarms((event) => {
      if (snapshotReady) {
        upsert(event)
        maybeOpenPanel(event)
      } else {
        pending.push(event)
      }
    })

    void railwayAdapter.getActiveAlarms(STATION_ID).then((snapshot) => {
      setAll(mergeById(snapshot, pending))
      snapshotReady = true
      for (const event of pending.splice(0)) {
        upsert(event)
        maybeOpenPanel(event)
      }
    })

    return () => {
      off()
      railwayAdapter.disconnect()
    }
  }, [setAll, upsert])
}

function maybeOpenPanel(event: AlarmEvent) {
  if (event.acknowledgedAt) return
  if (event.severity !== 'CRITICAL' && event.severity !== 'HIGH') return

  const ui = useUiStore.getState()
  if (ui.leftPanelOpen) return
  useUiStore.setState({ leftPanelOpen: true })
}
