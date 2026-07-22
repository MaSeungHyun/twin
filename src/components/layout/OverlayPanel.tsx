import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'

interface OverlayPanelProps {
  side: 'left' | 'right'
  open: boolean
  onToggle: () => void
  collapsedLabel: string
  title?: string
  children: ReactNode
}

const panelPointerHandlers = {
  onPointerEnter: () => useUiStore.getState().enterPanelPointer(),
  onPointerLeave: () => useUiStore.getState().leavePanelPointer(),
}

export function OverlayPanel({
  side,
  open,
  onToggle,
  collapsedLabel,
  title,
  children,
}: OverlayPanelProps) {
  const isLeft = side === 'left'

  return (
    <aside
      className={cn(
        'overlay-panel',
        isLeft ? 'overlay-panel--left' : 'overlay-panel--right',
        open ? 'overlay-panel--open' : 'overlay-panel--collapsed',
      )}
      aria-label={title ?? collapsedLabel}
    >
      <button
        type="button"
        className={cn(
          'overlay-panel__toggle',
          isLeft ? 'overlay-panel__toggle--left' : 'overlay-panel__toggle--right',
        )}
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? `Collapse ${collapsedLabel} panel` : `Expand ${collapsedLabel} panel`}
        {...panelPointerHandlers}
      >
        <span className="overlay-panel__toggle-icon" aria-hidden>
          {isLeft ? (open ? '‹' : '›') : open ? '›' : '‹'}
        </span>
        {!open && (
          <span className="overlay-panel__toggle-label">{collapsedLabel}</span>
        )}
      </button>

      <div className="overlay-panel__glass">
        {open && title && (
          <header className="overlay-panel__header" {...panelPointerHandlers}>
            <h2 className="overlay-panel__title">{title}</h2>
          </header>
        )}
        {open && (
          <div className="overlay-panel__content" {...panelPointerHandlers}>
            {children}
          </div>
        )}
      </div>
    </aside>
  )
}
