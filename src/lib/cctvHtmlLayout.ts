import {
  clampPanelToViewport,
  type PanelClampResult,
} from "@/lib/cctvLeaderLine";
import { getHudViewportInsets } from "@/lib/hudViewportInsets";

type ViewportSize = { width: number; height: number };

export type MarkerLayoutUpdate = {
  anchorX: number;
  anchorY: number;
  width: number;
  height: number;
  base: PanelClampResult;
  clamped: boolean;
  active: boolean;
  /** 오버레이 루트 (스크린 앵커 위치) */
  root: HTMLDivElement | null;
  panel: HTMLDivElement | null;
  line: SVGLineElement | null;
  lineStartX: number;
  lineStartY: number;
  showLine: boolean;
  zIndex: number;
};

type MarkerEntry = MarkerLayoutUpdate & {
  id: string;
  sepX: number;
  sepY: number;
};

const registry = new Map<string, MarkerEntry>();

const PADDING = 20;
const CLUSTER_RADIUS = 260;
const SMOOTHING = 0.28;
const RETURN_SMOOTHING = 0.12;
const DIRECTIONAL_BIAS_PX = 48;
/** 마커 간 최소 간격 (겹침 방지) */
const OVERLAP_GAP = 16;
const DEOVERLAP_ITERS = 10;

/** clamp과 맞춘 가장자리 여백 */
const EDGE_PADDING = 16;

function compareByScreenX(a: MarkerEntry, b: MarkerEntry) {
  const ax = baseCenter(a).x;
  const bx = baseCenter(b).x;
  if (Math.abs(ax - bx) > 1) return ax - bx;
  return a.id.localeCompare(b.id);
}

function compareByScreenY(a: MarkerEntry, b: MarkerEntry) {
  const ay = baseCenter(a).y;
  const by = baseCenter(b).y;
  if (Math.abs(ay - by) > 1) return ay - by;
  return a.id.localeCompare(b.id);
}

function baseCenter(entry: MarkerEntry) {
  return {
    x: entry.anchorX + entry.base.offsetX,
    y: entry.anchorY + entry.base.offsetY,
  };
}

function getUsableBounds(viewport: ViewportSize) {
  const insets = getHudViewportInsets();
  return {
    minX: insets.left + EDGE_PADDING,
    maxX: viewport.width - insets.right - EDGE_PADDING,
    minY: insets.top + EDGE_PADDING,
    maxY: viewport.height - insets.bottom - EDGE_PADDING,
  };
}

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

/**
 * 클러스터 슬롯: 좌우를 우선으로 채우고, 가용 폭이 부족하면 다음 행으로 감쌈.
 * (한 칸만 들어갈 때만 순수 세로 한 줄)
 */
