import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

interface OverlayPanelProps {
  side: "left" | "right";
  open: boolean;
  onClose: () => void;
  title: string;
  /** CCTV 기본 폭 */
  wide?: boolean;
  /** 콘텐츠 높이에 맞춤 + 헤더 드래그 (데모 영상 뷰어) */
  compact?: boolean;
  /** 좌우 풀폭 확장 */
  expanded?: boolean;
  onToggleExpand?: () => void;
  children: ReactNode;
}

type DragOffset = { x: number; y: number };

const panelPointerHandlers = {
  onPointerEnter: () => useUiStore.getState().enterPanelPointer(),
  onPointerLeave: () => useUiStore.getState().leavePanelPointer(),
};

function clampOffset(
  offset: DragOffset,
  el: HTMLElement | null,
): DragOffset {
  if (!el) return offset;
  const rect = el.getBoundingClientRect();
  const margin = 8;
  const minX = margin - rect.left + offset.x;
  const maxX = window.innerWidth - margin - rect.right + offset.x;
  const minY = margin - rect.top + offset.y;
  const maxY = window.innerHeight - margin - rect.bottom + offset.y;
  return {
    x: Math.min(Math.max(offset.x, minX), maxX),
    y: Math.min(Math.max(offset.y, minY), maxY),
  };
}

export function OverlayPanel({
  side,
  open,
  onClose,
  title,
  wide = false,
  compact = false,
  expanded = false,
  onToggleExpand,
  children,
}: OverlayPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [offset, setOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open || !compact) {
      setOffset({ x: 0, y: 0 });
      setDragging(false);
      dragStartRef.current = null;
    }
  }, [open, compact]);

  const onHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!compact) return;
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest("button")) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStartRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: offset.x,
        originY: offset.y,
      };
      setDragging(true);
      useUiStore.getState().enterPanelPointer();
    },
    [compact, offset.x, offset.y],
  );

  const onHeaderPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragStartRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const next = clampOffset(
        {
          x: drag.originX + (event.clientX - drag.startX),
          y: drag.originY + (event.clientY - drag.startY),
        },
        panelRef.current,
      );
      setOffset(next);
    },
    [],
  );

  const endDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    useUiStore.getState().leavePanelPointer();
  }, []);

  if (!open) return null;

  const isLeft = side === "left";
  const expandable = Boolean(onToggleExpand);

  return (
    <aside
      ref={panelRef}
      className={cn(
        "overlay-panel",
        isLeft ? "overlay-panel--left" : "overlay-panel--right",
        "overlay-panel--open",
        wide && "overlay-panel--wide",
        compact && "overlay-panel--compact",
        compact && dragging && "overlay-panel--dragging",
        expanded && "overlay-panel--expanded",
      )}
      style={
        compact
          ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }
          : undefined
      }
      aria-label={title}
    >
      <div className="overlay-panel__glass" {...panelPointerHandlers}>
        <header
          className={cn(
            "overlay-panel__header",
            compact && "overlay-panel__header--drag",
          )}
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
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
