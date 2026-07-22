import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three-stdlib'
import {
  Light,
  Material,
  Mesh,
  type BufferGeometry,
  type Object3D,
} from 'three'

import model02Url from '@/assets/model/model02.glb?url'
import {
  useWasteModelStore,
  type WasteInstance,
} from '@/stores/wasteModelStore'

/** 인스턴스마다 고유 URL → 로더 캐시 공유 방지 (의도적 재다운로드·재파싱) */
function wasteUrl(instanceId: string): string {
  return `${model02Url}?waste=${encodeURIComponent(instanceId)}`
}

function stripAllLights(root: Object3D) {
  const lights: Light[] = []
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light)
  })
  for (const light of lights) {
    light.parent?.remove(light)
    light.dispose?.()
  }
}

function disposeObject(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return
    const mesh = obj as Mesh
    mesh.geometry.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of mats) mat?.dispose?.()
  })
}

/**
 * clone(true)만으로는 geometry/material이 공유됨.
 * 메시마다 geometry·material을 복제해 GPU/CPU 메모리를 의도적으로 낭비.
 */
function cloneUnshared(source: Object3D): Object3D {
  const clone = source.clone(true)
  clone.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return
    const mesh = obj as Mesh
    mesh.geometry = mesh.geometry.clone() as BufferGeometry
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => m.clone())
    } else if (mesh.material) {
      mesh.material = (mesh.material as Material).clone()
    }
  })
  stripAllLights(clone)
  return clone
}

function WasteModelInstance({ id, position }: WasteInstance) {
  const invalidate = useThree((s) => s.invalidate)
  const [object, setObject] = useState<Object3D | null>(null)

  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()
    const url = wasteUrl(id)

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return
        const root = cloneUnshared(gltf.scene)
        root.position.set(...position)
        setObject(root)
        invalidate()
      },
      undefined,
      (error) => {
        console.error('Failed to load waste model02', error)
      },
    )

    return () => {
      cancelled = true
      setObject((prev) => {
        if (prev) disposeObject(prev)
        return null
      })
    }
  }, [id, position, invalidate])

  if (!object) return null
  return <primitive object={object} />
}

/** Suspense/useGLTF 미사용 — 새 인스턴스 로드가 기존 인스턴스를 언마운트하지 않음 */
export default function WasteModels() {
  const instances = useWasteModelStore((s) => s.instances)

  return (
    <>
      {instances.map((instance) => (
        <WasteModelInstance
          key={instance.id}
          id={instance.id}
          position={instance.position}
        />
      ))}
    </>
  )
}
