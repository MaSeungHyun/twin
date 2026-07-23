import {
  BufferGeometry,
  Material,
  Mesh,
  Texture,
  type Object3D,
} from 'three'

const TEXTURE_SLOTS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'bumpMap',
  'displacementMap',
  'alphaMap',
  'envMap',
  'lightMap',
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

export type DedupeStats = {
  texturesBefore: number
  texturesAfter: number
  materialsBefore: number
  materialsAfter: number
  geometriesBefore: number
  geometriesAfter: number
}

const imageIds = new WeakMap<object, number>()
let imageSeq = 0

function imageKey(image: unknown): string {
  if (!image || typeof image !== 'object') return 'no-image'
  let id = imageIds.get(image)
  if (id === undefined) {
    id = ++imageSeq
    imageIds.set(image, id)
  }
  return `img:${id}`
}

function textureKey(texture: Texture): string {
  const img = texture.image as { width?: number; height?: number; src?: string }
  const src = typeof img?.src === 'string' ? img.src : ''
  return [
    imageKey(texture.image),
    src,
    img?.width ?? 0,
    img?.height ?? 0,
    texture.colorSpace,
    texture.wrapS,
    texture.wrapT,
    texture.magFilter,
    texture.minFilter,
    texture.flipY ? 1 : 0,
    texture.channel,
    texture.offset.x,
    texture.offset.y,
    texture.repeat.x,
    texture.repeat.y,
    texture.rotation,
  ].join('|')
}

function materialKey(
  material: Material,
  texId: (t: Texture) => string,
): string {
  const m = material as Material & Record<string, unknown>
  const parts: string[] = [material.type]

  for (const slot of TEXTURE_SLOTS) {
    const value = m[slot]
    if (value && typeof value === 'object' && 'isTexture' in value) {
      parts.push(`${slot}:${texId(value as Texture)}`)
    }
  }

  const color = m.color as { getHexString?: () => string } | undefined
  if (color?.getHexString) parts.push(`color:${color.getHexString()}`)

  const emissive = m.emissive as { getHexString?: () => string } | undefined
  if (emissive?.getHexString) parts.push(`emissive:${emissive.getHexString()}`)

  for (const prop of [
    'roughness',
    'metalness',
    'opacity',
    'transparent',
    'side',
    'alphaTest',
    'vertexColors',
    'flatShading',
    'wireframe',
    'envMapIntensity',
    'aoMapIntensity',
    'bumpScale',
    'displacementScale',
    'emissiveIntensity',
  ] as const) {
    const value = m[prop]
    if (value !== undefined && value !== null) {
      parts.push(`${prop}:${String(value)}`)
    }
  }

  const normalScale = m.normalScale as { x: number; y: number } | undefined
  if (normalScale) parts.push(`normalScale:${normalScale.x},${normalScale.y}`)

  return parts.join('|')
}

function geometryKey(geometry: BufferGeometry): string {
  const pos = geometry.getAttribute('position')
  if (!pos?.array) return geometry.uuid
  const arr = pos.array
  const index = geometry.index?.array
  return [
    imageKey(arr.buffer),
    arr.byteOffset,
    arr.byteLength,
    pos.itemSize,
    pos.count,
    index ? `${imageKey(index.buffer)}:${index.byteLength}` : 'no-index',
    geometry.morphAttributes.position?.length ?? 0,
  ].join('|')
}

function collectTextures(material: Material): Texture[] {
  const textures: Texture[] = []
  const m = material as Material & Record<string, unknown>
  for (const slot of TEXTURE_SLOTS) {
    const value = m[slot]
    if (value && typeof value === 'object' && 'isTexture' in value) {
      textures.push(value as Texture)
    }
  }
  return textures
}

/**
 * 로드된 GLTF 씬에서 동일 image/속성인 texture·material·geometry를 하나로 합침.
 */
export function dedupeGltfResources(root: Object3D): DedupeStats {
  const textureCache = new Map<string, Texture>()
  const materialCache = new Map<string, Material>()
  const geometryCache = new Map<string, BufferGeometry>()

  const seenTextures = new Set<Texture>()
  const seenMaterials = new Set<Material>()
  const seenGeometries = new Set<BufferGeometry>()

  const duplicateTextures = new Set<Texture>()
  const duplicateMaterials = new Set<Material>()
  const duplicateGeometries = new Set<BufferGeometry>()

  const resolveTexture = (texture: Texture): Texture => {
    const key = textureKey(texture)
    const cached = textureCache.get(key)
    if (cached) {
      if (cached !== texture) duplicateTextures.add(texture)
      return cached
    }
    textureCache.set(key, texture)
    return texture
  }

  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return
    const mesh = obj as Mesh

    if (mesh.geometry) {
      seenGeometries.add(mesh.geometry)
      const key = geometryKey(mesh.geometry)
      const cached = geometryCache.get(key)
      if (cached) {
        if (cached !== mesh.geometry) {
          duplicateGeometries.add(mesh.geometry)
          mesh.geometry = cached
        }
      } else {
        geometryCache.set(key, mesh.geometry)
      }
    }

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]

    const nextMaterials = materials.map((material) => {
      if (!material) return material
      seenMaterials.add(material)

      for (const texture of collectTextures(material)) {
        seenTextures.add(texture)
        const shared = resolveTexture(texture)
        if (shared === texture) continue
        const m = material as Material & Record<string, unknown>
        for (const slot of TEXTURE_SLOTS) {
          if (m[slot] === texture) m[slot] = shared
        }
      }

      const key = materialKey(material, (t) => textureKey(resolveTexture(t)))
      const cached = materialCache.get(key)
      if (cached) {
        if (cached !== material) duplicateMaterials.add(material)
        return cached
      }
      materialCache.set(key, material)
      return material
    })

    mesh.material = Array.isArray(mesh.material)
      ? nextMaterials
      : (nextMaterials[0] as Material)
  })

  for (const texture of duplicateTextures) texture.dispose()
  for (const material of duplicateMaterials) material.dispose()
  for (const geometry of duplicateGeometries) geometry.dispose()

  return {
    texturesBefore: seenTextures.size,
    texturesAfter: textureCache.size,
    materialsBefore: seenMaterials.size,
    materialsAfter: materialCache.size,
    geometriesBefore: seenGeometries.size,
    geometriesAfter: geometryCache.size,
  }
}
