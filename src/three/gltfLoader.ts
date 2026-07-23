import type { GLTFLoader } from "three-stdlib";
import { KTX2Loader } from "three-stdlib";
import type { WebGLRenderer } from "three";

const KTX2_TRANSCODER_PATH = "/basis/";

let ktx2Loader: KTX2Loader | null = null;
let boundRenderer: WebGLRenderer | null = null;

function ensureKtx2Loader(): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath(KTX2_TRANSCODER_PATH);
  }
  return ktx2Loader;
}

/** Canvas onCreated에서 WebGL 렌더러 등록 — GPU가 지원하는 KTX2 포맷 감지 */
export function bindGltfRenderer(renderer: WebGLRenderer): void {
  boundRenderer = renderer;
  const loader = ensureKtx2Loader();
  loader.detectSupport(renderer);
  console.log("[KTX2] renderer bound, transcoder:", KTX2_TRANSCODER_PATH);
}

/**
 * useGLTF 확장: GLB 안 KHR_texture_basisu(KTX2) 텍스처를 디코딩.
 * ※ PNG/JPEG를 실시간 압축하지 않음. KTX2가 들어 있는 GLB만 적용.
 */
export function extendGltfLoader(loader: GLTFLoader): void {
  const ktx2 = ensureKtx2Loader();
  if (boundRenderer) {
    ktx2.detectSupport(boundRenderer);
  }
  loader.setKTX2Loader(ktx2);
}

/** @react-three/drei useGLTF 옵션 */
export const GLTF_USE_DRACO = true;
export const GLTF_USE_MESHOPT = true;
