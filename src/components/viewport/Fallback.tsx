import { useProgress } from "@react-three/drei";
import logo from "../../assets/image/logo.png";

export default function Fallback() {
  const { progress } = useProgress();

  return (
    <div className="absolute inset-0 z-50 flex flex-col pointer-events-none select-none text-center text-sm tracking-wide items-center justify-center gap-4 bg-white backdrop-blur-sm">
      <img src={logo} alt="logo" className="w-1/5" />
      <div className="mt-8 mb-2 h-1.5 w-1/4 overflow-hidden rounded-full bg-white/15 border border-black/10">
        <div
          className="h-full bg-[#0066b3] transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-black">모델 불러오는 중</div>
    </div>
  );
}
