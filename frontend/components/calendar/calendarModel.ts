/**
 * Event shape from the API plus UI fields (e.g. color) used in month and week
 * calendar views.
 */
export type CalendarEvent = {
  id: string
  title: string
  description?: string
  location?: string
  eventType: string
  fraternity: string
  date: number
  startTime: number
  endTime: number
  coordinatorId?: string
  attendeeIds?: string[]
  notificationAttendeeIds?: string[]
  notifiedAttendeeIds?: string[]
  attendeeCount?: number
  color?: string
  isFormalRush?: boolean
  beneficiary?: string
  fundraisingGoal?: number
  isFormal?: boolean
  hasAlcohol?: boolean
  maxCapacity?: number
}
