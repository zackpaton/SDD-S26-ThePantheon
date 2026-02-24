import { generateMonthMatrix } from "@/lib/dateUtils"

interface Props {
  currentDate: Date
}

export default function MonthView({ currentDate }: Props) {
  const monthMatrix = generateMonthMatrix(currentDate)

  return (
    <div>
      <div className="grid grid-cols-7 text-center font-semibold mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthMatrix.map((week, i) =>
          week.map((day, j) => (
            <div
              key={`${i}-${j}`}
              className="h-24 border rounded p-1 text-sm"
            >
              {day.getDate()}
            </div>
          ))
        )}
      </div>
    </div>
  )
}