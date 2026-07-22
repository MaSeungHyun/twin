import {
  clampCongestionPercent,
  congestionLevelFromPercent,
} from '@/adapters/normalize'
import type { IRailwayStationAdapter } from '@/adapters/types'
import { getMockScenarios } from '@/adapters/mock/scenarios'
import type { ScenarioAlarmTemplate } from '@/adapters/mock/types'
import { getStationBundle } from '@/data/stations/registry'
import type {
  AlarmEvent,
  CctvStatusEvent,
  SensorEvent,
  SensorSnapshot,
  ToiletEvent,
  ToiletStallState,
} from '@/types/events'
import type { DeviceMetadata, StationConfig, TracksFile } from '@/types/station'

type Listener<T> = (payload: T) => void

function zoneName(config: StationConfig, zoneId: string): string {
  return config.zones.find((z) => z.zoneId === zoneId)?.name ?? zoneId
}

function deviceLabel(devices: DeviceMetadata[], deviceId?: string): string | undefined {
  if (!deviceId) return undefined
  return devices.find((d) => d.deviceId === deviceId)?.label
}

function makeAlarmId(): string {
  return `al-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function buildAlarm(
  stationId: string,
  config: StationConfig,
  devices: DeviceMetadata[],
  template: ScenarioAlarmTemplate,
  occurredAt = new Date().toISOString(),
): AlarmEvent {
  const congestionPercent =
    template.congestionPercent !== undefined
      ? clampCongestionPercent(template.congestionPercent)
      : undefined

  return {
    id: makeAlarmId(),
    stationId,
    type: template.type,
    severity: template.severity,
    zoneId: template.zoneId,
    zoneName: zoneName(config, template.zoneId),
    deviceId: template.deviceId,
    deviceName: deviceLabel(devices, template.deviceId),
    title: template.title,
    message: template.message,
    congestionPercent,
    congestionLevel:
      congestionPercent !== undefined
        ? congestionLevelFromPercent(congestionPercent)
        : undefined,
    occurredAt,
    acknowledgedAt: null,
    acknowledgedBy: null,
    source: 'mock',
  }
}

export class MockRailwayAdapter implements IRailwayStationAdapter {
  readonly contractVersion = 1

  private stationId: string | null = null
  private alarms: AlarmEvent[] = []
  private sensorState = new Map<string, SensorSnapshot>()
  private toiletState = new Map<string, ToiletStallState>()
  private cctvState = new Map<string, CctvStatusEvent>()

  private alarmListeners = new Set<Listener<AlarmEvent>>()
  private sensorListeners = new Set<Listener<SensorEvent>>()
  private toiletListeners = new Set<Listener<ToiletEvent>>()
  private cctvListeners = new Set<Listener<CctvStatusEvent>>()

  private timers: ReturnType<typeof setInterval>[] = []
  private scenarioTimers: ReturnType<typeof setTimeout>[] = []

  async connect(stationId: string): Promise<void> {
    this.disconnect()
    this.stationId = stationId

    const bundle = getStationBundle(stationId)
    this.seedSnapshots(bundle.config, bundle.devices)
    this.seedInitialAlarms(bundle)
    this.startSimulation(bundle)
    this.scheduleScenarios(stationId, bundle)
  }

  disconnect(): void {
    for (const t of this.timers) clearInterval(t)
    for (const t of this.scenarioTimers) clearTimeout(t)
    this.timers = []
    this.scenarioTimers = []
    this.stationId = null
  }

  async getStationConfig(stationId: string): Promise<StationConfig> {
    return getStationBundle(stationId).config
  }

  async getDevices(stationId: string): Promise<DeviceMetadata[]> {
    return getStationBundle(stationId).devices.filter((d) => d.enabled)
  }

  async getTracks(stationId: string): Promise<TracksFile | null> {
    return getStationBundle(stationId).tracks
  }

  async getActiveAlarms(stationId: string): Promise<AlarmEvent[]> {
    if (this.stationId !== stationId) {
      const bundle = getStationBundle(stationId)
      return this.buildSeedAlarms(bundle)
    }
    return [...this.alarms].filter((a) => !a.acknowledgedAt)
  }

  async getSensorSnapshot(stationId: string, zoneId?: string): Promise<SensorSnapshot[]> {
    if (this.stationId !== stationId) {
      const bundle = getStationBundle(stationId)
      this.seedSnapshots(bundle.config, bundle.devices)
    }
    const rows = [...this.sensorState.values()]
    return zoneId ? rows.filter((r) => r.zoneId === zoneId) : rows
  }

  async getToiletSnapshot(stationId: string): Promise<ToiletStallState[]> {
    if (this.stationId !== stationId) {
      const bundle = getStationBundle(stationId)
      this.seedToilet(bundle.devices)
    }
    return [...this.toiletState.values()]
  }

  subscribeAlarms(cb: (event: AlarmEvent) => void) {
    this.alarmListeners.add(cb)
    return () => this.alarmListeners.delete(cb)
  }

  subscribeSensors(cb: (event: SensorEvent) => void) {
    this.sensorListeners.add(cb)
    return () => this.sensorListeners.delete(cb)
  }

  subscribeToilet(cb: (event: ToiletEvent) => void) {
    this.toiletListeners.add(cb)
    return () => this.toiletListeners.delete(cb)
  }

  subscribeCctvStatus(cb: (event: CctvStatusEvent) => void) {
    this.cctvListeners.add(cb)
    return () => this.cctvListeners.delete(cb)
  }

  acknowledgeAlarm(alarmId: string, by = 'operator'): void {
    const alarm = this.alarms.find((a) => a.id === alarmId)
    if (!alarm || alarm.acknowledgedAt) return
    alarm.acknowledgedAt = new Date().toISOString()
    alarm.acknowledgedBy = by
  }

  private seedSnapshots(config: StationConfig, devices: DeviceMetadata[]) {
    this.sensorState.clear()
    this.cctvState.clear()

    const congestionDevices = devices.filter(
      (d) => d.category === 'congestion' || d.category === 'safety-line',
    )

    congestionDevices.forEach((device, index) => {
      const base =
        device.category === 'congestion'
          ? 28 + (index % 5) * 9
          : 12 + (index % 3) * 4
      const congestionPercent = clampCongestionPercent(base)
      const snapshot: SensorSnapshot = {
        zoneId: device.zoneId,
        deviceId: device.deviceId,
        label: device.label,
        congestionPercent,
        congestionLevel: congestionLevelFromPercent(congestionPercent),
        occupantCount:
          device.capacity !== undefined
            ? Math.round((congestionPercent / 100) * device.capacity)
            : undefined,
        capacity: device.capacity,
        updatedAt: new Date().toISOString(),
      }
      this.sensorState.set(device.deviceId, snapshot)

      const cctv: CctvStatusEvent = {
        stationId: config.stationId,
        deviceId: device.deviceId,
        zoneId: device.zoneId,
        status: device.deviceId === 'sld-005' ? 'CONNECTING' : 'ONLINE',
        updatedAt: new Date().toISOString(),
        source: 'mock',
      }
      this.cctvState.set(device.deviceId, cctv)
    })

    this.seedToilet(devices)
  }

  private seedToilet(devices: DeviceMetadata[]) {
    this.toiletState.clear()
    const stalls = devices.filter((d) => d.deviceType === 'RESTROOM_STALL')
    stalls.forEach((stall, index) => {
      const status =
        index === 1 ? 'OCCUPIED' : index === 3 ? 'VACANT' : index === 0 ? 'VACANT' : 'VACANT'
      this.toiletState.set(stall.deviceId, {
        deviceId: stall.deviceId,
        zoneId: stall.zoneId,
        label: stall.label,
        status,
        updatedAt: new Date().toISOString(),
      })
    })
  }

  private buildSeedAlarms(bundle: ReturnType<typeof getStationBundle>): AlarmEvent[] {
    const { config, devices } = bundle
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    return [
      buildAlarm(bundle.config.stationId, config, devices, {
        type: 'CONGESTION_THRESHOLD',
        severity: 'MEDIUM',
        zoneId: 'transfer',
        deviceId: 'cm-003',
        title: '혼잡 주의',
        message: '환승통로 혼잡도가 평소보다 다소 높습니다.',
        congestionPercent: 58,
      }, fiveMinAgo),
    ]
  }

  private seedInitialAlarms(bundle: ReturnType<typeof getStationBundle>) {
    this.alarms = this.buildSeedAlarms(bundle)
  }

  private pushAlarm(alarm: AlarmEvent) {
    this.alarms = [alarm, ...this.alarms].slice(0, 50)
    for (const cb of this.alarmListeners) cb(alarm)
  }

  private emitSensor(event: SensorEvent) {
    this.sensorState.set(event.deviceId, {
      zoneId: event.zoneId,
      deviceId: event.deviceId,
      label: deviceLabel(
        getStationBundle(event.stationId).devices,
        event.deviceId,
      ) ?? event.deviceId,
      congestionPercent: event.congestionPercent,
      congestionLevel: event.congestionLevel,
      occupantCount: event.occupantCount,
      capacity: event.capacity,
      updatedAt: event.updatedAt,
    })
    for (const cb of this.sensorListeners) cb(event)
  }

  private emitToilet(event: ToiletEvent) {
    this.toiletState.set(event.deviceId, {
      deviceId: event.deviceId,
      zoneId: event.zoneId,
      label: event.label,
      status: event.status,
      updatedAt: event.updatedAt,
    })
    for (const cb of this.toiletListeners) cb(event)
  }

  private emitCctv(event: CctvStatusEvent) {
    this.cctvState.set(event.deviceId, event)
    for (const cb of this.cctvListeners) cb(event)
  }

  private startSimulation(bundle: ReturnType<typeof getStationBundle>) {
    const { config, devices } = bundle
    const stationId = config.stationId

    const sensorTick = setInterval(() => {
      const congestionDevices = devices.filter((d) => d.category === 'congestion')
      const pick = congestionDevices[Math.floor(Math.random() * congestionDevices.length)]
      if (!pick) return

      const prev = this.sensorState.get(pick.deviceId)
      const delta = (Math.random() - 0.45) * 8
      const next = clampCongestionPercent((prev?.congestionPercent ?? 40) + delta)
      const event: SensorEvent = {
        stationId,
        zoneId: pick.zoneId,
        deviceId: pick.deviceId,
        congestionPercent: next,
        congestionLevel: congestionLevelFromPercent(next),
        occupantCount:
          pick.capacity !== undefined
            ? Math.round((next / 100) * pick.capacity)
            : undefined,
        capacity: pick.capacity,
        updatedAt: new Date().toISOString(),
        source: 'mock',
      }
      this.emitSensor(event)
    }, 4000)
    this.timers.push(sensorTick)

    const cctvTick = setInterval(() => {
      const cctv = this.cctvState.get('sld-005')
      if (cctv?.status === 'CONNECTING') {
        this.emitCctv({
          ...cctv,
          status: 'ONLINE',
          updatedAt: new Date().toISOString(),
        })
      }
    }, 15000)
    this.timers.push(cctvTick)

    const toiletTick = setInterval(() => {
      const stalls = devices.filter((d) => d.deviceType === 'RESTROOM_STALL')
      const pick = stalls[Math.floor(Math.random() * stalls.length)]
      if (!pick) return
      const current = this.toiletState.get(pick.deviceId)
      if (!current || current.status === 'EMERGENCY') return
      const nextStatus = current.status === 'VACANT' ? 'OCCUPIED' : 'VACANT'
      this.emitToilet({
        stationId,
        zoneId: pick.zoneId,
        deviceId: pick.deviceId,
        label: pick.label,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
        source: 'mock',
      })
    }, 20000)
    this.timers.push(toiletTick)
  }

  private scheduleScenarios(
    stationId: string,
    bundle: ReturnType<typeof getStationBundle>,
  ) {
    const scenarios = getMockScenarios(stationId)
    if (!scenarios) return

    const { config, devices } = bundle
    for (const step of scenarios.scenarios) {
      const timer = setTimeout(() => {
        const alarm = buildAlarm(config.stationId, config, devices, step.alarm)
        this.pushAlarm(alarm)

        if (step.alarm.type === 'TOILET_EMERGENCY' && step.alarm.deviceId) {
          const stall = devices.find((d) => d.deviceId === step.alarm.deviceId)
          if (stall) {
            this.emitToilet({
              stationId: config.stationId,
              zoneId: stall.zoneId,
              deviceId: stall.deviceId,
              label: stall.label,
              status: 'EMERGENCY',
              updatedAt: new Date().toISOString(),
              source: 'mock',
            })
          }
        }
      }, step.delayMs)
      this.scenarioTimers.push(timer)
    }
  }
}
