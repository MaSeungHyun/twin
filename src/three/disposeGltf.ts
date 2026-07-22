import type { Material, Object3D, Texture } from 'three'
import { Light, Mesh } from 'three'
import { useGLTF } from '@react-three/drei'

function disposeMaterial(material: Material) {
  const record = material as Material & Record<string, unknown>
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object' && 'isTexture' in value) {
      ;(value as Texture).dispose()
    }
  }
  material.dispose()
}

/** geometry / material / texture / light GPU·CPU 자원 해제 */
export function disposeObjectTree(root: Object3D) {
  root.traverse((obj) => {
    if ((obj as Light).isLight) {
      ;(obj as Light).dispose?.()
      return
    }
    if (!(obj as Mesh).isMesh) return
    const mesh = obj as Mesh
    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    for (const material of materials) {
      if (material) disposeMaterial(material)
    }
  })
}

export function releaseGltf(url: string, scene?: Object3D) {
  if (scene) disposeObjectTree(scene)
  useGLTF.clear(url)
}
