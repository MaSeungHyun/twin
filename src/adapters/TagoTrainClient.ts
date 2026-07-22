import {
  TAGO_API_BASE,
  TAGO_MAJOR_HUBS,
  TAGO_OPS,
} from '@/adapters/tago/constants'
import {
  dedupeTrains,
  parseTagoResponse,
  todayYmd,
} from '@/adapters/tago/parse'
import {
  formatTagoServiceKey,
  readTagoServiceKeyFromEnv,
  tagoKeyHintForHttpError,
} from '@/adapters/tago/serviceKey'
import type { TagoTrainRow } from '@/types/tago'

type QueryParams = Record<string, string | number | undefined>

function buildTagoUrl(operation: string, params: QueryParams): string {
  const key = formatTagoServiceKey(readTagoServiceKeyFromEnv())
  const parts = [
    `serviceKey=${key}`,
    '_type=json',
    `numOfRows=${params.numOfRows ?? 100}`,
    `pageNo=${params.pageNo ?? 1}`,
  ]

  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || name === 'numOfRows' || name === 'pageNo') continue
    parts.push(`${name}=${encodeURIComponent(String(value))}`)
  }

  return `${TAGO_API_BASE}/${operation}?${parts.join('&')}`
}

async function tagoGet(
  operation: string,
  params: QueryParams,
  signal?: AbortSignal,
): Promise<TagoTrainRow[]> {
  const res = await fetch(buildTagoUrl(operation, params), { signal })
  const text = await res.text()

  if (!res.ok) {
    const detail = text.trim().slice(0, 160) || `TAGO HTTP ${res.status}`
    const hint = tagoKeyHintForHttpError(res.status, text)
    throw new Error([detail, hint].filter(Boolean).join(' — '))
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('TAGO returned non-JSON response')
  }

  return parseTagoResponse(json)
}

export class TagoTrainClient {
  /** 출발 편 — TAGO는 arrPlaceId 필수; 역 → 주요 종착 허브 병렬 조회 */
  async fetchDepartures(
    depPlaceId: string,
    depPlandTime = todayYmd(),
    signal?: AbortSignal,
  ): Promise<TagoTrainRow[]> {
    const batches = await Promise.all(
      TAGO_MAJOR_HUBS.map((arrPlaceId) =>
        tagoGet(
          TAGO_OPS.timetable,
          { depPlaceId, arrPlaceId, depPlandTime },
          signal,
        ).catch(() => [] as TagoTrainRow[]),
      ),
    )

    return dedupeTrains(batches.flat()).sort((a, b) => a.depAtMs - b.depAtMs)
  }

  /**
   * 도착 편 — TAGO는 dep + arr 모두 필수.
   * 주요 출발 허브 → 이 역 구간을 조회해 병합.
   */
  async fetchArrivals(
    arrPlaceId: string,
    depPlandTime = todayYmd(),
    signal?: AbortSignal,
  ): Promise<TagoTrainRow[]> {
    const batches = await Promise.all(
      TAGO_MAJOR_HUBS.map((depPlaceId) =>
        tagoGet(
          TAGO_OPS.timetable,
          { depPlaceId, arrPlaceId, depPlandTime },
          signal,
        ).catch(() => [] as TagoTrainRow[]),
      ),
    )

    return dedupeTrains(batches.flat()).sort((a, b) => a.arrAtMs - b.arrAtMs)
  }

  async fetchBoth(
    stationNodeId: string,
    depPlandTime = todayYmd(),
    signal?: AbortSignal,
  ): Promise<{ departures: TagoTrainRow[]; arrivals: TagoTrainRow[] }> {
    const [departures, arrivals] = await Promise.all([
      this.fetchDepartures(stationNodeId, depPlandTime, signal),
      this.fetchArrivals(stationNodeId, depPlandTime, signal),
    ])
    return { departures, arrivals }
  }
}

export const tagoTrainClient = new TagoTrainClient()
