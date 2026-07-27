import { useFrame, useThree } from "@react-three/fiber";

import { resolveCctvHtmlMarkerLayout } from "@/lib/cctvHtmlLayout";

/** CCTV Html 패널 간 겹침 해소 — CameraWithVideo 등록 후 매 프레임 실행 */
export default function CctvHtmlLayoutSync() {
  const size = useThree((state) => state.size);

  useFrame(() => {
    resolveCctvHtmlMarkerLayout(size);
  }, 500);

  return null;
}
