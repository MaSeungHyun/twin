import { useEffect, type RefObject } from 'react'

/** F-09 — video 1개 생명주기: enabled=false 또는 unmount 시 src 해제 */
export function useVideoStream(
  videoRef: RefObject<HTMLVideoElement | null>,
  streamUrl: string | undefined,
  enabled: boolean,
) {
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!enabled || !streamUrl) {
      video.pause()
      video.removeAttribute('src')
      video.load()
      return
    }

    video.src = streamUrl
    void video.play().catch(() => {
      /* autoplay blocked or missing asset — placeholder UI handles display */
    })

    return () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [videoRef, streamUrl, enabled])
}
