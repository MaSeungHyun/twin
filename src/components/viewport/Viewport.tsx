// import ModelSelector from "../model/ModelSelector";
// import RenderTestControls from "./RenderTestControls";
import CctvVideoPopup from "../panels/CctvVideoPopup";
import OfficeUI from "../model/OfficeUI";
import ViewportScene from "./ViewportScene";

export default function Viewport() {
  return (
    <div className="relative flex flex-1 w-full h-full">
      {/* <ModelSelector />
      <RenderTestControls /> */}
      <OfficeUI />
      <CctvVideoPopup />
      <ViewportScene />
    </div>
  );
}
