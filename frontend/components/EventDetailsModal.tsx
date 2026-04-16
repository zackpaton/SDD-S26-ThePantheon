"use client"

/**
 * Read-only event detail sheet with coordinator tools (edit, RSVP counts) and guest RSVP / notification toggles.
 */
import React, { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import type { CalendarEvent } from "@/components/calendar/MonthView"

interface EventDetailsModalProps {
  event: CalendarEvent
  userRole: "Event Coordinator" | "Guest User"
  userId: string | null
  onClose: () => void
  onEdit?: () => void
}

/** Loads attendee display names, keeps RSVP/notification UI in sync with the event payload, and calls backend PUT routes. */
export default function EventDetailsModal({
  event,
  userRole,
  userId,
  onClose,
  onEdit
}: EventDetailsModalProps) {
  const [rsvpStatus, setRsvpStatus] = useState<boolean>(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false)
  const [attendeeNames, setAttendeeNames] = useState<string[]>([])

  // -----------------------------
  // Sync RSVP / notification toggles from event + user (deferred to avoid sync setState in effect)
  // -----------------------------
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (userId && event.attendeeIds) {
        setRsvpStatus(event.attendeeIds.includes(userId))
      }
      if (userId && event.notificationAttendeeIds) {
        setNotificationsEnabled(event.notificationAttendeeIds.includes(userId))
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [event, userId])

  // -----------------------------
  // Fetch attendee names
  // -----------------------------
  useEffect(() => {
    /** Resolves each attendee uid to a display name via GET /api/users/:uid. */
    const fetchAttendees = async () => {
      if (!event.attendeeIds || event.attendeeIds.length === 0) {
        setAttendeeNames([])
        return
      }

      try {
        const token = await auth.currentUser?.getIdToken()
        const names = await Promise.all(
          event.attendeeIds.map(async (uid: string) => {
            const res = await fetch(`http://localhost:3001/api/users/${uid}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            const data = await res.json()
            return `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown User"
          })
        )
        setAttendeeNames(names)
      } catch (err) {
        console.error("Failed to fetch attendees:", err)
      }
    }
    fetchAttendees()
  }, [event])

  // -----------------------------
  // RSVP toggle handler
  // -----------------------------
  /** Toggles RSVP by calling the rsvp or unrsvp endpoint for the current user. */
  const handleRSVP = async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      const endpoint = rsvpStatus
        ? `/api/events/${event.id}/unrsvp`
        : `/api/events/${event.id}/rsvp`

      await fetch(`http://localhost:3001${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      setRsvpStatus(!rsvpStatus)
    } catch (err) {
      console.error("RSVP toggle failed:", err)
    }
  }

  // -----------------------------
  // Notification toggle
  // -----------------------------
  /** Enables or disables the one-hour reminder for guests who have RSVPed. */
  const handleNotificationToggle = async (checked: boolean) => {
    setNotificationsEnabled(checked)
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch(`http://localhost:3001/api/events/${event.id}/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: checked }),
      })
    } catch (err) {
      console.error("Notification update failed:", err)
    }
  }

  const isCoordinatorOwner =
    userRole === "Event Coordinator" && event.coordinatorId === userId

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 max-w-md w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">{event.title}</h2>

        <div className="text-sm mb-2">
          <span className="font-semibold">Fraternity: </span>
          {event.fraternity}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Type: </span>
          {event.eventType}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Date/Time: </span>
          {(() => {
            const startTime = new Date(event.startTime * 1000)
            const endTime = new Date(event.endTime * 1000)
            
            const optionsDate: Intl.DateTimeFormatOptions = {
              month: "numeric",
              day: "numeric",
              year: "numeric",
            }

            const optionsTime: Intl.DateTimeFormatOptions = {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }

            const dateStr = startTime.toLocaleDateString(undefined, optionsDate)
            const startTimeStr = startTime.toLocaleTimeString(undefined, optionsTime)
            const endTimeStr = endTime.toLocaleTimeString(undefined, optionsTime)

            return `${dateStr}, ${startTimeStr} - ${endTimeStr}`
          })()}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Location: </span>
          {event.location || <span className="text-gray-400 italic">Not provided</span>}
        </div>

        <div className="text-sm mb-4">
          <span className="font-semibold">Description: </span>
          {event.description || <span className="text-gray-400 italic">No description</span>}
        </div>

        {/* Coordinator view */}
        {isCoordinatorOwner && (
          <>
            <button
              onClick={onEdit}
              className="mb-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              Edit Event
            </button>

            <div className="text-sm mb-2">
              <span className="font-semibold">RSVPs: </span>
              {(event.attendeeCount ?? 0) === 0 && "0 people"}
              {(event.attendeeCount ?? 0) === 1 && "1 person"}
              {(event.attendeeCount ?? 0) > 1 && `${event.attendeeCount} people`}
            </div>

            {attendeeNames.length > 0 && (
              <div className="text-sm mt-2 max-h-32 overflow-auto border rounded p-2">
                {attendeeNames.map((name, index) => (
                  <div key={index}>{name}</div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Guest view */}
        {userRole === "Guest User" && (
          <>
            <button
              onClick={handleRSVP}
              className={`w-full py-2 rounded text-white ${
                rsvpStatus ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {rsvpStatus ? "Withdraw RSVP" : "RSVP"}
            </button>

            {rsvpStatus && (
              <label className="flex items-center gap-2 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => handleNotificationToggle(e.target.checked)}
                />
                Notify me 1 hour before
              </label>
            )}
          </>
        )}
      </div>
    </div>
  )
}