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
  "pointer-events-none absolute top-[calc(var(--shell-top)+0.5rem)] z-[9999] flex h-[calc(100dvh-var(--shell-top)-var(--shell-bottom)-0.5rem)] max-h-[calc(100dvh-var(--shell-top)-var(--shell-bottom)-0.5rem)] overflow-hidden";

const panelWidthDefault = "w-full sm:w-[200px] md:w-[280px] lg:w-[360px]";

const panelWidthWide = "w-full sm:w-[320px] md:w-[352px] lg:w-[400px]";

const panelWidthExpanded =
  "inset-x-3 z-[2] w-auto sm:inset-x-4 lg:inset-x-[1.15rem]";

const panelSideLeft =
  "left-3 sm:left-4 lg:left-[1.15rem] flex-row items-stretch";

const panelSideRight =
  "right-3 sm:right-4 lg:right-[1.15rem] flex-row-reverse items-stretch gap-1.5";

const panelGlass =
  "pointer-events-auto flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[var(--hud-radius)] border border-border bg-panel-strong/70 shadow-[0_16px_40px_rgba(0,0,0,0.32)] backdrop-blur-[var(--glass-blur)] motion-safe:animate-[hud-panel-in_0.2s_ease] motion-reduce:animate-none";

const panelHeader =
  "relative z-[2] flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] bg-panel-strong/80 px-4 py-3.5 max-lg:gap-1.5 max-lg:px-3 max-lg:py-2";

const panelTitle =
  "m-0 text-sm font-semibold tracking-tight text-text lg:text-[0.98rem]";

const panelCloseBtn =
  "pointer-events-auto relative z-[3] grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/10 bg-white/[0.04] p-0 text-base leading-none text-text transition-[background,border-color] duration-150 hover:border-accent/35 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:size-[2.4rem] lg:rounded-[0.7rem] lg:text-xl";

const panelContent =
  "overlay-panel-dense scrollbar-hud relative z-[1] flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 py-2 lg:px-4 lg:pt-[0.9rem] lg:pb-4";

const panelExpandBtn =
  "pointer-events-auto grid h-[3.1rem] w-[1.55rem] shrink-0 cursor-pointer place-items-center self-center rounded-[0.65rem] border border-border bg-panel-strong text-[1.15rem] leading-none text-muted shadow-[var(--shadow-float)] backdrop-blur-[var(--glass-blur)] transition-[color,background,border-color] duration-150 hover:border-accent/35 hover:bg-accent/10 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-md:hidden";

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
        isLeft ? panelSideLeft : panelSideRight,
        expanded
          ? panelWidthExpanded
          : wide
            ? panelWidthWide
            : panelWidthDefault,
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
