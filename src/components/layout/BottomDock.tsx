import { cn } from '@/lib/utils'
import { useAlarmStore } from '@/stores/alarmStore'
import { useUiStore } from '@/stores/uiStore'
import type { RightPanelMode } from '@/stores/uiStore'

const dockPointerHandlers = {
  onPointerEnter: () => useUiStore.getState().enterPanelPointer(),
  onPointerLeave: () => useUiStore.getState().leavePanelPointer(),
}

function openRight(mode: RightPanelMode) {
  const ui = useUiStore.getState()
  if (ui.rightPanelOpen && ui.rightPanelMode === mode) {
    useUiStore.setState({ rightPanelOpen: false, cctvExpanded: false })
    return
  }
  useUiStore.setState({
    rightPanelMode: mode,
    rightPanelOpen: true,
    cctvExpanded: false,
  })
}

export function BottomDock() {
  const leftPanelOpen = useUiStore((s) => s.leftPanelOpen)
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen)
  const rightPanelMode = useUiStore((s) => s.rightPanelMode)
  const toggleLeftPanel = useUiStore((s) => s.toggleLeftPanel)
  const unackedCount = useAlarmStore((s) => s.unackedCount)

  return (
    <nav className="hud-dock" aria-label="패널" {...dockPointerHandlers}>
      <button
        type="button"
        className={cn(
          'hud-dock__btn',
          leftPanelOpen && 'hud-dock__btn--active',
          unackedCount > 0 && !leftPanelOpen && 'hud-dock__btn--attention',
        )}
        onClick={toggleLeftPanel}
        aria-pressed={leftPanelOpen}
      >
        <span className="hud-dock__label">알람</span>
        {unackedCount > 0 && (
          <span className="hud-dock__badge" aria-label={`미확인 ${unackedCount}`}>
            {unackedCount > 99 ? '99+' : unackedCount}
          </span>
        )}
      </button>

      <span className="hud-dock__divider" aria-hidden />

      <button
        type="button"
        className={cn(
          'hud-dock__btn',
          rightPanelOpen && rightPanelMode === 'schedule' && 'hud-dock__btn--active',
        )}
        onClick={() => openRight('schedule')}
        aria-pressed={rightPanelOpen && rightPanelMode === 'schedule'}
      >
        <span className="hud-dock__label">전광판</span>
      </button>
    </nav>
  )
}
