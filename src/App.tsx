import { ControlShell } from "@/components/layout/ControlShell";
import Viewport from "./components/viewport/Viewport";

export default function App() {
  return (
    <main className="relative w-screen h-dvh max-w-sceen max-h-dvh min-h-dvh overflow-hidden">
      <ControlShell />
      <Viewport />
    </main>
  );
}
