import { useUiStore } from '@/stores/uiStore'
import type { RightPanelMode } from '@/stores/uiStore'

import { CctvPanel } from '@/components/panels/CctvPanel'
import { RestroomPanel } from '@/components/panels/RestroomPanel'
import { TrainSchedulePanel } from '@/components/panels/TrainSchedulePanel'

const MODE_TITLES: Record<RightPanelMode, string> = {
  schedule: 'Train schedule',
  cctv: 'CCTV',
  restroom: 'Restroom occupancy',
}

export function RightPanel() {
  const mode = useUiStore((s) => s.rightPanelMode)

  return (
    <>
      {mode === 'schedule' && <TrainSchedulePanel />}
      {mode === 'cctv' && <CctvPanel />}
      {mode === 'restroom' && <RestroomPanel />}
    </>
  )
}

export function rightPanelTitle(mode: RightPanelMode): string {
  return MODE_TITLES[mode]
}
