"use client"

/**
 * Calendar shell: shared board state, header, month or week grid, sidebar filters, and modals.
 */
import { useState } from "react"
import MonthView from "./MonthView"
import WeekView from "./WeekView"
import CalendarHeader from "./CalendarHeader"
import CalendarSidebar from "./CalendarSidebar"
import CalendarModals from "./CalendarModals"
import { useCalendarBoard } from "./useCalendarBoard"

export type ViewType = "month" | "week"

export default function Calendar() {
  const board = useCalendarBoard()
  const [view, setView] = useState<ViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())

  return (
    <div className="bg-purple-500 rounded-xl shadow border-2 border-black p-4">
      <CalendarHeader
        view={view}
        setView={setView}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
      />

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          {view === "month" && <MonthView currentDate={currentDate} board={board} />}
          {view === "week" && <WeekView currentDate={currentDate} board={board} />}
        </div>
        <CalendarSidebar board={board} />
      </div>

      <CalendarModals board={board} />
    </div>
  )
}
