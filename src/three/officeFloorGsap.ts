import gsap from "gsap";
import type { Object3D } from "three";

import {
  OFFICE_FLOOR_ACTION_IDS,
  type OfficeFloorActionId,
} from "@/data/officeFloorActions";
import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";
import {
  floorVisibilityForAction,
  getOfficeFloorInstanceRegistry,
  syncOfficeFloorInstances,
} from "@/three/officeFloorInstancing";

/** 선택 층이 이동할 target Y (local) */
export const OFFICE_FLOOR_TARGET_Y = 0;

export type OfficeFloorLayout = {
  root: Object3D;
  targetY: number;
  originals: Readonly<Record<OfficeFloorObjectKey, number>>;
  objects: ReadonlyMap<OfficeFloorObjectKey, Object3D>;
  timeline: gsap.core.Timeline | null;
};

const FLOOR_Y_OFFSETS: Record<
  Exclude<OfficeFloorActionId, "Default">,
  Record<OfficeFloorObjectKey, number>
> = {
  "1F": { "1F": 0, "2F": 200, "3F": 300, "4F": 400 },
  "2F": { "1F": -400, "2F": 0, "3F": 300, "4F": 400 },
  "3F": { "1F": -400, "2F": -300, "3F": 0, "4F": 400 },
  "4F": { "1F": -400, "2F": -300, "3F": -200, "4F": 0 },
};

export const FLOOR_ANIM_DURATION = 1.5;
/** 마지막 구간 감속 */
export const FLOOR_ANIM_EASE = "power3.inOut";

/**
 * 1F — F1은 original 유지, F2~F4는 original + offset (위로 펼침)
 * 2F~4F — 선택 층은 targetY, 나머지는 targetY + offset
 */
function resolveFloorTargetY(
  layout: OfficeFloorLayout,
  actionId: Exclude<OfficeFloorActionId, "Default">,
  key: OfficeFloorObjectKey,
): number {
  const offset = FLOOR_Y_OFFSETS[actionId][key];

  if (actionId === "1F") {
    return layout.originals[key] + offset;
  }

  if (key === actionId) {
    return layout.targetY;
  }

  return layout.targetY + offset;
}

function killFloorTweens(objects: ReadonlyMap<OfficeFloorObjectKey, Object3D>) {
  for (const object of objects.values()) {
    gsap.killTweensOf(object.position);
  }
}

function syncInstancesForFloors(
  root: Object3D,
  objects: ReadonlyMap<OfficeFloorObjectKey, Object3D>,
  actionId: OfficeFloorActionId,
) {
  const registry = getOfficeFloorInstanceRegistry(root);
  if (!registry) return;
  syncOfficeFloorInstances(
    registry,
    objects,
    floorVisibilityForAction(actionId),
  );
}

/** 층별 — 선택 층만 visible / All — 전부 visible */
export function applyOfficeFloorVisibility(
  root: Object3D,
  objects: ReadonlyMap<OfficeFloorObjectKey, Object3D>,
  actionId: OfficeFloorActionId,
) {
  if (actionId === "Default") {
    for (const object of objects.values()) {
      object.visible = true;
    }
    syncInstancesForFloors(root, objects, actionId);
    return;
  }

  for (const [key, object] of objects) {
    object.visible = key === actionId;
  }
  syncInstancesForFloors(root, objects, actionId);
}

export function resetOfficeFloorPositions(layout: OfficeFloorLayout) {
  killFloorTweens(layout.objects);

  for (const [key, object] of layout.objects) {
    object.position.y = layout.originals[key];
  }

  syncInstancesForFloors(layout.root, layout.objects, "Default");
}

/**
 * scene matrix 반영 후 F1~F4 local Y 스냅샷.
 * targetY = 0 — 선택 층이 모이는 기준 높이.
 */
export function createOfficeFloorLayout(
  root: Object3D,
  objects: ReadonlyMap<OfficeFloorObjectKey, Object3D>,
): OfficeFloorLayout | null {
  const f1 = objects.get("1F");
  if (!f1 || objects.size === 0) return null;

  root.updateMatrixWorld(true);
  killFloorTweens(objects);

  const originals = {} as Record<OfficeFloorObjectKey, number>;
  for (const [key, object] of objects) {
    originals[key] = object.position.y;
  }

  for (const [key, object] of objects) {
    object.position.y = originals[key];
  }

  applyOfficeFloorVisibility(root, objects, "Default");

  return {
    root,
    targetY: OFFICE_FLOOR_TARGET_Y,
    originals,
    objects,
    timeline: null,
  };
}

export function getAvailableFloorActions(
  objects: ReadonlyMap<OfficeFloorObjectKey, Object3D>,
): OfficeFloorActionId[] {
  if (!objects.has("1F")) return [];

  const available: OfficeFloorActionId[] = ["Default"];
  for (const actionId of OFFICE_FLOOR_ACTION_IDS) {
    if (actionId !== "Default" && objects.has(actionId)) {
      available.push(actionId);
    }
  }
  return available;
}

export function animateOfficeFloorLayout(
  layout: OfficeFloorLayout,
  actionId: OfficeFloorActionId,
  onComplete?: () => void,
): gsap.core.Timeline {
  layout.timeline?.kill();

  const animating = actionId !== "Default";

  if (actionId === "Default") {
    applyOfficeFloorVisibility(layout.root, layout.objects, "Default");
  } else {
    for (const object of layout.objects.values()) {
      object.visible = true;
    }
    syncInstancesForFloors(layout.root, layout.objects, "Default");
  }

  const timeline = gsap.timeline({
    onUpdate: () => {
      syncInstancesForFloors(
        layout.root,
        layout.objects,
        animating ? "Default" : actionId,
      );
    },
    onComplete: () => {
      applyOfficeFloorVisibility(layout.root, layout.objects, actionId);
      onComplete?.();
    },
    defaults: { duration: FLOOR_ANIM_DURATION, ease: FLOOR_ANIM_EASE },
  });

  if (actionId === "Default") {
    for (const [key, object] of layout.objects) {
      timeline.to(object.position, { y: layout.originals[key] }, 0);
    }
  } else {
    for (const [key, object] of layout.objects) {
      timeline.to(
        object.position,
        { y: resolveFloorTargetY(layout, actionId, key) },
        0,
      );
    }
  }

  layout.timeline = timeline;
  return timeline;
}

export function disposeOfficeFloorLayout(layout: OfficeFloorLayout | null) {
  layout?.timeline?.kill();
}