function computeClusterSlotTargets(
  cluster: MarkerEntry[],
  viewport: ViewportSize,
) {
  const targets = new Map<string, { x: number; y: number }>();
  if (cluster.length < 2) return targets;

  const n = cluster.length;
  const maxW = Math.max(...cluster.map((entry) => entry.width));
  const maxH = Math.max(...cluster.map((entry) => entry.height));
  const stepX = maxW + PADDING;
  const stepY = maxH + PADDING;

  let centroidX = 0;
  let centroidY = 0;
  for (const entry of cluster) {
    const base = baseCenter(entry);
    centroidX += base.x;
    centroidY += base.y;
  }
  centroidX /= n;
  centroidY /= n;

  const bounds = getUsableBounds(viewport);
  const availW = Math.max(0, bounds.maxX - bounds.minX);
  const availH = Math.max(0, bounds.maxY - bounds.minY);

  // 한 행에 들어갈 수 있는 최대 개수 (좌우 우선)
  const cols = Math.max(
    1,
    Math.min(n, Math.floor((availW - maxW) / stepX) + 1),
  );
  const rows = Math.ceil(n / cols);

  // 그리드가 가용 영역 안에 오도록 중심 보정
  const gridW = (cols - 1) * stepX + maxW;
  const gridH = (rows - 1) * stepY + maxH;
  const halfGW = gridW / 2;
  const halfGH = gridH / 2;
  if (bounds.maxX - bounds.minX >= gridW) {
    centroidX = Math.min(
      Math.max(centroidX, bounds.minX + halfGW),
      bounds.maxX - halfGW,
    );
  } else {
    centroidX = (bounds.minX + bounds.maxX) / 2;
  }
  if (bounds.maxY - bounds.minY >= gridH) {
    centroidY = Math.min(
      Math.max(centroidY, bounds.minY + halfGH),
      bounds.maxY - halfGH,
    );
  } else if (availH > 0) {
    centroidY = (bounds.minY + bounds.maxY) / 2;
  }

  const sorted = [...cluster].sort(
    cols === 1 ? compareByScreenY : compareByScreenX,
  );

  for (let i = 0; i < n; i++) {
    const entry = sorted[i];
    const base = baseCenter(entry);
    const row = Math.floor(i / cols);
    const col = i % cols;
    const rowLen = Math.min(cols, n - row * cols);
    // 마지막 행이 짧으면 그 행만 가운데 정렬
    const slotX = (col - (rowLen - 1) / 2) * stepX;
    const slotY = (row - (rows - 1) / 2) * stepY;

    targets.set(entry.id, {
      x: centroidX + slotX - base.x,
      y: centroidY + slotY - base.y,
    });
  }

  return targets;
}

function computeDirectionalBias(entry: MarkerEntry, viewport: ViewportSize) {
  const base = baseCenter(entry);
  const cx = viewport.width / 2;
  if (cx <= 0) return { x: 0, y: 0 };

  const t = Math.max(-1, Math.min(1, (base.x - cx) / cx));

  return {
    x: t * DIRECTIONAL_BIAS_PX,
    y: 0,
  };
}

function entryScale(entry: MarkerEntry) {
  return entry.root?.dataset.hovered === "1" ? 1.5 : 1;
}

/**
 * 모든 마커 타깃 위치를 AABB 기준으로 밀어 겹침을 줄임.
 * 침투가 비슷하면 좌우 분리를 우선.
 */
function adjustTargetsToAvoidOverlap(
  entries: MarkerEntry[],
  targets: Map<string, { x: number; y: number }>,
  viewport: ViewportSize,
) {
  type Pos = {
    entry: MarkerEntry;
    x: number;
    y: number;
    halfW: number;
    halfH: number;
  };

  const positions: Pos[] = entries.map((entry) => {
    const base = baseCenter(entry);
    const t = targets.get(entry.id) ?? { x: 0, y: 0 };
    const scale = entryScale(entry);
    return {
      entry,
      x: base.x + t.x,
      y: base.y + t.y,
      halfW: (entry.width * scale) / 2,
      halfH: (entry.height * scale) / 2,
    };
  });

  for (let iter = 0; iter < DEOVERLAP_ITERS; iter++) {
    let moved = false;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i];
        const b = positions[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDx = a.halfW + b.halfW + OVERLAP_GAP;
        const minDy = a.halfH + b.halfH + OVERLAP_GAP;
        const overlapX = minDx - Math.abs(dx);
        const overlapY = minDy - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        // 침투가 작거나 비슷한 축 — 좌우 우선
        const preferX = overlapX < overlapY * 1.15;
        if (preferX) {
          const push = overlapX / 2 + 0.5;
          const sign =
            Math.abs(dx) < 0.1
              ? a.entry.id < b.entry.id
                ? -1
                : 1
              : Math.sign(dx);
          a.x -= sign * push;
          b.x += sign * push;
        } else {
          const push = overlapY / 2 + 0.5;
          const sign =
            Math.abs(dy) < 0.1
              ? a.entry.id < b.entry.id
                ? -1
                : 1
              : Math.sign(dy);
          a.y -= sign * push;
          b.y += sign * push;
        }
        moved = true;
      }
    }

    // 가용 영역 안으로 클램프
    for (const pos of positions) {
      const clamped = clampPanelToViewport(
        pos.x,
        pos.y,
        pos.halfW * 2,
        pos.halfH * 2,
        viewport,
      );
      pos.x += clamped.offsetX;
      pos.y += clamped.offsetY;
    }

    if (!moved) break;
  }

  for (const pos of positions) {
    const base = baseCenter(pos.entry);
    targets.set(pos.entry.id, {
      x: pos.x - base.x,
      y: pos.y - base.y,
    });
  }
}

