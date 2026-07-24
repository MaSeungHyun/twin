import {
  clampPanelToViewport,
  type PanelClampResult,
} from "@/lib/cctvLeaderLine";

type ViewportSize = { width: number; height: number };

export type MarkerLayoutUpdate = {
  anchorX: number;
  anchorY: number;
  width: number;
  height: number;
  base: PanelClampResult;
  clamped: boolean;
  active: boolean;
  panel: HTMLDivElement | null;
  line: SVGLineElement | null;
};

type MarkerEntry = MarkerLayoutUpdate & {
  id: string;
  sepX: number;
  sepY: number;
};

const registry = new Map<string, MarkerEntry>();
const PADDING = 10;
const ITERATIONS = 10;

export function registerCctvHtmlMarker(id: string) {
  if (!registry.has(id)) {
    registry.set(id, {
      id,
      anchorX: 0,
      anchorY: 0,
      width: 0,
      height: 0,
      base: { offsetX: 0, offsetY: 0, clamped: false },
      clamped: false,
      active: false,
      panel: null,
      line: null,
      sepX: 0,
      sepY: 0,
    });
  }
}

export function unregisterCctvHtmlMarker(id: string) {
  registry.delete(id);
}

export function updateCctvHtmlMarker(id: string, update: MarkerLayoutUpdate) {
  const entry = registry.get(id);
  if (!entry) return;
  Object.assign(entry, update);
}

function centerOf(entry: MarkerEntry) {
  return {
    x: entry.anchorX + entry.base.offsetX + entry.sepX,
    y: entry.anchorY + entry.base.offsetY + entry.sepY,
  };
}

function separateBoxes(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  const halfW = (aw + bw) / 2 + PADDING;
  const halfH = (ah + bh) / 2 + PADDING;
  const dx = ax - bx;
  const dy = ay - by;
  const overlapX = halfW - Math.abs(dx);
  const overlapY = halfH - Math.abs(dy);

  if (overlapX <= 0 || overlapY <= 0) return { x: 0, y: 0 };

  if (overlapX < overlapY) {
    return { x: Math.sign(dx || 1) * overlapX, y: 0 };
  }
  return { x: 0, y: Math.sign(dy || 1) * overlapY };
}

function clampEntryCenter(entry: MarkerEntry, viewport: ViewportSize) {
  const center = centerOf(entry);
  const clamped = clampPanelToViewport(
    center.x,
    center.y,
    entry.width,
    entry.height,
    viewport,
  );
  entry.sepX += clamped.offsetX;
  entry.sepY += clamped.offsetY;
}

/** 패널 간 겹침 해소 + viewport 재클램프 */
export function resolveCctvHtmlMarkerLayout(viewport: ViewportSize) {
  const entries = [...registry.values()].filter(
    (entry) => entry.active && entry.panel && entry.width > 0 && entry.height > 0,
  );

  if (entries.length === 0) return;

  for (const entry of entries) {
    entry.sepX = 0;
    entry.sepY = 0;
  }

  for (let i = 0; i < ITERATIONS; i++) {
    for (let a = 0; a < entries.length; a++) {
      for (let b = a + 1; b < entries.length; b++) {
        const entryA = entries[a];
        const entryB = entries[b];
        const centerA = centerOf(entryA);
        const centerB = centerOf(entryB);
        const push = separateBoxes(
          centerA.x,
          centerA.y,
          entryA.width,
          entryA.height,
          centerB.x,
          centerB.y,
          entryB.width,
          entryB.height,
        );
        if (push.x === 0 && push.y === 0) continue;
        entryA.sepX -= push.x / 2;
        entryA.sepY -= push.y / 2;
        entryB.sepX += push.x / 2;
        entryB.sepY += push.y / 2;
      }
    }
  }

  for (const entry of entries) {
    clampEntryCenter(entry, viewport);
  }

  for (const entry of entries) {
    const offsetX = entry.base.offsetX + entry.sepX;
    const offsetY = entry.base.offsetY + entry.sepY;
    const showLine =
      entry.clamped || entry.sepX !== 0 || entry.sepY !== 0;

    entry.panel!.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    if (entry.line) {
      entry.line.setAttribute("x2", String(offsetX));
      entry.line.setAttribute("y2", String(offsetY));
      entry.line.style.opacity = showLine ? "1" : "0";
    }
  }
}
