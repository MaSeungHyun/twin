import { ControlShell } from "@/components/layout/ControlShell";
import Viewport from "./components/viewport/Viewport";

export default function App() {
  return (
    <main className="relative h-full w-full overflow-hidden">
      <ControlShell />
      <Viewport />
    </main>
  );
}
