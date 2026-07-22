import type { TagoTrainRaw, TagoTrainRow } from '@/types/tago'

/** TAGO YYYYMMDDHHmmss → epoch ms (로컬 타임존) */
export function parseTagoPlanTime(raw?: string): number {
  if (!raw || raw.length < 12) return NaN
  const y = Number(raw.slice(0, 4))
  const m = Number(raw.slice(4, 6)) - 1
  const d = Number(raw.slice(6, 8))
  const h = Number(raw.slice(8, 10))
  const min = Number(raw.slice(10, 12))
  const s = raw.length >= 14 ? Number(raw.slice(12, 14)) : 0
  return new Date(y, m, d, h, min, s).getTime()
}

export function formatScheduleTime(ms: number): string {
  if (!Number.isFinite(ms)) return '--:--'
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function todayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export function normalizeTagoRow(raw: TagoTrainRaw): TagoTrainRow | null {
  const trainNo = raw.trainno?.trim()
  if (!trainNo) return null

  const depAtMs = parseTagoPlanTime(raw.depplandtime)
  const arrAtMs = parseTagoPlanTime(raw.arrplandtime)

  return {
    trainNo,
    gradeName: raw.traingradename?.trim() || '—',
    depPlaceName: raw.depplacename?.trim() || '—',
    arrPlaceName: raw.arrplacename?.trim() || '—',
    depPlanTime: raw.depplandtime ?? '',
    arrPlanTime: raw.arrplandtime ?? '',
    depAtMs,
    arrAtMs,
    adultCharge: raw.adultcharge ? Number(raw.adultcharge) : undefined,
  }
}

interface TagoApiEnvelope {
  response?: {
    header?: {
      resultCode?: string
      resultMsg?: string
    }
    body?: {
      items?: {
        item?: TagoTrainRaw | TagoTrainRaw[]
      }
    }
  }
}

export function parseTagoResponse(json: unknown): TagoTrainRow[] {
  const envelope = json as TagoApiEnvelope & {
    header?: { resultCode?: string; resultMsg?: string }
  }
  const header = envelope.response?.header ?? envelope.header
  if (header?.resultCode && header.resultCode !== '00') {
    throw new Error(header.resultMsg || `TAGO error ${header.resultCode}`)
  }

  const item = envelope.response?.body?.items?.item
  if (!item) return []

  const raws = Array.isArray(item) ? item : [item]
  return raws
    .map(normalizeTagoRow)
    .filter((row): row is TagoTrainRow => row !== null)
}

export function dedupeTrains(rows: TagoTrainRow[]): TagoTrainRow[] {
  const map = new Map<string, TagoTrainRow>()
  for (const row of rows) {
    const key = `${row.trainNo}|${row.depPlanTime}|${row.arrPlanTime}`
    map.set(key, row)
  }
  return [...map.values()]
}
