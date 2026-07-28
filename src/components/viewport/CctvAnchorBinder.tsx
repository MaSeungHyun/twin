import { useEffect } from "react";
import type { Object3D } from "three";

import {
  registerCctvOverlayAnchor,
  unregisterCctvOverlayAnchor,
} from "@/stores/cctvOverlayStore";

/** Canvas 안 — 3D 카메라 노드를 오버레이 투영용으로 등록 */
export default function CctvAnchorBinder({
  id,
  anchor,
}: {
  id: string;
  anchor: Object3D;
}) {
  useEffect(() => {
    registerCctvOverlayAnchor(id, anchor);
    return () => unregisterCctvOverlayAnchor(id);
  }, [id, anchor]);

  return null;
}
