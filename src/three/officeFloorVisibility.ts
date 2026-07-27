import type { Object3D } from "three";

import {
  FLOOR_OBJECT_CANDIDATES,
  OFFICE_FLOOR_ACTION_IDS,
} from "@/data/officeFloorActions";
import { ensureOfficeFloorClones } from "@/three/officeFloorClones";

export type OfficeFloorObjectKey = Exclude<
  (typeof OFFICE_FLOOR_ACTION_IDS)[number],
  "Default"
>;

export function collectOfficeFloorObjects(
  root: Object3D,
): Map<OfficeFloorObjectKey, Object3D> {
  ensureOfficeFloorClones(root);

  const objects = new Map<OfficeFloorObjectKey, Object3D>();

  for (const actionId of OFFICE_FLOOR_ACTION_IDS) {
    if (actionId === "Default") continue;

    for (const name of FLOOR_OBJECT_CANDIDATES[actionId]) {
      const object = root.getObjectByName(name);
      if (object) {
        objects.set(actionId, object);
        object.visible = true;
        break;
      }
    }
  }

  return objects;
}
