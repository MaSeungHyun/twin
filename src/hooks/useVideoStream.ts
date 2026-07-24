import { useEffect, type RefObject } from "react";

function resolveVideo(
  videoOrRef: RefObject<HTMLVideoElement | null> | HTMLVideoElement | null,
): HTMLVideoElement | null {
  if (!videoOrRef) return null;
  if ("current" in videoOrRef) return videoOrRef.current;
  return videoOrRef;
}

function attachStream(video: HTMLVideoElement, streamUrl: string) {
  video.preload = "auto";
  if (video.src !== streamUrl) {
    video.src = streamUrl;
  }
  void video.play().catch(() => {
    /* autoplay blocked — canplay 이벤트에서 재시도 */
  });
}

function detachStream(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute("src");
  video.load();
}

/** video 1개 생명주기: enabled=false 또는 unmount 시 src 해제 */
export function useVideoStream(
  videoOrRef: RefObject<HTMLVideoElement | null> | HTMLVideoElement | null,
  streamUrl: string | undefined,
  enabled: boolean,
) {
  useEffect(() => {
    const video = resolveVideo(videoOrRef);
    if (!video) return;

    if (!enabled || !streamUrl) {
      detachStream(video);
      return;
    }

    attachStream(video, streamUrl);

    const onCanPlay = () => {
      void video.play().catch(() => {});
    };
    video.addEventListener("canplay", onCanPlay);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      detachStream(video);
    };
  }, [videoOrRef, streamUrl, enabled]);
}
