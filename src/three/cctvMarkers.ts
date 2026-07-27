import { Object3D, PerspectiveCamera } from "three";

import {
  CCTV_MARKER_FALLBACK_MAX,
  CCTV_MARKER_FALLBACK_PATTERNS,
  CCTV_MARKER_NODE_NAMES,
  CCTV_MARKER_SUPPLEMENT_PATTERNS,
} from "@/data/cctvMarkerNodes";

export type CctvMarkerSource = {
  id: string;
  name: string;
  node: Object3D;
};

function cleanMarkerName(name: string, index: number): string {
  const cleaned = name.replace(/_StaticMeshComponent\d+$/i, "");
  return cleaned || `cctv-${index + 1}`;
}

function collectNodesByPatterns(
  root: Object3D,
  patterns: readonly RegExp[],
): Object3D[] {
  const found: Object3D[] = [];
  root.traverse((obj) => {
    if (!obj.name) return;
    if (patterns.some((pattern) => pattern.test(obj.name))) {
      found.push(obj);
    }
  });
  return found;
}

function mergeUniqueNodes(primary: Object3D[], supplement: Object3D[]): Object3D[] {
  const merged = [...primary];
  const seen = new Set(primary.map((node) => node.uuid));

  for (const node of supplement) {
    if (seen.has(node.uuid)) continue;
    merged.push(node);
    seen.add(node.uuid);
  }

  return merged;
}

/** GLB PerspectiveCamera → name 지정 Empty → fallback 패턴 순으로 CCTV 앵커 수집 */
export function collectCctvMarkers(root: Object3D): CctvMarkerSource[] {
  const perspectiveCameras: PerspectiveCamera[] = [];
  root.traverse((obj) => {
    if ((obj as PerspectiveCamera).isPerspectiveCamera) {
      perspectiveCameras.push(obj as PerspectiveCamera);
    }
  });

  if (perspectiveCameras.length > 0) {
    return perspectiveCameras.slice(0, CCTV_MARKER_FALLBACK_MAX).map((node) => ({
      id: node.uuid,
      name: node.name || "camera",
      node,
    }));
  }

  const byName = new Map<string, Object3D>();
  root.traverse((obj) => {
    const lower = obj.name.toLowerCase();
    if ((CCTV_MARKER_NODE_NAMES as readonly string[]).includes(lower)) {
      byName.set(lower, obj);
    }
  });

  const named = CCTV_MARKER_NODE_NAMES.flatMap((name) => {
    const node = byName.get(name);
    return node
      ? [{ id: node.uuid, name: node.name || name, node }]
      : [];
  });
  if (named.length > 0) {
    return named.slice(0, CCTV_MARKER_FALLBACK_MAX);
  }

  const fallback = mergeUniqueNodes(
    collectNodesByPatterns(root, CCTV_MARKER_FALLBACK_PATTERNS),
    collectNodesByPatterns(root, CCTV_MARKER_SUPPLEMENT_PATTERNS),
  );

  fallback.sort((a, b) => a.name.localeCompare(b.name));

  return fallback.slice(0, CCTV_MARKER_FALLBACK_MAX).map((node, index) => ({
    id: node.uuid,
    name: cleanMarkerName(node.name, index),
    node,
  }));
}
