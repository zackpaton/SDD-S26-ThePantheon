"use client"

/**
 * Week view: same weekday header row as month view; seven bordered day columns share one vertical scroll with a time gutter.
 */
import { getWeekDaysContaining } from "@/lib/dateUtils"
import type { CalendarBoardState } from "./useCalendarBoard"
import type { CalendarEvent } from "./calendarModel"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

const HOUR_PX = 48
const TOTAL_MINUTES = 24 * 60
const HOURS = Array.from({ length: 24 }, (_, i) => i)

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

function eventBlockStyle(event: CalendarEvent, day: Date): { topPct: number; heightPct: number } | null {
  const start = new Date(event.startTime * 1000)
  const end = new Date(event.endTime * 1000)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null

  const ys = day.getFullYear()
  const ms = day.getMonth()
  const ds = day.getDate()
  const dayStart = new Date(ys, ms, ds, 0, 0, 0, 0)
  const dayEnd = new Date(ys, ms, ds, 23, 59, 59, 999)

  if (end < dayStart || start > dayEnd) return null

  const visStart = start < dayStart ? dayStart : start
  const visEnd = end > dayEnd ? dayEnd : end

  const toMin = (d: Date) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  const startMin = toMin(visStart)
  const endMin = toMin(visEnd)
  const topPct = (startMin / TOTAL_MINUTES) * 100
  const heightPct = Math.max(((endMin - startMin) / TOTAL_MINUTES) * 100, 1.25)
  return { topPct, heightPct }
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
    <div className="flex-1 min-w-0">
      {/* Align headers with day columns: spacer + Sun…Sat (same feel as month view) */}
      <div
        className="grid gap-1 mb-2 text-center font-semibold"
        style={{ gridTemplateColumns: `48px repeat(7, minmax(0, 1fr))` }}
      >
        <div aria-hidden className="min-w-[48px]" />
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-sm">
            {label}
          </div>
        ))}
      </div>

      {/* Date row — day numbers under each weekday */}
      <div
        className="grid gap-1 mb-1 text-center text-xs font-semibold text-black/80"
        style={{ gridTemplateColumns: `48px repeat(7, minmax(0, 1fr))` }}
      >
        <div className="min-w-[48px]" />
        {weekDays.map(day => {
          const isToday = isSameDay(day, now)
          return (
            <div key={`d-${day.toISOString()}`}>
              <span
                className={
                  isToday
                    ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"
                    : ""
                }
              >
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Single scroll: time gutter + seven day boxes move together */}
      <div className="overflow-y-auto max-h-[min(70vh,720px)] pr-0.5">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `48px repeat(7, minmax(0, 1fr))`,
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
                <span className={`absolute right-0 ${h === 0 ? 'top-0' : '-top-2'}`}>{formatHourLabel(h)}</span>
              </div>
            ))}
          </div>

          {weekDays.map(day => {
            const isToday = isSameDay(day, now)
            const dayEvents = getEventsForDay(day)

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
                    const layout = eventBlockStyle(event, day)
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
                        className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-left text-white text-[10px] leading-tight shadow-sm overflow-hidden hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-400 z-[5] ${colorClass}`}
                        style={{
                          top: `${layout.topPct}%`,
                          height: `${layout.heightPct}%`,
                          minHeight: 18,
                        }}
                        title={event.title}
                      >
                        <span className="block truncate font-semibold">{event.title}</span>
                        <span className="block truncate text-[9px] opacity-90">
                          {new Date(event.startTime * 1000).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
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
