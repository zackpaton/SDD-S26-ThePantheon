"use client"

import { useState } from "react"
import MonthView from "./MonthView"
import CalendarHeader from "./CalendarHeader"

export type ViewType = "month" | "week"

export default function Calendar() {
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

      {view === "month" && (
        <MonthView currentDate={currentDate} />
      )}
    </div>
  )
}