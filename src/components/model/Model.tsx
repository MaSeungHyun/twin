import { useEffect, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Light, type Object3D, type WebGLRenderer } from 'three'

import { useModelStore } from '@/stores/modelStore'
import { releaseGltf } from '@/three/disposeGltf'
import {
  GLTF_USE_DRACO,
  GLTF_USE_MESHOPT,
  extendGltfLoader,
} from '@/three/gltfLoader'

declare global {
  interface Window {
    renderer?: WebGLRenderer
  }
}

function logRendererInfo(label: string, gl: WebGLRenderer, extra?: object) {
  const { memory, render, programs } = gl.info
  console.log(`[Model] ${label}`, {
    geometries: memory.geometries,
    textures: memory.textures,
    calls: render.calls,
    triangles: render.triangles,
    programs: programs?.length ?? 0,
    ...extra,
  })
}

function collectLights(root: Object3D) {
  const lights: Light[] = []
  root.traverse((obj) => {
    if ((obj as Light).isLight) lights.push(obj as Light)
  })
  return lights
}

function stripAllLights(root: Object3D) {
  for (const light of collectLights(root)) {
    light.parent?.remove(light)
    light.dispose?.()
  }
}

function ModelScene({ url }: { url: string }) {
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl) as WebGLRenderer
  const { scene } = useGLTF(
    url,
    GLTF_USE_DRACO,
    GLTF_USE_MESHOPT,
    extendGltfLoader,
  )

  useEffect(() => {
    window.renderer = gl
  }, [gl])

  useEffect(() => {
    stripAllLights(scene)
    invalidate()
    // 로드·첫 반영 직후
    requestAnimationFrame(() => {
      logRendererInfo('After load', gl, { url })
    })
  }, [scene, invalidate, gl, url])

  useEffect(() => {
    return () => {
      logRendererInfo('Before dispose', gl, { url })
      releaseGltf(url, scene)
      gl.renderLists?.dispose?.()
      requestAnimationFrame(() => {
        logRendererInfo('After dispose', gl, { url })
      })
    }
  }, [url, scene, gl])

  return <primitive object={scene} />
}

/**
 * 모델 전환: 이전 모델 언마운트·dispose → 여유 프레임 → 새 모델 로드
 * (태블릿 OOM 방지: 170+69 동시 상주 피함)
 */
export default function Model() {
  const selectedUrl = useModelStore((s) => s.selectedUrl)
  const [displayUrl, setDisplayUrl] = useState<string | null>(selectedUrl)
  const displayUrlRef = useRef(displayUrl)
  displayUrlRef.current = displayUrl

  useEffect(() => {
    if (selectedUrl === displayUrlRef.current) return

    const prevUrl = displayUrlRef.current
    const gl = window.renderer
    if (gl) {
      logRendererInfo('Before switch', gl, {
        from: prevUrl,
        to: selectedUrl,
      })
    }

    // 1) 현재 모델 제거 (ModelScene unmount → releaseGltf)
    setDisplayUrl(null)

    let cancelled = false
    let outerRaf = 0
    let innerRaf = 0
    let timer = 0

    outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        // 2) GC·VRAM 정리 여유 (태블릿)
        timer = window.setTimeout(() => {
          if (cancelled) return
          if (window.renderer) {
            logRendererInfo('Before load (gap)', window.renderer, {
              next: selectedUrl,
            })
          }
          setDisplayUrl(selectedUrl)
        }, 100)
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(outerRaf)
      cancelAnimationFrame(innerRaf)
      window.clearTimeout(timer)
    }
  }, [selectedUrl])

  if (!displayUrl) return null

  return <ModelScene key={displayUrl} url={displayUrl} />
}
