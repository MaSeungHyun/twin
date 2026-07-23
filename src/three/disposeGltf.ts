import type { Material, Object3D, Texture } from 'three'
import { BufferGeometry } from 'three'
import { useGLTF } from '@react-three/drei'

type GltfLike = {
  scene?: Object3D
  scenes?: Object3D[]
}

function isTexture(value: unknown): value is Texture {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Texture).isTexture === true
  )
}

function isMaterial(value: unknown): value is Material {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Material).isMaterial === true
  )
}

function disposeTexture(
  texture: Texture,
  disposedTextures: Set<Texture>,
) {
  if (disposedTextures.has(texture)) return
  disposedTextures.add(texture)
  texture.dispose()
}

function disposeMaterial(
  material: Material,
  disposedMaterials: Set<Material>,
  disposedTextures: Set<Texture>,
) {
  if (disposedMaterials.has(material)) return
  disposedMaterials.add(material)

  const record = material as Material & Record<string, unknown>
  for (const value of Object.values(record)) {
    if (isTexture(value)) {
      disposeTexture(value, disposedTextures)
    }
  }
  material.dispose()
}

function disposeGeometry(
  geometry: BufferGeometry,
  disposedGeometries: Set<BufferGeometry>,
) {
  if (disposedGeometries.has(geometry)) return
  disposedGeometries.add(geometry)
  geometry.dispose()
}

/** Mesh / Line / Points / SkinnedMesh 등 geometry·material 보유 객체 전부 해제 */
export function disposeObjectTree(root: Object3D): {
  geometries: number
  materials: number
  textures: number
} {
  const disposedGeometries = new Set<BufferGeometry>()
  const disposedMaterials = new Set<Material>()
  const disposedTextures = new Set<Texture>()

  root.traverse((obj) => {
    const anyObj = obj as Object3D & {
      geometry?: BufferGeometry
      material?: Material | Material[]
      isSkinnedMesh?: boolean
      skeleton?: {
        boneTexture?: Texture
        dispose?: () => void
      }
      isLight?: boolean
      shadow?: { map?: Texture; mapPass?: Texture; dispose?: () => void }
      dispose?: () => void
    }

    if (anyObj.isSkinnedMesh && anyObj.skeleton) {
      if (anyObj.skeleton.boneTexture) {
        disposeTexture(anyObj.skeleton.boneTexture, disposedTextures)
      }
      anyObj.skeleton.dispose?.()
    }

    if (anyObj.geometry) {
      disposeGeometry(anyObj.geometry, disposedGeometries)
    }

    if (anyObj.material) {
      const materials = Array.isArray(anyObj.material)
        ? anyObj.material
        : [anyObj.material]
      for (const material of materials) {
        if (isMaterial(material)) {
          disposeMaterial(material, disposedMaterials, disposedTextures)
        }
      }
    }

    if (anyObj.isLight) {
      if (anyObj.shadow?.map) {
        disposeTexture(anyObj.shadow.map, disposedTextures)
      }
      if (anyObj.shadow?.mapPass) {
        disposeTexture(anyObj.shadow.mapPass, disposedTextures)
      }
      anyObj.shadow?.dispose?.()
      anyObj.dispose?.()
    }
  })

  return {
    geometries: disposedGeometries.size,
    materials: disposedMaterials.size,
    textures: disposedTextures.size,
  }
}

export function releaseGltf(
  url: string,
  scene?: Object3D,
  gltf?: GltfLike,
): {
  geometries: number
  materials: number
  textures: number
} {
  let totals = { geometries: 0, materials: 0, textures: 0 }

  const roots = new Set<Object3D>()
  if (scene) roots.add(scene)
  for (const s of gltf?.scenes ?? []) roots.add(s)

  for (const root of roots) {
    // 씬 그래프에서 먼저 분리 (이후 렌더가 다시 upload 하지 않도록)
    root.removeFromParent()
    const count = disposeObjectTree(root)
    totals = {
      geometries: totals.geometries + count.geometries,
      materials: totals.materials + count.materials,
      textures: totals.textures + count.textures,
    }
  }

  useGLTF.clear(url)

  return totals
}
