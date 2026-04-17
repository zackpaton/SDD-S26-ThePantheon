"use client"

/**
 * Week view: sticky weekday/date row and hour grid share one scroll container so the scrollbar does not
 * narrow columns under the headers; `h-0 flex-1` bounds height so the 24h grid scrolls inside the pane.
 */
import { getWeekDaysContaining } from "@/lib/dateUtils"
import EventTypeIcon from "@/components/EventTypeIcon"
import { layoutWeekDayEvents } from "@/lib/weekEventLayout"
import type { CalendarBoardState } from "./useCalendarBoard"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

const HOUR_PX = 48
const TOTAL_MINUTES = 24 * 60
const HOURS = Array.from({ length: 24 }, (_, i) => i)

/** Same column template for header + grid so labels align with day columns (see sticky header in scroll region). */
const WEEK_GRID_COLS = "48px repeat(7, minmax(0, 1fr))" as const

function formatHourLabel(h: number) {
  if (h === 0) return "12 AM"
  if (h < 12) return `${h} AM`
  if (h === 12) return "12 PM"
  return `${h - 12} PM`
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function WeekView({
  currentDate,
  board,
}: {
  currentDate: Date
  board: CalendarBoardState
}) {
  const weekDays = getWeekDaysContaining(currentDate)
  const { getEventsForDay, setSelectedEvent, setShowEventDetails } = board

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowLinePct = (nowMinutes / TOTAL_MINUTES) * 100

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="h-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]">
        <div className="sticky top-0 z-20 border-b border-black/15 bg-purple-500 pb-2">
          <div
            className="grid gap-1 font-semibold text-center"
            style={{ gridTemplateColumns: WEEK_GRID_COLS }}
          >
            <div aria-hidden className="min-w-[48px] shrink-0" />
            {WEEKDAY_LABELS.map(label => (
              <div
                key={label}
                className="flex min-w-0 items-center justify-center text-sm"
              >
                {label}
              </div>
            ))}
          </div>

          <div
            className="mt-1 grid gap-1 text-center text-xs font-semibold text-black/80"
            style={{ gridTemplateColumns: WEEK_GRID_COLS }}
          >
            <div className="min-w-[48px] shrink-0" />
            {weekDays.map(day => {
              const isToday = isSameDay(day, now)
              return (
                <div
                  key={`d-${day.toISOString()}`}
                  className="flex min-w-0 items-center justify-center"
                >
                  <span
                    className={
                      isToday
                        ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"
                        : "inline-flex min-h-[1.75rem] min-w-[1.75rem] items-center justify-center"
                    }
                  >
                    {day.getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: WEEK_GRID_COLS,
            minHeight: 24 * HOUR_PX,
          }}
        >
          <div className="select-none rounded border border-black/20 bg-white/90 p-0.5">
            {HOURS.map(h => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="text-[10px] text-gray-500 pr-0.5 text-right relative"
              >
                <span className={`absolute right-0 ${h === 0 ? "top-0" : "-top-2"}`}>{formatHourLabel(h)}</span>
              </div>
            ))}
          </div>

          {weekDays.map(day => {
            const isToday = isSameDay(day, now)
            const dayEvents = getEventsForDay(day)
            const layoutById = layoutWeekDayEvents(dayEvents, day)

            return (
              <div
                key={day.toISOString()}
                className={`relative overflow-hidden rounded border border-black bg-white p-1 text-sm flex flex-col ${
                  isToday ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-purple-500" : ""
                }`}
                style={{ minHeight: 24 * HOUR_PX }}
              >
                <div className="relative flex-1">
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="border-b border-gray-100"
                      style={{ height: HOUR_PX }}
                    />
                  ))}

                  {isToday && (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{ top: `${nowLinePct}%` }}
                    >
                      <div className="relative h-0.5 bg-red-500">
                        <span className="absolute -left-0.5 -top-1 h-2 w-2 rounded-full bg-red-500" />
                      </div>
                    </div>
                  )}

                  {dayEvents.map(event => {
                    const layout = layoutById.get(event.id)
                    if (!layout) return null
                    const colorClass = event.color || "bg-gray-500"
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowEventDetails(true)
                        }}
                        className={`absolute rounded px-0.5 py-0.5 text-left text-white text-[10px] leading-tight shadow-sm overflow-hidden hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-400 z-[5] ${colorClass}`}
                        style={{
                          top: `${layout.topPct}%`,
                          height: `${layout.heightPct}%`,
                          left: `calc(${layout.leftPct}% + 1px)`,
                          width: `calc(${layout.widthPct}% - 2px)`,
                          minHeight: 18,
                        }}
                        title={`${event.title} · ${event.fraternity} · ${event.eventType}`}
                      >
                        <div className="relative h-full min-h-0 w-full">
                          <span className="pointer-events-none absolute right-0 top-0 z-[1] text-white drop-shadow-sm">
                            <EventTypeIcon eventType={event.eventType} className="h-3 w-3" />
                          </span>
                          <span className="block truncate pr-3.5 font-semibold leading-tight">{event.title}</span>
                          <span className="block truncate pr-3.5 text-[9px] leading-tight opacity-90">{event.fraternity}</span>
                          <span className="block truncate pr-3.5 text-[9px] leading-tight opacity-90">{event.eventType}</span>
                          <span className="block truncate pr-3.5 text-[9px] leading-tight opacity-85">
                            {new Date(event.startTime * 1000).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
