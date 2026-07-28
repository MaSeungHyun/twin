export type HudViewportInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** HUD shell + 열린 오버레이 패널 → canvas 픽셀 inset */
export function getHudViewportInsets(): HudViewportInsets {
  if (typeof document === "undefined") {
    return { top: 86, bottom: 84, left: 0, right: 0 };
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);
  const rootFontPx = parseFloat(style.fontSize) || 16;

  const side = measureOverlayPanelSideInsets();

  return {
    top: parseCssLength(style.getPropertyValue("--shell-top"), rootFontPx) - 30,
    bottom:
      parseCssLength(style.getPropertyValue("--shell-bottom"), rootFontPx) - 30,
    left: side.left,
    right: side.right,
  };
}

/** 열린 left/right 패널이 마커 호스트를 가리는 폭 */
function measureOverlayPanelSideInsets(): { left: number; right: number } {
  const host =
    document.querySelector<HTMLElement>('[aria-label="CCTV markers"]') ??
    document.querySelector("canvas")?.parentElement ??
    null;

  if (!host) return { left: 0, right: 0 };

  const hostRect = host.getBoundingClientRect();
  if (hostRect.width <= 0) return { left: 0, right: 0 };

  let left = 0;
  let right = 0;

  const leftPanel = document.querySelector(
    ".overlay-panel--left.overlay-panel--open",
  );
  if (leftPanel) {
    const r = leftPanel.getBoundingClientRect();
    left = Math.max(0, Math.min(hostRect.width, r.right - hostRect.left));
  }

  const rightPanel = document.querySelector(
    ".overlay-panel--right.overlay-panel--open",
  );
  if (rightPanel) {
    const r = rightPanel.getBoundingClientRect();
    right = Math.max(0, Math.min(hostRect.width, hostRect.right - r.left));
  }

  return { left, right };
}

function parseCssLength(value: string, rootFontPx: number): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (trimmed.endsWith("rem")) return parseFloat(trimmed) * rootFontPx;
  if (trimmed.endsWith("px")) return parseFloat(trimmed);
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : 0;
}
