/**
 * Period navigation and month/week toggle: arrows step by month or week depending on active view.
 */
import { formatWeekRangeLabel, getWeekDaysContaining } from "@/lib/dateUtils"

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
  setCurrentDate,
}: Props) {
  const goPrev = () => {
    if (view === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      )
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    }
  }

  const goNext = () => {
    if (view === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      )
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    }
  }

  const title =
    view === "month"
      ? `${currentDate.toLocaleString("default", { month: "long" })} ${currentDate.getFullYear()}`
      : formatWeekRangeLabel(getWeekDaysContaining(currentDate))

  const btnBase =
    "cursor-pointer px-2 py-1 border border-black rounded bg-purple-400 text-black hover:bg-purple-500 transition-colors"

  return (
    <div className="relative flex items-center mb-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={goPrev}
          className={btnBase}
          aria-label={view === "month" ? "Previous month" : "Previous week"}
        >
          ◀
        </button>
        <button
          type="button"
          onClick={goNext}
          className={btnBase}
          aria-label={view === "month" ? "Next month" : "Next week"}
        >
          ▶
        </button>
      </div>

      <div className="absolute left-1/2 max-w-[70%] -translate-x-1/2 transform text-center">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setView("month")}
          className={`${btnBase} ${view === "month" ? "font-bold ring-2 ring-black ring-offset-2 ring-offset-purple-500" : ""}`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setView("week")}
          className={`${btnBase} ${view === "week" ? "font-bold ring-2 ring-black ring-offset-2 ring-offset-purple-500" : ""}`}
        >
          Week
        </button>
      </div>
    </div>
  )
}
