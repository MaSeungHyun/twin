import CctvVideoPopup from "../panels/CctvVideoPopup";
import CompassWidget from "./CompassWidget";
import CctvOverlayLayer from "./CctvOverlayLayer";
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

      <div className="pointer-events-none absolute inset-0 z-40">
        <CctvOverlayLayer />
      </div>

      <div className="pointer-events-none absolute inset-0 z-50">
        <CompassWidget />
      </div>

      <CctvVideoPopup />
    </div>
  );
}
