// import ModelSelector from "../model/ModelSelector";
// import RenderTestControls from "./RenderTestControls";
import CctvVideoPopup from "../panels/CctvVideoPopup";
import OfficeUI from "../model/OfficeUI";
import CompassWidget from "./CompassWidget";
import Fallback from "./Fallback";
import InitialLoadBootstrap from "./InitialLoadBootstrap";
import ViewportScene from "./ViewportScene";

export default function Viewport() {
  return (
    <div className="relative h-full w-full flex-1">
      <InitialLoadBootstrap />
      <Fallback />

      <div className="absolute inset-0 z-10">
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
