import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Light, type Object3D } from 'three'

import { MODEL_OPTIONS } from '@/assets/model'
import { useModelStore } from '@/stores/modelStore'

for (const option of MODEL_OPTIONS) {
  useGLTF.preload(option.url, true)
}

/** MeshStandardMaterial fragment uniform 한도를 넘지 않도록 GLB 라이트 상한 */
const MAX_LIGHTS = 100

function collectLights(root: Object3D) {
  const lights: Light[] = []
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light)
  })
  return lights
}

function limitLights(root: Object3D, max = MAX_LIGHTS) {
  const lights = collectLights(root)
  if (lights.length <= max) return

  lights.sort((a, b) => b.intensity - a.intensity)
  for (const light of lights.slice(max)) {
    light.parent?.remove(light)
  }
}

function stripAllLights(root: Object3D) {
  for (const light of collectLights(root)) {
    light.parent?.remove(light)
    light.dispose?.()
  }
}

function ModelScene({
  url,
  enableGPU,
}: {
  url: string
  enableGPU: boolean
}) {
  const { scene } = useGLTF(url)

  const modelScene = useMemo(() => {
    const clone = scene.clone(true)
    if (enableGPU) {
      // WebGPURenderer는 GLB PointLight 다수 + StandardMaterial 조합을 WebGL처럼 지원하지 않음
      stripAllLights(clone)
    } else {
      limitLights(clone)
    }
    return clone
  }, [scene, enableGPU])

  return <primitive object={modelScene} />
}

export default function Model({ enableGPU }: { enableGPU: boolean }) {
  const modelUrl = useModelStore((s) => s.selectedUrl)

  return (
    <ModelScene
      key={`${modelUrl}-${enableGPU ? 'gpu' : 'gl'}`}
      url={modelUrl}
      enableGPU={enableGPU}
    />
  )
}
