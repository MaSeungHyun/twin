import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Light, type Object3D } from 'three'

import { useModelStore } from '@/stores/modelStore'

function collectLights(root: Object3D) {
  const lights: Light[] = []
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light)
  })
  return lights
}

/** GLB 내장 라이트는 WebGL/WebGPU 모두 셰이더 한도를 초과할 수 있어 제거 */
function stripAllLights(root: Object3D) {
  for (const light of collectLights(root)) {
    light.parent?.remove(light)
    light.dispose?.()
  }
}

function ModelScene({ url }: { url: string }) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    return () => {
      useGLTF.clear(url)
    }
  }, [url])

  const modelScene = useMemo(() => {
    const clone = scene.clone(true)
    stripAllLights(clone)
    return clone
  }, [scene])

  return <primitive object={modelScene} />
}

export default function Model({ enableGPU }: { enableGPU: boolean }) {
  const modelUrl = useModelStore((s) => s.selectedUrl)

  return (
    <ModelScene
      key={`${modelUrl}-${enableGPU ? 'gpu' : 'gl'}`}
      url={modelUrl}
    />
  )
}
