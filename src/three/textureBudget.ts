import { Texture, type Object3D, type Mesh } from 'three'

const TEXTURE_KEYS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'bumpMap',
  'displacementMap',
  'alphaMap',
  'lightMap',
] as const

/** 확대 시 GPU 샘플링 부하·VRAM 완화 */
export function applyTextureBudget(root: Object3D, maxAnisotropy = 1) {
  const seen = new Set<Texture>()

  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return
    const mesh = obj as Mesh
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]

    for (const material of materials) {
      if (!material) continue
      const record = material as unknown as Record<string, unknown>
      for (const key of TEXTURE_KEYS) {
        const value = record[key]
        if (!value || typeof value !== 'object' || !('isTexture' in value)) {
          continue
        }
        const texture = value as Texture
        if (seen.has(texture)) continue
        seen.add(texture)
        texture.anisotropy = Math.min(texture.anisotropy || 1, maxAnisotropy)
        // 확대 시 고해상도 mip 샘플 부담을 줄이기 위해 기본만 유지
        if (texture.image) {
          const img = texture.image as { width?: number; height?: number }
          const w = img.width ?? 0
          const h = img.height ?? 0
          if (w > 2048 || h > 2048) {
            texture.generateMipmaps = true
          }
        }
        texture.needsUpdate = true
      }
    }
  })
}
