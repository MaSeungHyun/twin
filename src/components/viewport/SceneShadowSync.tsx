import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Mesh } from "three";

import { useViewportTestStore } from "@/stores/viewportTestStore";

/** shadowsEnabled 변경 시 renderer + 씬 메시 cast/receive 동기화 */
export default function SceneShadowSync() {
  const shadowsEnabled = useViewportTestStore((s) => s.shadowsEnabled);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    gl.shadowMap.enabled = shadowsEnabled;
    scene.traverse((obj) => {
      if (!(obj as Mesh).isMesh) return;
      obj.castShadow = shadowsEnabled;
      obj.receiveShadow = shadowsEnabled;
    });
  }, [shadowsEnabled, scene, gl]);

  return null;
}
