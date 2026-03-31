export interface CalendarEvent {
  id: string
  title: string
  date: Date  // Will be converted from timestamp
  startTime?: string
  endTime?: string
  type: "Meeting" | "Holiday" | "Birthday" | "Workshop" | "Other"
  location?: string
  color?: string
  description?: string
}