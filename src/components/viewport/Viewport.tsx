import LightBankControls from "../model/LightBankControls";
import ModelSelector from "../model/ModelSelector";
import RenderTestControls from "./RenderTestControls";
import ViewportScene from "./ViewportScene";

export default function Viewport() {
  return (
    <div className="relative flex flex-1 w-full h-full">
      <ModelSelector />
      <RenderTestControls />
      <LightBankControls />
      <ViewportScene />
    </div>
  );
}
