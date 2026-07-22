import { Html, useProgress } from "@react-three/drei";
import logo from "../../assets/image/logo.png";

export default function Fallback() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col flex-1  pointer-events-none select-none text-center text-sm tracking-wide w-screen h-screen items-center justify-center gap-4">
        <img src={logo} alt="logo" className="w-1/5" />
        <div className="mt-12 mb-2 h-1.5 w-1/4 overflow-hidden rounded-full bg-white/15 border border-black/10">
          <div
            className="h-full bg-blue-500/70 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-black">모델 불러오는 중</div>
      </div>
    </Html>
  );
}
