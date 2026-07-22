import { useEffect, useMemo, useRef } from 'react'

import { formatScheduleTime } from '@/adapters/tago/parse'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'
import {
  buildScheduleTimeline,
  rowTimeMs,
  timelineScrollTarget,
  type ScheduleRowPhase,
} from '@/lib/scheduleTiming'
import {
  collectGrades,
  filterByGrade,
  useScheduleStore,
} from '@/stores/scheduleStore'

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function phaseChip(phase: ScheduleRowPhase): string | null {
  switch (phase) {
    case 'boarding':
      return 'Now'
    case 'next':
      return 'Next'
    default:
      return null
  }
}

function ScheduleSkeleton() {
  return (
    <ul className="schedule-list">
      {[0, 1, 2].map((i) => (
        <li key={i} className="schedule-row schedule-row--skeleton">
          <span className="schedule-row__time">--:--</span>
          <span className="schedule-row__meta">Loading…</span>
        </li>
      ))}
    </ul>
  )
}

function NowMarker({ label }: { label: string }) {
  return (
    <li className="schedule-now-marker" data-schedule-anchor="now-marker" aria-hidden>
      <span className="schedule-now-marker__line" />
      <span className="schedule-now-marker__label tabular-nums">NOW {label}</span>
      <span className="schedule-now-marker__line" />
    </li>
  )
}

export function TrainSchedulePanel() {
  const { nowMs, label: nowLabel } = useNow()
  const scrollRef = useRef<HTMLDivElement>(null)

  const status = useScheduleStore((s) => s.status)
  const tab = useScheduleStore((s) => s.tab)
  const gradeFilter = useScheduleStore((s) => s.gradeFilter)
  const departures = useScheduleStore((s) => s.departures)
  const arrivals = useScheduleStore((s) => s.arrivals)
  const lastUpdatedAt = useScheduleStore((s) => s.lastUpdatedAt)
  const errorMessage = useScheduleStore((s) => s.errorMessage)
  const setTab = useScheduleStore((s) => s.setTab)
  const setGradeFilter = useScheduleStore((s) => s.setGradeFilter)
  const refresh = useScheduleStore((s) => s.refresh)

  const grades = useMemo(
    () => ['ALL', ...collectGrades(departures, arrivals)],
    [departures, arrivals],
  )

  const rows = useMemo(() => {
    const source = tab === 'depart' ? departures : arrivals
    const filtered = filterByGrade(source, gradeFilter)
    return [...filtered].sort((a, b) => rowTimeMs(a, tab) - rowTimeMs(b, tab))
  }, [tab, departures, arrivals, gradeFilter])

  const timeline = useMemo(
    () => buildScheduleTimeline(rows, nowMs, tab),
    [rows, nowMs, tab],
  )

  const scrollTarget = useMemo(() => timelineScrollTarget(timeline), [timeline])

  useEffect(() => {
    if (!scrollRef.current || !scrollTarget) return
    const anchor =
      scrollTarget === 'next'
        ? scrollRef.current.querySelector('[data-schedule-anchor="next"]')
        : scrollRef.current.querySelector('[data-schedule-anchor="now-marker"]')
    anchor?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [scrollTarget, tab, gradeFilter, rows.length])

  return (
    <div className="schedule-panel">
      <div className="schedule-panel__tabs" role="tablist" aria-label="Schedule direction">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'depart'}
          className={cn(
            'schedule-panel__tab',
            tab === 'depart' && 'schedule-panel__tab--active',
          )}
          onClick={() => setTab('depart')}
        >
          Departures
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'arrive'}
          className={cn(
            'schedule-panel__tab',
            tab === 'arrive' && 'schedule-panel__tab--active',
          )}
          onClick={() => setTab('arrive')}
        >
          Arrivals
        </button>
      </div>

      <div className="schedule-panel__filters" aria-label="Train type filter">
        {grades.map((grade) => (
          <button
            key={grade}
            type="button"
            className={cn(
              'schedule-panel__chip',
              gradeFilter === grade && 'schedule-panel__chip--active',
            )}
            onClick={() => setGradeFilter(grade)}
          >
            {grade}
          </button>
        ))}
      </div>

      <div className="schedule-panel__scroll" ref={scrollRef}>
        {status === 'loading' && <ScheduleSkeleton />}

        {status === 'error' && (
          <div className="schedule-panel__error">
            <p>Unable to reach TAGO.</p>
            {errorMessage && <p className="schedule-panel__error-detail">{errorMessage}</p>}
            <p className="schedule-panel__error-detail">
              Activate &quot;국토교통부_(TAGO)_열차정보&quot; on data.go.kr and set{' '}
              <code>VITE_TAGO_SERVICE_KEY</code> in <code>.env</code>.
            </p>
            <button type="button" className="schedule-panel__retry" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        )}

        {status !== 'loading' && status !== 'error' && rows.length === 0 && (
          <div className="schedule-panel__empty">No trains for this filter.</div>
        )}

        {status !== 'loading' && status !== 'error' && rows.length > 0 && (
          <ul className="schedule-list">
            {timeline.map((item) => {
              if (item.kind === 'now-marker') {
                return <NowMarker key="now-marker" label={nowLabel} />
              }

              const { row, phase } = item
              const timeMs = rowTimeMs(row, tab)
              const endpoint = tab === 'depart' ? row.arrPlaceName : row.depPlaceName
              const chip = phaseChip(phase)

              return (
                <li
                  key={`${row.trainNo}-${row.depPlanTime}-${row.arrPlanTime}`}
                  className={cn(
                    'schedule-row',
                    phase === 'past' && 'schedule-row--past',
                    phase === 'boarding' && 'schedule-row--boarding',
                    phase === 'next' && 'schedule-row--next',
                  )}
                  data-schedule-anchor={phase === 'next' ? 'next' : undefined}
                >
                  <span className="schedule-row__time tabular-nums">
                    {formatScheduleTime(timeMs)}
                  </span>
                  <div className="schedule-row__body">
                    <span className="schedule-row__train">
                      {row.trainNo}
                      {chip && (
                        <span
                          className={cn(
                            'schedule-row__phase',
                            phase === 'boarding' && 'schedule-row__phase--boarding',
                            phase === 'next' && 'schedule-row__phase--next',
                          )}
                        >
                          {chip}
                        </span>
                      )}
                    </span>
                    <span className="schedule-row__grade">{row.gradeName}</span>
                  </div>
                  <span className="schedule-row__place">{endpoint}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <footer className="schedule-panel__footer">
        <span className="schedule-panel__updated tabular-nums">
          Updated {formatUpdatedAt(lastUpdatedAt)}
        </span>
        {status === 'stale' && (
          <span className="schedule-panel__stale">Refresh delayed</span>
        )}
        <button
          type="button"
          className="schedule-panel__refresh"
          onClick={() => void refresh()}
          aria-label="Refresh schedule"
        >
          ↻
        </button>
      </footer>
    </div>
  )
}
