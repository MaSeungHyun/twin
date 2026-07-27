// import ModelSelector from "../model/ModelSelector";
// import RenderTestControls from "./RenderTestControls";
import CctvVideoPopup from "../panels/CctvVideoPopup";
import OfficeUI from "../model/OfficeUI";
import CompassWidget from "./CompassWidget";
import ViewportScene from "./ViewportScene";

export default function Viewport() {
  return (
    <div className="relative h-full w-full flex-1">
      <div className="absolute inset-0">
        <ViewportScene />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30">
        <OfficeUI />
        <CompassWidget />
      </div>

      <CctvVideoPopup />
    </div>
  );
}
