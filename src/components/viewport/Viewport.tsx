import LightBankControls from "../model/LightBankControls";
import ModelSelector from "../model/ModelSelector";
import ViewportScene from "./ViewportScene";

export default function Viewport() {
  return (
    <div className="relative flex flex-1 w-full h-full">
      <ModelSelector />
      <LightBankControls />
      <ViewportScene />
    </div>
  );
}
