import logo from "../../assets/image/logo.png";
import {
  useInitialLoadProgress,
  useInitialLoadVisible,
} from "@/stores/initialLoadStore";

export default function Fallback() {
  const visible = useInitialLoadVisible();
  const progress = useInitialLoadProgress();

  if (!visible) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[200] flex flex-col select-none items-center justify-center gap-4 bg-white text-center text-sm tracking-wide backdrop-blur-sm">
      <img src={logo} alt="logo" className="w-1/5" />
      <div className="mt-8 mb-2 h-1.5 w-1/4 overflow-hidden rounded-full border border-black/10 bg-white/15">
        <div
          className="h-full bg-[#0066b3] transition-[width] duration-200 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="text-black">모델 및 영상 준비 중…</div>
    </div>
  );
}