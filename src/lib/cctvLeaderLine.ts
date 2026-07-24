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

export type ScreenAnchor = {
  x: number;
  y: number;
  /** frustum 밖(카메라 near/뒤) → viewport 가장자리로 투영 */
  offScreen: boolean;
};

function clampRayToViewportEdge(
  x: number,
  y: number,
  cx: number,
  cy: number,
  viewport: ViewportSize,
  padding: number,
): { x: number; y: number } {
  const dx = x - cx;
  const dy = y - cy;

  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    return { x: cx, y: cy };
  }

  const minX = padding;
  const maxX = viewport.width - padding;
  const minY = padding;
  const maxY = viewport.height - padding;

  const scaleX =
    dx > 0 ? (maxX - cx) / dx : dx < 0 ? (minX - cx) / dx : Infinity;
  const scaleY =
    dy > 0 ? (maxY - cy) / dy : dy < 0 ? (minY - cy) / dy : Infinity;

  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

/** world position → canvas 픽셀. near/뒤쪽이어도 viewport 가장자리에 표시 */
export function worldToScreen(
  x: number,
  y: number,
  z: number,
  viewport: ViewportSize,
): ScreenAnchor {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const inFrustum = z >= -1 && z <= 1;

  let sx = (x * 0.5 + 0.5) * viewport.width;
  let sy = (-y * 0.5 + 0.5) * viewport.height;

  if (inFrustum) {
    return { x: sx, y: sy, offScreen: false };
  }

  if (z > 1) {
    sx = cx + (cx - sx);
    sy = cy + (cy - sy);
  }

  const edge = clampRayToViewportEdge(sx, sy, cx, cy, viewport, DEFAULT_PADDING);
  return { x: edge.x, y: edge.y, offScreen: true };
}
