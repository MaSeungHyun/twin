import { ControlShell } from "@/components/layout/ControlShell";
import Viewport from "./components/viewport/Viewport";
// import Fallback from "./components/viewport/Fallback";

export default function App() {
  return (
    <main className="relative w-screen h-screen max-w-sceen max-h-screen">
      {/* <ControlShell /> */}
      <Viewport />
      {/* <Fallback /> */}
    </main>
  );
}
