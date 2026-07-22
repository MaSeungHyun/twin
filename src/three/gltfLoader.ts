import type { GLTFLoader } from 'three-stdlib'
import { KTX2Loader } from 'three-stdlib'
import type { WebGLRenderer } from 'three'

const KTX2_TRANSCODER_PATH = '/basis/'

let ktx2Loader: KTX2Loader | null = null
let boundRenderer: WebGLRenderer | null = null

/** Canvas 생성 시 WebGL 렌더러를 등록 (KTX2 detectSupport용) */
export function bindGltfRenderer(renderer: WebGLRenderer): void {
  boundRenderer = renderer
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader()
    ktx2Loader.setTranscoderPath(KTX2_TRANSCODER_PATH)
  }
  ktx2Loader.detectSupport(renderer)
}

/** useGLTF / preload 4번째 인자로 전달 */
export function extendGltfLoader(loader: GLTFLoader): void {
  if (!ktx2Loader || !boundRenderer) return
  ktx2Loader.detectSupport(boundRenderer)
  loader.setKTX2Loader(ktx2Loader)
}

/** @react-three/drei useGLTF 옵션 */
export const GLTF_USE_DRACO = false
export const GLTF_USE_MESHOPT = true
