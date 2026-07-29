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
      const items = mergeById(snapshot, pending)
      setAll(items)
      snapshotReady = true
      pending.splice(0)
      // 초기 스냅샷에 미확인 알람이 있으면 push 때와 같이 패널 열기
      openPanelIfUnacked(items)
    })

    return () => {
      off()
      railwayAdapter.disconnect()
    }
  }, [setAll, upsert])
}

function openLeftPanel() {
  if (useUiStore.getState().leftPanelOpen) return
  useUiStore.setState({ leftPanelOpen: true })
}

/** 실시간 push — 긴급·높음만 자동 펼침 */
function maybeOpenPanel(event: AlarmEvent) {
  if (event.acknowledgedAt) return
  if (event.severity !== 'CRITICAL' && event.severity !== 'HIGH') return
  openLeftPanel()
}

/** 초기 스냅샷 — 미확인 알람이 하나라도 있으면 펼침 */
function openPanelIfUnacked(items: AlarmEvent[]) {
  if (!items.some((event) => !event.acknowledgedAt)) return
  openLeftPanel()
}
