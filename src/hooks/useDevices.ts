import { useEffect } from 'react'

import { railwayAdapter } from '@/adapters'
import { useDeviceStore } from '@/stores/deviceStore'

const STATION_ID = 'SEOUL'

/** Mock 디바이스·CCTV 상태·재실 구독 → deviceStore */
export function useDevices() {
  const hydrate = useDeviceStore((s) => s.hydrate)
  const setToiletSnapshot = useDeviceStore((s) => s.setToiletSnapshot)
  const patchCctvStatus = useDeviceStore((s) => s.patchCctvStatus)
  const patchToilet = useDeviceStore((s) => s.patchToilet)

  useEffect(() => {
    void railwayAdapter.getDevices(STATION_ID).then(hydrate)
    void railwayAdapter.getToiletSnapshot(STATION_ID).then(setToiletSnapshot)

    const offCctv = railwayAdapter.subscribeCctvStatus(patchCctvStatus)
    const offToilet = railwayAdapter.subscribeToilet(patchToilet)

    return () => {
      offCctv()
      offToilet()
    }
  }, [hydrate, patchCctvStatus, patchToilet, setToiletSnapshot])
}
