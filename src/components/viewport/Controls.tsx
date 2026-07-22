import { OrbitControls } from "@react-three/drei";

export default function Controls(): React.ReactNode {
  return <OrbitControls makeDefault enableDamping={false} />;
}
