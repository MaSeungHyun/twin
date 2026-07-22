/** 포털 일반(디코딩) 키 → 1회 인코딩. 인코딩 키(% 포함) → 그대로 사용 */
export function formatTagoServiceKey(raw: string): string {
  const key = raw.trim()
  return key.includes('%') ? key : encodeURIComponent(key)
}

export function readTagoServiceKeyFromEnv(): string {
  const raw = import.meta.env.VITE_TAGO_SERVICE_KEY?.trim()
  if (!raw) {
    throw new Error('Set VITE_TAGO_SERVICE_KEY in .env')
  }
  return raw
}

export function tagoKeyHintForHttpError(status: number, body: string): string | null {
  const text = body.trim()
  if (status === 500 && /unexpected errors/i.test(text)) {
    return [
      'Confirm TrainInfo (not TrainInfoService_v2) is approved on data.go.kr.',
      'Use PascalCase paths: GetCtyCodeList, GetStrtpntAlocFndTrainInfo.',
      'After approval, wait ~1 hour then retry.',
    ].join(' ')
  }
  if (/service\s*key.*not\s*regist/i.test(text)) {
    return 'Service key not synced yet — wait about 1 hour after approval, then retry.'
  }
  return status === 500
    ? 'Check API key activation for TrainInfo on data.go.kr'
    : null
}
