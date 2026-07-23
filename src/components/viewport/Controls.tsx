import { OrbitControls } from '@react-three/drei'

import { isMobileDevice } from '@/lib/device'

/** 과도한 줌인 → 픽셀 fill-rate 폭주 → Context Lost 방지 */
export default function Controls(): React.ReactNode {
  const mobile = isMobileDevice()

  return (
    <OrbitControls
      makeDefault
      enableDamping={false}
      minDistance={mobile ? 5 : 2}
      maxDistance={2500}
      zoomSpeed={mobile ? 0.6 : 0.9}
      rotateSpeed={mobile ? 0.7 : 1}
      panSpeed={mobile ? 0.6 : 1}
      maxPolarAngle={Math.PI * 0.495}
    />
  )
}
