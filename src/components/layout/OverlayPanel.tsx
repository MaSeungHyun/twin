import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

interface OverlayPanelProps {
  side: "left" | "right";
  open: boolean;
  onClose: () => void;
  title: string;
  /** CCTV 기본 폭 */
  wide?: boolean;
  /** 좌우 풀폭 확장 */
  expanded?: boolean;
  onToggleExpand?: () => void;
  children: ReactNode;
}

const panelPointerHandlers = {
  onPointerEnter: () => useUiStore.getState().enterPanelPointer(),
  onPointerLeave: () => useUiStore.getState().leavePanelPointer(),
};

const panelAsideBase =
  "pointer-events-none absolute top-[calc(var(--shell-top)+0.5rem)] z-[9999] flex h-[calc(100dvh-var(--shell-top)-var(--shell-bottom)-0.5rem)] max-h-[calc(100dvh-var(--shell-top)-var(--shell-bottom)-0.5rem)] overflow-hidden max-[720px]:left-3 max-[720px]:right-3 max-[720px]:w-auto";

const panelGlass =
  "pointer-events-auto flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[var(--hud-radius)] border border-border bg-panel-strong/70 shadow-[0_16px_40px_rgba(0,0,0,0.32)] backdrop-blur-[var(--glass-blur)] motion-safe:animate-[hud-panel-in_0.2s_ease] motion-reduce:animate-none";

const panelHeader =
  "relative z-[2] flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] bg-panel-strong/80 py-[0.85rem] pr-[0.85rem] pb-3 pl-4 max-[1100px]:gap-1.5 max-[1100px]:py-2 max-[1100px]:pr-3 max-[1100px]:pb-2 max-[1100px]:pl-3";

const panelTitle =
  "m-0 text-[0.98rem] font-semibold tracking-[-0.02em] text-text max-[1100px]:text-[0.84rem]";

const panelCloseBtn =
  "pointer-events-auto relative z-[3] grid size-[2.4rem] shrink-0 cursor-pointer place-items-center rounded-[0.7rem] border border-white/10 bg-white/[0.04] p-0 text-xl leading-none text-text transition-[background,border-color] duration-150 hover:border-accent/35 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-[1100px]:size-8 max-[1100px]:rounded-lg max-[1100px]:text-base";

const panelContent =
  "overlay-panel-dense scrollbar-hud relative z-[1] flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 pt-[0.9rem] pb-4 max-[1100px]:px-3 max-[1100px]:pt-2 max-[1100px]:pb-3";

const panelExpandBtn =
  "pointer-events-auto grid h-[3.1rem] w-[1.55rem] shrink-0 cursor-pointer place-items-center self-center rounded-[0.65rem] border border-border bg-panel-strong text-[1.15rem] leading-none text-muted shadow-[var(--shadow-float)] backdrop-blur-[var(--glass-blur)] transition-[color,background,border-color] duration-150 hover:border-accent/35 hover:bg-accent/10 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-[720px]:hidden";

export function OverlayPanel({
  side,
  open,
  onClose,
  title,
  wide = false,
  expanded = false,
  onToggleExpand,
  children,
}: OverlayPanelProps) {
  if (!open) return null;

  const isLeft = side === "left";
  const expandable = Boolean(onToggleExpand);

  return (
    <aside
      className={cn(
        panelAsideBase,
        isLeft
          ? "left-[1.15rem] flex-row items-stretch"
          : "right-[1.15rem] flex-row-reverse items-stretch gap-[0.35rem]",
        expanded
          ? "left-[1.15rem] right-[1.15rem] z-[2] w-auto max-[1100px]:left-3 max-[1100px]:right-3"
          : wide
            ? "w-[min(32rem,calc(100vw-5.3rem))] max-[1100px]:w-[min(20.5rem,calc(100vw-1.5rem))] max-[640px]:w-[calc(100vw-1.5rem)]"
            : "w-[min(var(--panel-width),calc(100vw-5.3rem))] max-[1100px]:w-[min(18rem,calc(100vw-1.5rem))] max-[640px]:w-[calc(100vw-1.5rem)]",
      )}
      aria-label={title}
    >
      <div className={panelGlass} {...panelPointerHandlers}>
        <header className={panelHeader}>
          <h2 className={panelTitle}>{title}</h2>
          <button
            type="button"
            className={panelCloseBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={`${title} 패널 닫기`}
          >
            <span aria-hidden>×</span>
          </button>
        </header>
        <div className={panelContent}>{children}</div>
      </div>

      {expandable && (
        <button
          type="button"
          className={panelExpandBtn}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          onPointerEnter={panelPointerHandlers.onPointerEnter}
          onPointerLeave={panelPointerHandlers.onPointerLeave}
          aria-pressed={expanded}
          aria-label={expanded ? "CCTV 패널 축소" : "CCTV 패널 확장"}
          title={expanded ? "축소" : "확장"}
        >
          <span aria-hidden>{expanded ? "›" : "‹"}</span>
        </button>
      )}
    </aside>
  );
}
