interface Props {
  view: string
  setView: (v: any) => void
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
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <button onClick={prevMonth}>◀</button>
        <button onClick={nextMonth}>▶</button>
      </div>

      <h2 className="text-lg font-bold">
        {currentDate.toLocaleString("default", { month: "long" })}{" "}
        {currentDate.getFullYear()}
      </h2>

      <div className="flex gap-2">
        <button onClick={() => setView("month")}>Month</button>
        <button onClick={() => setView("week")}>Week</button>
        <button onClick={() => setView("day")}>Day</button>
      </div>
    </div>
  )
}