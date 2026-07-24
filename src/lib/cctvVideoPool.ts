const pool = new Map<string, HTMLVideoElement>();

export function acquireCctvVideo(src: string): HTMLVideoElement {
  let video = pool.get(src);
  if (!video) {
    video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";
    video.src = src;
    video.load();
    void video.play().catch(() => {});
    pool.set(src, video);
  }
  return video;
}

type MountPooledVideoOptions = {
  className?: string;
  controls?: boolean;
};

export function mountPooledCctvVideo(
  container: HTMLElement,
  src: string,
  { className, controls = false }: MountPooledVideoOptions = {},
) {
  const video = acquireCctvVideo(src);
  video.controls = controls;
  if (className) video.className = className;
  if (video.parentElement !== container) {
    container.replaceChildren(video);
  }
  void video.play().catch(() => {});
  return video;
}

export function unmountPooledCctvVideo(container: HTMLElement) {
  const video = container.querySelector("video");
  if (video?.parentElement === container) {
    container.removeChild(video);
  }
}

/** Office CCTV — Html 마운트 전 미리 다운로드 */
export function preloadOfficeVideos(urls: string[]) {
  for (const url of urls) acquireCctvVideo(url);
}
