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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-black bg-purple-500 p-4 shadow">
      <CalendarHeader
        view={view}
        setView={setView}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
      />

      <div className="flex min-h-0 flex-1 gap-6 items-stretch overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {view === "month" && <MonthView currentDate={currentDate} board={board} />}
          {view === "week" && <WeekView currentDate={currentDate} board={board} />}
        </div>

        <CalendarSidebar board={board} />
      </div>

      <CalendarModals board={board} />
    </div>
  )

}

