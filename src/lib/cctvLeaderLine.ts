type ViewportSize = { width: number; height: number };

export type PanelClampResult = {
  offsetX: number;
  offsetY: number;
  clamped: boolean;
};

const DEFAULT_PADDING = 16;

/** 패널 중심을 viewport 안으로 클램프 */
export function clampPanelToViewport(
  anchorX: number,
  anchorY: number,
  panelWidth: number,
  panelHeight: number,
  viewport: ViewportSize,
  padding = DEFAULT_PADDING,
): PanelClampResult {
  const halfW = panelWidth / 2;
  const halfH = panelHeight / 2;

  const minX = padding + halfW;
  const maxX = viewport.width - padding - halfW;
  const minY = padding + halfH;
  const maxY = viewport.height - padding - halfH;

  const clampedX =
    minX > maxX
      ? viewport.width / 2
      : Math.min(Math.max(anchorX, minX), maxX);
  const clampedY =
    minY > maxY
      ? viewport.height / 2
      : Math.min(Math.max(anchorY, minY), maxY);

  return {
    offsetX: clampedX - anchorX,
    offsetY: clampedY - anchorY,
    clamped: clampedX !== anchorX || clampedY !== anchorY,
  };
}

/** world position → canvas 픽셀 (drei Html과 동일 기준) */
export function worldToScreen(
  x: number,
  y: number,
  z: number,
  viewport: ViewportSize,
): { x: number; y: number; visible: boolean } {
  return {
    x: (x * 0.5 + 0.5) * viewport.width,
    y: (-y * 0.5 + 0.5) * viewport.height,
    visible: z >= -1 && z <= 1,
  };
}
