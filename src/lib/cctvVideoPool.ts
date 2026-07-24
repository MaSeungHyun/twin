import { isMobileDevice } from "@/lib/device";

const pool = new Map<string, HTMLVideoElement>();
let poolRoot: HTMLElement | null = null;

/** 태블릿/iOS — DOM 밖 video는 preload가 거의 안 됨 */
function getPoolRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (!poolRoot) {
    poolRoot = document.createElement("div");
    poolRoot.id = "cctv-video-pool";
    poolRoot.setAttribute("aria-hidden", "true");
    poolRoot.style.cssText =
      "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;clip:rect(0,0,0,0)";
    document.body.appendChild(poolRoot);
  }
  return poolRoot;
}

function ensurePlaying(video: HTMLVideoElement) {
  const play = () => {
    void video.play().catch(() => {});
  };
  if (video.readyState >= 2) {
    play();
    return;
  }
  video.addEventListener("canplay", play, { once: true });
  video.load();
}

export function acquireCctvVideo(src: string): HTMLVideoElement {
  let video = pool.get(src);
  if (!video) {
    video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.loop = true;
    video.preload = "auto";
    video.src = src;
    getPoolRoot()?.appendChild(video);
    video.load();
    ensurePlaying(video);
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
  ensurePlaying(video);
  return video;
}

export function unmountPooledCctvVideo(container: HTMLElement) {
  const video = container.querySelector("video");
  if (!video?.parentElement) return;
  container.removeChild(video);
  getPoolRoot()?.appendChild(video);
}

const MOBILE_PRELOAD_STAGGER_MS = 200;

/** Office CCTV — GLB보다 먼저 호출 가능, 모바일은 순차 preload */
export function preloadOfficeVideos(urls: readonly string[]) {
  const stagger = isMobileDevice() ? MOBILE_PRELOAD_STAGGER_MS : 0;
  urls.forEach((url, index) => {
    if (stagger === 0) {
      acquireCctvVideo(url);
      return;
    }
    window.setTimeout(() => acquireCctvVideo(url), index * stagger);
  });
}

/** 모듈 로드 직후 idle 시점에 warm-up */
export function scheduleOfficeVideoPreload(urls: readonly string[]) {
  if (typeof window === "undefined") return;
  const run = () => preloadOfficeVideos(urls);
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 1500 });
  } else {
    window.setTimeout(run, 0);
  }
}
