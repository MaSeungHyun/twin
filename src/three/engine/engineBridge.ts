import type { AlarmEvent } from '@/types/events'

import { StationEngine } from './StationEngine'

let activeEngine: StationEngine | null = null
let generation = 0

export function registerEngine(instance: StationEngine | null): number {
  if (activeEngine && activeEngine !== instance) {
    activeEngine.stop()
    activeEngine.dispose()
    activeEngine = null
  }
  activeEngine = instance
  if (instance) generation += 1
  return generation
}

/** cleanup 시 자기 인스턴스일 때만 해제 — Strict Mode 이중 mount 방어 */
export function unregisterEngine(instance: StationEngine): void {
  if (activeEngine === instance) {
    activeEngine = null
  }
}

export function getEngineGeneration(): number {
  return generation
}

function withEngine<T>(fn: (eng: StationEngine) => T): T | undefined {
  const eng = activeEngine
  if (!eng || eng.disposed) return undefined
  return fn(eng)
}

/** M1~M2 noop — M3: ZoneManager.flyTo */
export function flyToZone(zoneId: string): void {
  withEngine((_eng) => {
    void zoneId
  })
}

/** M1~M2 noop — M3: flyTo + highlight + device pulse */
export function focusAlarm(event: AlarmEvent): void {
  withEngine((_eng) => {
    void event
  })
}

/** M1~M2 noop — M3: flyTo device + highlight stall/CCTV anchor */
export function focusDevice(deviceId: string): void {
  withEngine((_eng) => {
    void deviceId
  })
}
