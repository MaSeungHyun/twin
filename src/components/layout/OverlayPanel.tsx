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
        "overlay-panel",
        isLeft ? "overlay-panel--left" : "overlay-panel--right",
        "overlay-panel--open",
        wide && "overlay-panel--wide",
        expanded && "overlay-panel--expanded",
      )}
      aria-label={title}
      style={{ zIndex: 9999 }}
    >
      <div className="overlay-panel__glass" {...panelPointerHandlers}>
        <header className="overlay-panel__header">
          <h2 className="overlay-panel__title">{title}</h2>
          <button
            type="button"
            className="overlay-panel__close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={`${title} 패널 닫기`}
          >
            <span aria-hidden>×</span>
          </button>
        </header>
        <div className="overlay-panel__content">{children}</div>
      </div>

      {expandable && (
        <button
          type="button"
          className="overlay-panel__expand"
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
