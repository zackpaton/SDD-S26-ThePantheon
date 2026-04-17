"use client"

/**
 * Week-scoped event list: responsive card grid (chronological), opens the same detail modal as the calendar.
 */
import { useMemo, useState } from "react"
import { formatWeekRangeLabel, getWeekDaysContaining } from "@/lib/dateUtils"
import EventTypeIcon from "@/components/EventTypeIcon"
import type { CalendarBoardState } from "@/components/calendar/useCalendarBoard"
import type { CalendarEvent } from "@/components/calendar/calendarModel"
import CalendarModals from "@/components/calendar/CalendarModals"
import { useCalendarBoard } from "@/components/calendar/useCalendarBoard"

function collectEventsForWeek(weekAnchor: Date, board: CalendarBoardState): CalendarEvent[] {
  const days = getWeekDaysContaining(weekAnchor)
  const byId = new Map<string, CalendarEvent>()
  for (const day of days) {
    for (const ev of board.getEventsForDay(day)) {
      byId.set(ev.id, ev)
    }
  }
  return [...byId.values()].sort((a, b) => a.startTime - b.startTime)
}

function formatEventWhen(ev: CalendarEvent) {
  const start = new Date(ev.startTime * 1000)
  const end = new Date(ev.endTime * 1000)
  const datePart = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  }
  return `${datePart} · ${start.toLocaleTimeString(undefined, opts)} – ${end.toLocaleTimeString(undefined, opts)}`
}

/** Card grid + week navigation; shares `useCalendarBoard` with calendar routes for filters and modals. */
export default function EventsWeekBoard() {
  const board = useCalendarBoard()
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())

  const weekEvents = useMemo(
    () => collectEventsForWeek(weekAnchor, board),
    [weekAnchor, board.events, board.eventTypes, board.fraternitiesShown],
  )

  const weekDays = useMemo(() => getWeekDaysContaining(weekAnchor), [weekAnchor])
  const rangeLabel = formatWeekRangeLabel(weekDays)

  const goPrevWeek = () => {
    const d = new Date(weekAnchor)
    d.setDate(d.getDate() - 7)
    setWeekAnchor(d)
  }

  const goNextWeek = () => {
    const d = new Date(weekAnchor)
    d.setDate(d.getDate() + 7)
    setWeekAnchor(d)
  }

  const btnBase =
    "cursor-pointer rounded border border-black bg-purple-400 px-2 py-1 text-black transition-colors hover:bg-purple-500"

  const { setSelectedEvent, setShowEventDetails } = board

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-2 border-black bg-purple-500 p-2 shadow sm:rounded-xl sm:p-4">
      <div className="mb-3 flex shrink-0 items-center gap-2 sm:mb-4">
        <div className="flex w-[5.25rem] shrink-0 justify-start gap-1 sm:w-[6rem] sm:gap-2">
          <button
            type="button"
            onClick={goPrevWeek}
            className={`${btnBase} min-h-10 min-w-10 px-2 py-2 sm:min-h-0 sm:min-w-0`}
            aria-label="Previous week"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={goNextWeek}
            className={`${btnBase} min-h-10 min-w-10 px-2 py-2 sm:min-h-0 sm:min-w-0`}
            aria-label="Next week"
          >
            ▶
          </button>
        </div>
        <div className="min-w-0 flex-1 px-1 text-center">
          <h2 className="text-[11px] font-bold leading-tight sm:text-lg">{rangeLabel}</h2>
          <p className="mt-0.5 text-[10px] text-black/80 sm:text-sm">Events this week</p>
        </div>
        <div className="w-[5.25rem] shrink-0 sm:w-[6rem]" aria-hidden />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {weekEvents.length === 0 ? (
          <p className="rounded-lg border border-black/20 bg-white/90 py-12 text-center text-neutral-600">
            No events match your filters for this week.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {weekEvents.map(ev => {
              const colorClass = ev.color || "bg-gray-500"
              const loc = ev.location?.trim()
              const desc = ev.description?.trim()
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(ev)
                      setShowEventDetails(true)
                    }}
                    className="flex w-full flex-col rounded-lg border-2 border-black/20 bg-white text-left shadow-sm transition hover:border-black/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className={`h-1.5 w-full shrink-0 rounded-t-md ${colorClass}`} aria-hidden />
                    <div className="relative flex min-h-0 flex-1 flex-col p-3">
                      <span className="pointer-events-none absolute right-3 top-3 text-neutral-500">
                        <EventTypeIcon eventType={ev.eventType} className="h-6 w-6" />
                      </span>
                      <div className="flex flex-col gap-1.5 pr-14">
                        <span className="line-clamp-2 text-base font-semibold text-neutral-900">{ev.title}</span>
                        <span className="text-sm text-neutral-700">{ev.fraternity}</span>
                        <span className="text-sm text-neutral-600">{ev.eventType}</span>
                        <span className="text-sm font-medium text-neutral-800">{formatEventWhen(ev)}</span>
                        {loc ? (
                          <span className="text-sm text-neutral-600">
                            <span className="text-sm text-neutral-600">Location: </span>
                            {loc}
                          </span>
                        ) : null}
                        {desc ? (
                          <p className="line-clamp-4 text-sm text-neutral-600">{desc}</p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <CalendarModals board={board} />
    </div>
  )
}
