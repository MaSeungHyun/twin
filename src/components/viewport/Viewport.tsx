import { useProgress } from "@react-three/drei";

import ModelSelector from "../model/ModelSelector";

import Fallback from "./Fallback";
import ViewportScene from "./ViewportScene";

function ModelLoadingOverlay() {
  const { active } = useProgress();
  if (!active) return null;
  return <Fallback />;
}

export default function Viewport() {
  return (
    <div className="relative flex flex-1 w-full h-full">
      <ModelSelector />
      <ModelLoadingOverlay />
      <ViewportScene />
    </div>
  );
}
