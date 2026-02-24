"use client"

import { useState } from "react"
import MonthView from "./MonthView"
import CalendarHeader from "./CalendarHeader"

export type ViewType = "month" | "week" | "day"

export default function Calendar() {
  const [view, setView] = useState<ViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())

  return (
    <div className="bg-white rounded-xl shadow p-4">
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