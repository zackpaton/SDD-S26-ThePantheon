/**
 * Calendar grid helper: builds a month view as rows of seven days (Sunday–Saturday), including leading/trailing days from adjacent months.
 */
export function generateMonthMatrix(date: Date): Date[][] {
  const year = date.getFullYear()
  const month = date.getMonth()

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1)

  // Day of week (0 = Sunday, 6 = Saturday)
  const startDay = firstDayOfMonth.getDay()

  // Number of days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Total number of cells needed
  const totalCells = startDay + daysInMonth

  // Determine number of weeks needed (5 or 6)
  const numberOfWeeks = Math.ceil(totalCells / 7)

  const matrix: Date[][] = []

  // Start from the Sunday of the first week shown
  let currentDay = 1 - startDay

  for (let week = 0; week < numberOfWeeks; week++) {
    const weekRow: Date[] = []

    for (let day = 0; day < 7; day++) {
      weekRow.push(new Date(year, month, currentDay))
      currentDay++
    }

    matrix.push(weekRow)
  }

  return matrix
}

/**
 * Returns seven Date objects (Sunday → Saturday) for the week that contains `anchor`.
 */
export function getWeekDaysContaining(anchor: Date): Date[] {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  const dow = d.getDay()
  d.setDate(d.getDate() - dow)
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    days.push(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i))
  }
  return days
}

/**
 * Formats a week range like "Mar 9 – 15, 2025" (uses local timezone).
 */
export function formatWeekRangeLabel(weekDays: Date[]): string {
  if (weekDays.length < 7) return ""
  const start = weekDays[0]
  const end = weekDays[6]
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
}
