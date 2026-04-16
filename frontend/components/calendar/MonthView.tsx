"use client"

/**
 * Month grid view: day cells with event chips; filters and modals live in Calendar.tsx.
 */
import { generateMonthMatrix } from "@/lib/dateUtils"
import EventItem from "@/components/EventItem"
import type { CalendarBoardState } from "./useCalendarBoard"

export type { CalendarEvent } from "./calendarModel"

export default function MonthView({
  currentDate,
  board,
}: {
  currentDate: Date
  board: CalendarBoardState
}) {
  const monthMatrix = generateMonthMatrix(currentDate)

  const { setSelectedEvent, setShowEventDetails, getEventsForDay } = board

  return (
    <div className="flex-1 min-w-0">
      <div className="grid grid-cols-7 text-center font-semibold mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthMatrix.map((week, i) =>
          week.map((day, j) => (
            <div
              key={`${i}-${j}`}
              className="h-24 border rounded p-1 text-sm flex flex-col overflow-hidden bg-white"
            >
              <div className="text-xs font-semibold">{day.getDate()}</div>
              <div className="flex-1 overflow-hidden">
                {getEventsForDay(day).map((event) => {
                  const colorClass = event.color || "bg-gray-500"
                  return (
                    <EventItem
                      key={event.id}
                      event={event}
                      color={colorClass}
                      onClick={() => (setSelectedEvent(event), setShowEventDetails(true))}
                    />
                  )
                })}
              </div>
            </div>
          )),
        )}
      </div>
    </div>
  )
}
