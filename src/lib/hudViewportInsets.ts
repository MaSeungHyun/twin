/** HUD shell-top / shell-bottom → canvas 픽셀 (CSS @theme 변수) */
export function getHudViewportInsets(): { top: number; bottom: number } {
  if (typeof document === "undefined") {
    return { top: 86, bottom: 84 };
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);
  const rootFontPx = parseFloat(style.fontSize) || 16;

  return {
    top: parseCssLength(style.getPropertyValue("--shell-top"), rootFontPx) - 30,
    bottom:
      parseCssLength(style.getPropertyValue("--shell-bottom"), rootFontPx) - 30,
  };
}

function parseCssLength(value: string, rootFontPx: number): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (trimmed.endsWith("rem")) return parseFloat(trimmed) * rootFontPx;
  if (trimmed.endsWith("px")) return parseFloat(trimmed);
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : 0;
}
