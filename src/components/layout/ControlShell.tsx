import { useCallback, useEffect } from 'react'

import { HeaderBar } from '@/components/layout/HeaderBar'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { AlarmPanel } from '@/components/panels/AlarmPanel'
import { RightPanel, rightPanelTitle } from '@/components/panels/RightPanel'
import { useAlarms } from '@/hooks/useAlarms'
import { useDevices } from '@/hooks/useDevices'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useUiStore } from '@/stores/uiStore'
import { ThreeViewport } from '@/three/ThreeViewport'

export function ControlShell() {
  const leftPanelOpen = useUiStore((s) => s.leftPanelOpen)
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen)
  const rightPanelMode = useUiStore((s) => s.rightPanelMode)
  const toggleLeftPanel = useUiStore((s) => s.toggleLeftPanel)
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel)
  const dismissFocus = useUiStore((s) => s.dismissFocus)

  const handleEscape = useCallback(() => dismissFocus(), [dismissFocus])
  useEscapeKey(handleEscape)
  useAlarms()
  useDevices()

  const refreshSchedule = useScheduleStore((s) => s.refresh)
  useEffect(() => {
    void refreshSchedule()
  }, [refreshSchedule])

  return (
    <div className="app-shell">
      <HeaderBar />

      <div className="app-shell__viewport">
        <ThreeViewport />
      </div>

      <div className="app-shell__overlay">
        <OverlayPanel
          side="left"
          open={leftPanelOpen}
          onToggle={toggleLeftPanel}
          collapsedLabel="Alarms"
          title="Alarms"
        >
          <AlarmPanel />
        </OverlayPanel>

        <OverlayPanel
          side="right"
          open={rightPanelOpen}
          onToggle={toggleRightPanel}
          collapsedLabel="Panels"
          title={rightPanelTitle(rightPanelMode)}
        >
          <RightPanel />
        </OverlayPanel>
      </div>
    </div>
  )
}
