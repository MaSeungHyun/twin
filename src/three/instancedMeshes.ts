import {
  InstancedMesh,
  Matrix4,
  Mesh,
  StaticDrawUsage,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three'

export type InstancingStats = {
  groups: number
  instances: number
  replacedMeshes: number
  /** 대략 줄어든 draw call 수 (메시 N개 → InstancedMesh 1개) */
  drawCallsSaved: number
}

const geometryIds = new WeakMap<BufferGeometry, number>()
let geometrySeq = 0

function geometryKey(geometry: BufferGeometry): string {
  let id = geometryIds.get(geometry)
  if (id === undefined) {
    // 참조가 다르면 내용 지문으로 묶기 (Unreal 복제 geometry)
    const pos = geometry.getAttribute('position')
    const index = geometry.index
    if (pos?.array) {
      const arr = pos.array as ArrayLike<number>
      const n = arr.length
      const fingerprint = [
        pos.count,
        n,
        arr[0] ?? 0,
        arr[1] ?? 0,
        arr[2] ?? 0,
        arr[n - 3] ?? 0,
        arr[n - 2] ?? 0,
        arr[n - 1] ?? 0,
        index?.count ?? 0,
      ].join(',')
      return `content:${fingerprint}`
    }
    id = ++geometrySeq
    geometryIds.set(geometry, id)
  }
  return `ref:${id}`
}

function materialKey(material: Material): string {
  return material.uuid
}

function groupKey(mesh: Mesh): string | null {
  if ((mesh as Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh) return null
  if ((mesh as Mesh & { isInstancedMesh?: boolean }).isInstancedMesh) {
    return null
  }
  if (Array.isArray(mesh.material)) return null // multi-material은 스킵
  if (!mesh.geometry || !mesh.material) return null
  return `${geometryKey(mesh.geometry)}|${materialKey(mesh.material)}`
}

/**
 * 같은 geometry(+ material)를 쓰는 Mesh들을 InstancedMesh로 합침.
 * world matrix를 instance matrix로 옮기고 원본 Mesh는 제거(geo/mat는 유지).
 */
export function convertRepeatedMeshesToInstanced(
  root: Object3D,
  minCount = 2,
): InstancingStats {
  root.updateMatrixWorld(true)

  const groups = new Map<string, Mesh[]>()

  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return
    const mesh = obj as Mesh
    const key = groupKey(mesh)
    if (!key) return
    const list = groups.get(key)
    if (list) list.push(mesh)
    else groups.set(key, [mesh])
  })

  const matrix = new Matrix4()
  let groupCount = 0
  let instanceCount = 0
  let replacedMeshes = 0

  for (const meshes of groups.values()) {
    if (meshes.length < minCount) continue

    const template = meshes[0]
    const geometry = template.geometry
    const material = template.material as Material

    // 내용 키로 묶인 경우 geometry 참조를 하나로 맞춤
    const orphanGeometries: BufferGeometry[] = []
    for (const mesh of meshes) {
      if (mesh.geometry !== geometry) {
        orphanGeometries.push(mesh.geometry)
        mesh.geometry = geometry
      }
    }

    const instanced = new InstancedMesh(geometry, material, meshes.length)
    instanced.instanceMatrix.setUsage(StaticDrawUsage)
    instanced.name = `Instanced:${template.name || geometry.uuid.slice(0, 8)}`
    instanced.frustumCulled = true

    for (let i = 0; i < meshes.length; i++) {
      matrix.copy(meshes[i].matrixWorld)
      instanced.setMatrixAt(i, matrix)
    }
    instanced.instanceMatrix.needsUpdate = true
    instanced.computeBoundingSphere()

    root.add(instanced)

    for (const mesh of meshes) {
      mesh.removeFromParent()
    }

    for (const geo of orphanGeometries) {
      geo.dispose()
    }

    groupCount += 1
    instanceCount += meshes.length
    replacedMeshes += meshes.length
  }

  return {
    groups: groupCount,
    instances: instanceCount,
    replacedMeshes,
    drawCallsSaved: Math.max(0, replacedMeshes - groupCount),
  }
}
