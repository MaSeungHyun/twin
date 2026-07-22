import { useEffect, useState } from 'react'

import { formatClock } from '@/lib/time'

export interface NowState {
  /** epoch ms — 실시간; 추후 데모 모드에서 가상 시각으로 대체 가능 */
  nowMs: number
  label: string
}

export function useNow(tickMs = 1000): NowState {
  const [state, setState] = useState<NowState>(() => {
    const nowMs = Date.now()
    return { nowMs, label: formatClock(new Date(nowMs)) }
  })

  useEffect(() => {
    const tick = () => {
      const nowMs = Date.now()
      setState({ nowMs, label: formatClock(new Date(nowMs)) })
    }
    tick()
    const id = setInterval(tick, tickMs)
    return () => clearInterval(id)
  }, [tickMs])

  return state
}
