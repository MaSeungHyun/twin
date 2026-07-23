import type { GLTFLoader } from "three-stdlib";
import { KTX2Loader } from "three-stdlib";
import type { WebGLRenderer } from "three";

const KTX2_TRANSCODER_PATH = "/basis/";

/** glTF binary magic */
const GLB_MAGIC = 0x46546c67;
/** JSON chunk type `JSON` */
const GLB_CHUNK_JSON = 0x4e4f534a;

let ktx2Loader: KTX2Loader | null = null;
let boundRenderer: WebGLRenderer | null = null;

function ensureKtx2Loader(): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath(KTX2_TRANSCODER_PATH);
  }
  return ktx2Loader;
}

/**
 * 일부 내보내기 도구가 JSON 청크 정렬 패딩을 space(0x20) 대신 NUL(0x00)로 넣음.
 * JSON.parse가 trailing NUL에서 실패하므로 space로 치환.
 */
export function sanitizeGlbJsonPadding(buffer: ArrayBuffer): ArrayBuffer {
  if (buffer.byteLength < 20) return buffer;

  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== GLB_MAGIC) return buffer;

  const chunkLength = view.getUint32(12, true);
  const chunkType = view.getUint32(16, true);
  if (chunkType !== GLB_CHUNK_JSON) return buffer;

  const start = 20;
  const end = start + chunkLength;
  if (end > buffer.byteLength) return buffer;

  const data = new Uint8Array(buffer);
  let i = end - 1;
  if (data[i] !== 0) return buffer;

  const out = data.slice();
  while (i >= start && out[i] === 0) {
    out[i] = 0x20;
    i -= 1;
  }
  return out.buffer;
}

/** Canvas onCreated에서 WebGL 렌더러 등록 — GPU가 지원하는 KTX2 포맷 감지 */
export function bindGltfRenderer(renderer: WebGLRenderer): void {
  boundRenderer = renderer;
  const loader = ensureKtx2Loader();
  loader.detectSupport(renderer);
  console.log("[KTX2] renderer bound, transcoder:", KTX2_TRANSCODER_PATH);
}

/**
 * useGLTF 확장: GLB JSON NUL 패딩 보정 + KTX2 디코더.
 */
export function extendGltfLoader(loader: GLTFLoader): void {
  const ktx2 = ensureKtx2Loader();
  if (boundRenderer) {
    ktx2.detectSupport(boundRenderer);
  }
  loader.setKTX2Loader(ktx2);

  const originalParse = loader.parse.bind(loader);
  loader.parse = (data, path, onLoad, onError) => {
    const fixed =
      data instanceof ArrayBuffer ? sanitizeGlbJsonPadding(data) : data;
    return originalParse(fixed, path, onLoad, onError);
  };
}

/** @react-three/drei useGLTF 옵션 */
export const GLTF_USE_DRACO = true;
export const GLTF_USE_MESHOPT = true;
