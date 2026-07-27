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
  lineStartX: number;
  lineStartY: number;
  showLine: boolean;
};

type MarkerEntry = MarkerLayoutUpdate & {
  id: string;
  sepX: number;
  sepY: number;
};

const registry = new Map<string, MarkerEntry>();

const PADDING = 20;
/** base 중심이 이 거리(px) 안이면 같은 클러스터 → 좌우 슬롯 배치 */
const CLUSTER_RADIUS = 220;
const SMOOTHING = 0.2;
const RETURN_SMOOTHING = 0.1;

function baseCenter(entry: MarkerEntry) {
  return {
    x: entry.anchorX + entry.base.offsetX,
    y: entry.anchorY + entry.base.offsetY,
  };
}

// ─── Step 1: 가까운 마커끼리 클러스터 묶기 ───

function findClusters(entries: MarkerEntry[]): MarkerEntry[][] {
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  const parent = new Map<string, string>();

  const find = (id: string): string => {
    let root = parent.get(id)!;
    while (root !== parent.get(root)) {
      root = parent.get(root)!;
    }
    return root;
  };

  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const entry of sorted) {
    parent.set(entry.id, entry.id);
  }

  for (let i = 0; i < sorted.length; i++) {
    const baseI = baseCenter(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      const baseJ = baseCenter(sorted[j]);
      const dist = Math.hypot(baseI.x - baseJ.x, baseI.y - baseJ.y);
      if (dist < CLUSTER_RADIUS) {
        union(sorted[i].id, sorted[j].id);
      }
    }
  }

  const groups = new Map<string, MarkerEntry[]>();
  for (const entry of sorted) {
    const root = find(entry.id);
    const group = groups.get(root);
    if (group) group.push(entry);
    else groups.set(root, [entry]);
  }

  return [...groups.values()];
}

// ─── Step 2: 클러스터 내 좌우 슬롯 배치 (id 순서 고정) ───

function computeHorizontalSlotTargets(cluster: MarkerEntry[]) {
  const targets = new Map<string, { x: number; y: number }>();
  if (cluster.length < 2) return targets;

  const sorted = [...cluster].sort((a, b) => a.id.localeCompare(b.id));
  const n = sorted.length;
  const maxW = Math.max(...sorted.map((entry) => entry.width));
  const step = maxW + PADDING;

  let centroidX = 0;
  let centroidY = 0;
  for (const entry of sorted) {
    const base = baseCenter(entry);
    centroidX += base.x;
    centroidY += base.y;
  }
  centroidX /= n;
  centroidY /= n;

  for (let i = 0; i < n; i++) {
    const entry = sorted[i];
    const base = baseCenter(entry);
    const slotX = (i - (n - 1) / 2) * step;

    targets.set(entry.id, {
      x: centroidX + slotX - base.x,
      y: centroidY - base.y,
    });
  }

  return targets;
}

// ─── Step 3: 전체 target sep (클러스터 슬롯 우선) ───

function computeTargetSeparations(entries: MarkerEntry[]) {
  const target = new Map<string, { x: number; y: number }>();
  for (const entry of entries) {
    target.set(entry.id, { x: 0, y: 0 });
  }

  for (const cluster of findClusters(entries)) {
    if (cluster.length < 2) continue;

    const slots = computeHorizontalSlotTargets(cluster);
    for (const [id, sep] of slots) {
      target.set(id, sep);
    }
  }

  return target;
}

// ─── Step 4: 부드럽게 보간 ───

function smoothTowardTarget(
  current: number,
  target: number,
  spreading: boolean,
) {
  const alpha = spreading ? SMOOTHING : RETURN_SMOOTHING;
  const delta = target - current;

  if (Math.abs(delta) < 0.35) return target;

  return current + delta * alpha;
}

// ─── Step 5: viewport clamp ───

function clampSepToViewport(entry: MarkerEntry, viewport: ViewportSize) {
  const base = baseCenter(entry);
  const clamped = clampPanelToViewport(
    base.x + entry.sepX,
    base.y + entry.sepY,
    entry.width,
    entry.height,
    viewport,
  );

  entry.sepX += clamped.offsetX;
  entry.sepY += clamped.offsetY;
}

// ─── Step 6: DOM 반영 ───

function applyMarkerTransform(entry: MarkerEntry) {
  const offsetX = entry.base.offsetX + entry.sepX;
  const offsetY = entry.base.offsetY + entry.sepY;
  const moved =
    Math.abs(entry.sepX) > 0.5 || Math.abs(entry.sepY) > 0.5;
  const showLine = entry.showLine || entry.clamped || moved;

  entry.panel!.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

  if (!entry.line) return;

  entry.line.setAttribute("x1", String(entry.lineStartX));
  entry.line.setAttribute("y1", String(entry.lineStartY));
  entry.line.setAttribute("x2", String(offsetX));
  entry.line.setAttribute("y2", String(offsetY));
  entry.line.style.opacity = showLine ? "1" : "0";
}

export function registerCctvHtmlMarker(id: string) {
  if (registry.has(id)) return;

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
    lineStartX: 0,
    lineStartY: 0,
    showLine: false,
    sepX: 0,
    sepY: 0,
  });
}

export function unregisterCctvHtmlMarker(id: string) {
  registry.delete(id);
}

export function updateCctvHtmlMarker(id: string, update: MarkerLayoutUpdate) {
  const entry = registry.get(id);
  if (!entry) return;
  Object.assign(entry, update);
}

/**
 * CCTV Html layout:
 * 1. active 마커 수집
 * 2. 가까운 마커 클러스터링
 * 3. 클러스터 내 좌·중·우 슬롯 target 계산
 * 4. sep 보간 → viewport clamp → DOM 적용
 */
export function resolveCctvHtmlMarkerLayout(viewport: ViewportSize) {
  const entries = [...registry.values()]
    .filter(
      (entry) =>
        entry.active && entry.panel && entry.width > 0 && entry.height > 0,
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  if (entries.length === 0) return;

  const targets = computeTargetSeparations(entries);
  const spreading = [...targets.values()].some(
    (t) => Math.abs(t.x) > 0.5 || Math.abs(t.y) > 0.5,
  );

  for (const entry of entries) {
    const target = targets.get(entry.id) ?? { x: 0, y: 0 };

    entry.sepX = smoothTowardTarget(entry.sepX, target.x, spreading);
    entry.sepY = smoothTowardTarget(entry.sepY, target.y, spreading);

    clampSepToViewport(entry, viewport);
    applyMarkerTransform(entry);
  }
}