function computeTargetSeparations(
  entries: MarkerEntry[],
  viewport: ViewportSize,
) {
  const target = new Map<string, { x: number; y: number }>();
  const slottedIds = new Set<string>();

  for (const entry of entries) {
    target.set(entry.id, { x: 0, y: 0 });
  }

  for (const cluster of findClusters(entries)) {
    if (cluster.length < 2) continue;

    const slots = computeClusterSlotTargets(cluster, viewport);
    for (const [id, sep] of slots) {
      target.set(id, sep);
      slottedIds.add(id);
    }
  }

  for (const entry of entries) {
    if (slottedIds.has(entry.id)) continue;
    target.set(entry.id, computeDirectionalBias(entry, viewport));
  }

  adjustTargetsToAvoidOverlap(entries, target, viewport);
  return target;
}

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

function applyMarkerTransform(entry: MarkerEntry) {
  if (entry.root) {
    entry.root.style.transform = `translate(${entry.anchorX}px, ${entry.anchorY}px) translate(-50%, -50%)`;
    entry.root.style.zIndex = String(entry.zIndex);
  }

  if (!entry.panel) return;

  const offsetX = entry.base.offsetX + entry.sepX;
  const offsetY = entry.base.offsetY + entry.sepY;
  const moved = Math.abs(entry.sepX) > 0.5 || Math.abs(entry.sepY) > 0.5;
  const showLine = entry.showLine || entry.clamped || moved;
  const hovered = entry.root?.dataset.hovered === "1";

  if (entry.root) {
    entry.root.style.willChange = moved || hovered ? "transform" : "auto";
  }

  entry.panel.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

  if (!entry.line) return;

  // 선은 뷰포트 공통 SVG(마커 아래 레이어) — 절대 좌표
  entry.line.setAttribute("x1", String(entry.anchorX + entry.lineStartX));
  entry.line.setAttribute("y1", String(entry.anchorY + entry.lineStartY));
  entry.line.setAttribute("x2", String(entry.anchorX + offsetX));
  entry.line.setAttribute("y2", String(entry.anchorY + offsetY));
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
    root: null,
    panel: null,
    line: null,
    lineStartX: 0,
    lineStartY: 0,
    showLine: false,
    zIndex: 0,
    sepX: 0,
    sepY: 0,
  });
}

export function unregisterCctvHtmlMarker(id: string) {
  registry.delete(id);
}

export function updateCctvHtmlMarker(id: string, update: Partial<MarkerLayoutUpdate>) {
  const entry = registry.get(id);
  if (!entry) return;
  Object.assign(entry, update);
  if (update.active === false && entry.line) {
    entry.line.style.opacity = "0";
  }
}

/**
 * CCTV 오버레이 layout:
 * 1. active 마커 수집
 * 2. viewport clamp(base) 재계산
 * 3. 클러스터링 → 슬롯/바이어스
 * 4. sep 보간 → clamp → DOM
 */
export function resolveCctvHtmlMarkerLayout(viewport: ViewportSize) {
  const entries = [...registry.values()]
    .filter(
      (entry) =>
        entry.active &&
        entry.root &&
        entry.panel &&
        entry.width > 0 &&
        entry.height > 0,
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  if (entries.length === 0) return;

  for (const entry of entries) {
    const scale = entry.root?.dataset.hovered === "1" ? 1.5 : 1;
    const w = entry.width * scale;
    const h = entry.height * scale;
    const base = clampPanelToViewport(
      entry.anchorX,
      entry.anchorY,
      w,
      h,
      viewport,
    );
    entry.base = base;
    entry.clamped = base.clamped;
  }

  const targets = computeTargetSeparations(entries, viewport);
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
