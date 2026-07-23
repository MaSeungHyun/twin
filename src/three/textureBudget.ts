import { Mesh, Texture, type Object3D } from 'three'

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
  'envMap',
  'specularMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'transmissionMap',
  'thicknessMap',
  'specularIntensityMap',
  'specularColorMap',
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
        texture.needsUpdate = true
      }
    }
  })
}
