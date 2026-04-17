"use client"

/**
 * Shared state for month and week calendar views: auth, events, filters, and event detail modals.
 */
import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { API_ORIGIN } from "@/lib/apiBase"
import { auth } from "@/lib/firebase"
import { fraternities } from "@/data/fraternities"
import { eventTypes as allEventTypes } from "@/data/eventTypes"
import type { CalendarEvent } from "./calendarModel"

export function useCalendarBoard() {
  const [userRole, setUserRole] = useState<"Event Coordinator" | "Guest User">("Guest User")
  const [userId, setUserId] = useState<string | null>(null)

  const allFraternities = fraternities.map(f => f.name)

  const [eventTypes, setEventTypes] = useState<string[]>([...allEventTypes])
  const [fraternitiesShown, setFraternitiesShown] = useState<string[]>([...allFraternities])
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const [fraternityDropdownOpen, setFraternityDropdownOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) return

        const token = await currentUser.getIdToken()
        const uid = currentUser.uid

        const res = await fetch(`${API_ORIGIN}/api/users/${uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        setUserRole(data.role)
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

  const toggleItem = (
    item: string,
    selected: string[],
    setSelected: Dispatch<SetStateAction<string[]>>,
  ) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item))
    } else {
      setSelected([...selected, item])
    }
  }

  const toggleAll = (
    allItems: string[],
    selected: string[],
    setSelected: Dispatch<SetStateAction<string[]>>,
  ) => {
    if (selected.length === allItems.length) {
      setSelected([])
    } else {
      setSelected([...allItems])
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/events`)
      const data: unknown = await res.json()

      if (!res.ok || !Array.isArray(data)) {
        console.error("Failed to fetch events:", !res.ok ? res.status : "not an array", data)
        setEvents([])
        return
      }

      const coloredEvents = (data as CalendarEvent[]).map((ev) => {
        const frat = fraternities.find(f => f.name === ev.fraternity)
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
    const initial = setTimeout(() => {
      void fetchEvents()
    }, 0)
    const interval = setInterval(() => {
      void fetchEvents()
    }, 5000)
    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [])

  /** Events matching a calendar day and current filters (same logic as month cells). */
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

  return {
    userRole,
    userId,
    allEventTypes,
    allFraternities,
    eventTypes,
    setEventTypes,
    fraternitiesShown,
    setFraternitiesShown,
    eventDropdownOpen,
    setEventDropdownOpen,
    fraternityDropdownOpen,
    setFraternityDropdownOpen,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    selectedEvent,
    setSelectedEvent,
    showEventDetails,
    setShowEventDetails,
    events,
    fetchEvents,
    toggleItem,
    toggleAll,
    getEventsForDay,
  }
}

export type CalendarBoardState = ReturnType<typeof useCalendarBoard>
