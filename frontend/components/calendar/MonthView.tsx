"use client"

import { generateMonthMatrix } from "@/lib/dateUtils"
import { useEffect, useState } from "react"
import EventItem from "@/components/EventItem"

interface Props {
  currentDate: Date
}

export default function MonthView({ currentDate }: Props) {
  const monthMatrix = generateMonthMatrix(currentDate)

  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)

  const allEventTypes = ["Meeting", "Holiday", "Birthday", "Workshop", "Other"]
  const allLocations = ["Office", "Remote", "Home", "Client Site"]

  const toggleItem = (item: string, selected: string[], setSelected: any) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item))
    } else {
      setSelected([...selected, item])
    }
  }

  const [events, setEvents] = useState<any[]>([])
  useEffect(() => {
  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/events")
      const data = await res.json()
      setEvents(data)
    } catch (err) {
      console.error("Failed to fetch events:", err)
    }
  }

  fetchEvents()

  const interval = setInterval(fetchEvents, 5000) // every 5 seconds

  return () => clearInterval(interval)
}, [])

  useEffect(() => {
  console.log("Events loaded:", events)
}, [events])

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {

      console.log(event)
      const eventDateUTC = new Date(event.date * 1000)

      // Get timezone offset in seconds
      const offsetSeconds = eventDateUTC.getTimezoneOffset() * 60

      const eventDate = new Date((event.date + offsetSeconds) * 1000)
      console.log(eventDate)
      console.log("here")

      const matchesDate =
        eventDate.getFullYear() === day.getFullYear() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getDate() === day.getDate()

      const matchesType =
        eventTypes.length === 0 || eventTypes.includes(event.eventType)

      const matchesLocation =
        locations.length === 0 || locations.includes(event.location)

      return matchesDate && matchesType && matchesLocation
    })
  }

  return (
    <div className="flex gap-6">
      {/* Calendar */}
      <div className="flex-1">
        <div className="grid grid-cols-7 text-center font-semibold mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthMatrix.map((week, i) =>
            week.map((day, j) => (
              <div
                key={`${i}-${j}`}
                className="h-24 border rounded p-1 text-sm flex flex-col overflow-hidden"
              >
                <div className="text-xs font-semibold">{day.getDate()}</div>

                <div className="flex-1 overflow-hidden">
                  {getEventsForDay(day).map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="w-56 flex flex-col gap-4 relative">
        {/* Event Type */}
        <div className="flex flex-col text-sm font-medium relative">
          <button
            onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
            className={`border rounded p-2 text-left flex justify-between items-center cursor-pointer hover:bg-gray-100
              ${eventDropdownOpen ? "bg-gray-100" : "hover:bg-gray-100"}`}
          >
            {eventTypes.length ? eventTypes.join(", ") : "Event Type"}
            <span className="ml-2">▼</span>
          </button>

          {eventDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 border rounded bg-white shadow z-10 max-h-48 overflow-auto">
              {allEventTypes.map(type => (
                <label
                  key={type}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={eventTypes.includes(type)}
                    onChange={() => toggleItem(type, eventTypes, setEventTypes)}
                  />
                  {type}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex flex-col text-sm font-medium relative">
          <button
            onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
            className={`border rounded p-2 text-left flex justify-between items-center cursor-pointer
              ${locationDropdownOpen ? "bg-gray-100" : "hover:bg-gray-100"}`}
          >
            {locations.length ? locations.join(", ") : "Location"}
            <span className="ml-2">▼</span>
          </button>

          {locationDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 border rounded bg-white shadow z-10 max-h-48 overflow-auto">
              {allLocations.map(loc => (
                <label
                  key={loc}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={locations.includes(loc)}
                    onChange={() => toggleItem(loc, locations, setLocations)}
                  />
                  {loc}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}