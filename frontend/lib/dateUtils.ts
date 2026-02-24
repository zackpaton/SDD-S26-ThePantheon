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