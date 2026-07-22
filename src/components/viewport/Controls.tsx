import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

export default function Controls(): React.ReactNode {
  const scene = useThree((state) => state.scene);

  const clock = useThree((state) => state.clock);
  const elapsedTime = clock.getElapsedTime();

  useFrame((state, delta) => {
    const position = elapsedTime * 0.01;
    scene.children[0].position.set(position, 0, 0);
  });

  return <OrbitControls makeDefault enableDamping={false} />;
}
