import { useCompassStore } from "@/stores/compassStore";
import {
  CARDINAL_LABELS,
  type CardinalDirection,
} from "@/lib/compassNavigation";
import { cn } from "@/lib/utils";

const CARDINALS: {
  dir: CardinalDirection;
  className: string;
}[] = [
  { dir: "N", className: "top-1 left-1/2 -translate-x-1/2" },
  { dir: "E", className: "top-1/2 right-1 -translate-y-1/2" },
  { dir: "S", className: "bottom-1 left-1/2 -translate-x-1/2" },
  { dir: "W", className: "top-1/2 left-1 -translate-y-1/2" },
];

export default function CompassWidget() {
  const heading = useCompassStore((s) => s.heading);
  const requestRotateTo = useCompassStore((s) => s.requestRotateTo);
  const needleDeg = (heading * 180) / Math.PI;

  return (
    <div
      className="pointer-events-auto fixed right-5 bottom-5 z-100"
      aria-label="나침반"
    >
      <div className="relative size-42 lg:size-36 select-none">
        <div
          className="absolute inset-0 rounded-full border border-white/20 bg-[rgba(15,17,23,0.58)] shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md"
          aria-hidden
        >
          <div className="absolute top-2 bottom-2 left-1/2 w-px -translate-x-1/2 bg-[#4da3ff]/40" />
          <div className="absolute top-1/2 right-2 left-2 h-px -translate-y-1/2 bg-white/15" />
        </div>

        <div
          className="pointer-events-none absolute inset-3 flex items-center justify-center"
          style={{ transform: `rotate(${needleDeg}deg)` }}
          aria-hidden
        >
          <svg viewBox="0 0 40 40" className="size-full overflow-visible">
            <polygon points="20,4 23,20 20,17 17,20" fill="#e85d5d" />
            <polygon points="20,36 23,20 20,23 17,20" fill="#8b93a7" />
            <circle cx="20" cy="20" r="2.5" fill="#e8eaed" />
          </svg>
        </div>

        {CARDINALS.map(({ dir, className }) => (
          <button
            key={dir}
            type="button"
            aria-label={CARDINAL_LABELS[dir].ariaLabel}
            onClick={() => requestRotateTo(dir)}
            className={cn(
              "absolute z-10 min-w-5 cursor-pointer rounded px-1 py-0.5 text-lg lg:text-md font-bold leading-none transition-colors",
              "text-[#e8eaed] hover:bg-[#4da3ff]/25 hover:text-[#4da3ff]",
              dir === "N" && "text-[#e85d5d]",
              className,
            )}
          >
            {CARDINAL_LABELS[dir].label}
          </button>
        ))}
      </div>
    </div>
  );
}
