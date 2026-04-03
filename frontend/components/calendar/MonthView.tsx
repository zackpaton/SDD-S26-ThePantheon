"use client"

import { generateMonthMatrix } from "@/lib/dateUtils"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import EventItem from "@/components/EventItem"
import AddEventModal from "@/components/AddEventModal"
import EventDetailsModal from "@/components/EventDetailsModal"
import EditEventModal from "@/components/EditEventModal"
import { fraternities } from "@/data/fraternities"
import { eventTypes as allEventTypes } from "@/data/eventTypes"

export default function MonthView({ currentDate }: { currentDate: Date }) {
  const monthMatrix = generateMonthMatrix(currentDate)

  // -----------------------------
  // User state
  // -----------------------------
  const [userRole, setUserRole] = useState<"Event Coordinator" | "Guest User">("Guest User")
  const [userFraternity, setUserFraternity] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) return

        const token = await currentUser.getIdToken()
        const uid = currentUser.uid

        const res = await fetch(`https://sdd-s26-thepantheon.onrender.com/api/users/${uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        setUserRole(data.role) // "Event Coordinator" or "Guest User"
        setUserFraternity(data.fraternity)
        setUserId(uid)
      } catch (err) {
        console.error("Failed to fetch user data:", err)
      }
    }

    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchUserData()
    })

    return () => unsubscribe()
  }, [])

  // -----------------------------
  // Filters & Dropdowns
  // -----------------------------
  const allFraternities = fraternities.map(f => f.name)

  const [eventTypes, setEventTypes] = useState<string[]>([...allEventTypes])
  const [fraternitiesShown, setFraternitiesShown] = useState<string[]>([...allFraternities])
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const [fraternityDropdownOpen, setFraternityDropdownOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  const toggleItem = (item: string, selected: string[], setSelected: any) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item))
    } else {
      setSelected([...selected, item])
    }
  }

  const toggleAll = (allItems: string[], selected: string[], setSelected: any) => {
    if (selected.length === allItems.length) {
      setSelected([])
    } else {
      setSelected([...allItems])
    }
  }

  // -----------------------------
  // Events state
  // -----------------------------
  const [events, setEvents] = useState<any[]>([])

  const fetchEvents = async () => {
    try {
      const res = await fetch("https://sdd-s26-thepantheon.onrender.com/api/events")
      const data = await res.json()

      // Attach color dynamically based on fraternity
      const coloredEvents = data.map((ev: any) => {
        const frat = fraternities.find(f => f.name === ev.fraternity)
        console.log(ev)
        return {
          ...ev,
          color: frat ? frat.color : "bg-gray-500",
        }
      })

      setEvents(coloredEvents)
    } catch (err) {
      console.error("Failed to fetch events:", err)
    }
  }

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 5000)
    return () => clearInterval(interval)
  }, [])

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDateUTC = new Date(event.date * 1000)
      const offsetSeconds = eventDateUTC.getTimezoneOffset() * 60
      const eventDate = new Date((event.date + offsetSeconds) * 1000)

      const matchesDate =
        eventDate.getFullYear() === day.getFullYear() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getDate() === day.getDate()

      const matchesType = eventTypes.includes(event.eventType)
      const matchesFraternity = fraternitiesShown.includes(event.fraternity)

      return matchesDate && matchesType && matchesFraternity
    })
  }

  // -----------------------------
  // Render
  // -----------------------------
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
                  {getEventsForDay(day).map((event) => {
                    const colorClass = event.color || "bg-gray-500"
                    return (
                      <EventItem
                        key={event.id}
                        event={event}
                        color={colorClass}
                        onClick={() => (setSelectedEvent(event), setShowEventDetails(true))} // <-- open the EventDetailsModal
                      />
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-56 flex flex-col gap-4 relative">
        {/* Event Type Filter */}
        <div className="flex flex-col text-sm font-medium relative">
          <button
            onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
            className={`border rounded p-2 text-left flex justify-between items-center cursor-pointer hover:bg-gray-100
              ${eventDropdownOpen ? "bg-gray-100" : "hover:bg-gray-100"}`}
          >
            {"Event Types"}
            <span className="ml-2">▼</span>
          </button>

          {eventDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 border rounded bg-white shadow z-10 max-h-56 overflow-auto p-2">
              <button
                onClick={() => toggleAll(allEventTypes, eventTypes, setEventTypes)}
                className="text-sm underline mb-2"
              >
                {eventTypes.length === allEventTypes.length ? "Unselect All" : "Select All"}
              </button>
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

        {/* Fraternity Filter */}
        <div className="flex flex-col text-sm font-medium relative">
          <button
            onClick={() => setFraternityDropdownOpen(!fraternityDropdownOpen)}
            className={`border rounded p-2 text-left flex justify-between items-center cursor-pointer
              ${fraternityDropdownOpen ? "bg-gray-100" : "hover:bg-gray-100"}`}
          >
            {"Fraternities"}
            <span className="ml-2">▼</span>
          </button>

          {fraternityDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 border rounded bg-white shadow z-10 max-h-56 overflow-auto p-2">
              <button
                onClick={() => toggleAll(allFraternities, fraternitiesShown, setFraternitiesShown)}
                className="text-sm underline mb-2"
              >
                {fraternitiesShown.length === allFraternities.length ? "Unselect All" : "Select All"}
              </button>
              {fraternities.map(f => (
                <label
                  key={f.name}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={fraternitiesShown.includes(f.name)}
                    onChange={() => toggleItem(f.name, fraternitiesShown, setFraternitiesShown)}
                  />
                  {f.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Add Event Button: only visible to coordinators at the bottom */}
        {userRole === "Event Coordinator" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Event
          </button>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && userId && (
        <AddEventModal
          onClose={() => setShowAddModal(false)}
          onCreate={fetchEvents}
          userFraternity={userFraternity}
          userId={userId}
        />
      )}

      {selectedEvent && showEventDetails && userId && (
        <EventDetailsModal
          event={selectedEvent}
          userRole={userRole}
          userId={userId}
          onClose={() => (setSelectedEvent(null), setShowEventDetails(false))}
          onEdit={() => {
            setShowEditModal(true) // Opens Add/Edit Event modal
            setShowEventDetails(false)
          }}
        />
      )}

      {showEditModal && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false)
            setShowEventDetails(true)
          }}
          onSave={() => {
            fetchEvents() // refresh calendar
            setShowEditModal(false)
            setSelectedEvent(null)
            setShowEventDetails(false)
          }}
        />
      )}
    </div>
  )
}