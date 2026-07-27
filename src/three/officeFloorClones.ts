import type { Object3D } from "three";

import { FLOOR_OBJECT_CANDIDATES } from "@/data/officeFloorActions";
import type { OfficeFloorObjectKey } from "@/three/officeFloorVisibility";

/** runtime clone 표식 — HMR·재진입 시 정리용 */
export const OFFICE_FLOOR_RUNTIME_CLONE = "officeFloorRuntimeClone";

/**
 * Seperate_Office 4층 GLB 기준 Default(All) 뷰 local Y.
 * 1F만 포함된 GLB에서 2F~4F clone 배치에 사용.
 */
export const OFFICE_FLOOR_STACK_Y_FROM_1F: Record<
  Exclude<OfficeFloorObjectKey, "1F">,
  number
> = {
  "2F": 11.169_864_654_541_016,
  "3F": 22.343_194_007_873_535,
  "4F": 33.516_522_407_531_74,
};

const ALL_FLOOR_KEYS = ["1F", "2F", "3F", "4F"] as const satisfies ReadonlyArray<
  OfficeFloorObjectKey
>;

const UPPER_FLOOR_KEYS = ["2F", "3F", "4F"] as const satisfies ReadonlyArray<
  Exclude<OfficeFloorObjectKey, "1F">
>;

function findFloorRoot(
  root: Object3D,
  key: OfficeFloorObjectKey,
): Object3D | null {
  for (const name of FLOOR_OBJECT_CANDIDATES[key]) {
    const object = root.getObjectByName(name);
    if (object) return object;
  }
  return null;
}

function removeRuntimeFloorClones(root: Object3D) {
  for (const key of UPPER_FLOOR_KEYS) {
    for (const name of FLOOR_OBJECT_CANDIDATES[key]) {
      const object = root.getObjectByName(name);
      if (object?.userData?.[OFFICE_FLOOR_RUNTIME_CLONE]) {
        object.parent?.remove(object);
      }
    }
  }
}

/**
 * GLB에 2F~4F가 없으면 1F(F1)를 복제해 4층까지 구성.
 * F2~F4가 GLB에 있으면 clone하지 않음.
 */
export function ensureOfficeFloorClones(root: Object3D): void {
  const f1 = findFloorRoot(root, "1F");
  if (!f1) return;

  removeRuntimeFloorClones(root);

  const hasNativeUpperFloors = UPPER_FLOOR_KEYS.some((key) => {
    const node = findFloorRoot(root, key);
    return node && !node.userData?.[OFFICE_FLOOR_RUNTIME_CLONE];
  });

  if (hasNativeUpperFloors) return;

  const parent = f1.parent ?? root;
  const baseY = f1.position.y;

  for (const key of UPPER_FLOOR_KEYS) {
    if (findFloorRoot(root, key)) continue;

    const nodeName = FLOOR_OBJECT_CANDIDATES[key][0];
    const clone = f1.clone(true);
    clone.name = nodeName;
    clone.userData[OFFICE_FLOOR_RUNTIME_CLONE] = true;
    clone.position.set(
      f1.position.x,
      baseY + OFFICE_FLOOR_STACK_Y_FROM_1F[key],
      f1.position.z,
    );
    clone.quaternion.copy(f1.quaternion);
    clone.scale.copy(f1.scale);
    parent.add(clone);
  }

  root.updateMatrixWorld(true);
}

export function getOfficeFloorCloneCount(root: Object3D): number {
  let count = 0;
  for (const key of ALL_FLOOR_KEYS) {
    if (findFloorRoot(root, key)) count += 1;
  }
  return count;
}
