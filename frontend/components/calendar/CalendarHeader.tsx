interface Props {
  view: "month" | "week"
  setView: (v: "month" | "week") => void
  currentDate: Date
  setCurrentDate: (d: Date) => void
}

export default function CalendarHeader({
  view,
  setView,
  currentDate,
  setCurrentDate
}: Props) {

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    )
  }

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    )
  }

  return (
    <div className="relative flex items-center mb-4">
      {/* Left: arrows */}
      <div className="flex gap-2">
        <button
          onClick={prevMonth}
          className="cursor-pointer px-2 py-1 border rounded hover:bg-gray-200"
        >
          ◀
        </button>
        <button
          onClick={nextMonth}
          className="cursor-pointer px-2 py-1 border rounded hover:bg-gray-200"
        >
          ▶
        </button>
      </div>

      {/* Center: month label */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h2 className="text-lg font-bold text-center">
          {currentDate.toLocaleString("default", { month: "long" })}{" "}
          {currentDate.getFullYear()}
        </h2>
      </div>

      {/* Right: month/week toggle */}
      <div className="flex gap-2 ml-auto">
        <button
          onClick={() => setView("month")}
          className={`cursor-pointer px-2 py-1 border rounded ${
            view === "month" ? "font-bold" : "font-normal hover:bg-gray-100"
          }`}
        >
          Month
        </button>
        <button
          onClick={() => setView("week")}
          className={`cursor-pointer px-2 py-1 border rounded ${
            view === "week" ? "font-bold" : "font-normal hover:bg-gray-100"
          }`}
        >
          Week
        </button>
      </div>
    </div>
  )
}