"use client"

import React, { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"

interface EventDetailsModalProps {
  event: any
  userRole: "Event Coordinator" | "Guest User"
  userId: string | null
  onClose: () => void
  onEdit?: () => void
}

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
  // Initialize RSVP state
  // -----------------------------
  useEffect(() => {
    if (!userId || !event.attendeeIds) return
    const isAttending = event.attendeeIds.includes(userId)
    setRsvpStatus(isAttending)
  }, [event, userId])

  // -----------------------------
  // Initialize Notification state
  // -----------------------------
  useEffect(() => {
    if (!userId || !event.notificationAttendeeIds) return
    const isNotifications = event.notificationAttendeeIds.includes(userId)
    setNotificationsEnabled(isNotifications)
  }, [event, userId])

  // -----------------------------
  // Fetch attendee names
  // -----------------------------
  useEffect(() => {
    const fetchAttendees = async () => {
      if (!event.attendeeIds || event.attendeeIds.length === 0) {
        setAttendeeNames([])
        return
      }

      try {
        const token = await auth.currentUser?.getIdToken()

        const names = await Promise.all(
          event.attendeeIds.map(async (uid: string) => {
            const res = await fetch(`https://sdd-s26-thepantheon.onrender.com/api/users/${uid}`, {
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
  const handleRSVP = async () => {
    try {
      const token = await auth.currentUser?.getIdToken()

      const endpoint = rsvpStatus
        ? `/api/events/${event.id}/unrsvp`
        : `/api/events/${event.id}/rsvp`

      await fetch(`https://sdd-s26-thepantheon.onrender.com${endpoint}`, {
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
  // Notification toggle (frontend only for now)
  // -----------------------------
  const handleNotificationToggle = async (checked: boolean) => {
    setNotificationsEnabled(checked)

    // OPTIONAL: Hook this up later to backend
    
    try {
      const token = await auth.currentUser?.getIdToken()

      await fetch(`https://sdd-s26-thepantheon.onrender.com/api/events/${event.id}/notifications`, {
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

        <h2 className="text-xl font-bold mb-4">{event.title}</h2>

        <div className="text-sm mb-2">
          <span className="font-semibold">Date: </span>
          {new Date(event.date * 1000).toLocaleString()}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Type: </span>
          {event.eventType}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Fraternity: </span>
          {event.fraternity}
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">Location: </span>
          {event.location || (
            <span className="text-gray-400 italic">Not provided</span>
          )}
        </div>

        <div className="text-sm mb-4">
          <span className="font-semibold">Description: </span>
          {event.description || (
            <span className="text-gray-400 italic">No description</span>
          )}
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
              {event.attendeeCount === 0 && "0 people"}
              {event.attendeeCount === 1 && "1 person"}
              {event.attendeeCount > 1 && `${event.attendeeCount} people`}
            </div>

            {/* Attendee list */}
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
                rsvpStatus
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {rsvpStatus ? "Withdraw RSVP" : "RSVP"}
            </button>

            {/* Notifications (only if RSVPed) */}
            {rsvpStatus && (
              <label className="flex items-center gap-2 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) =>
                    handleNotificationToggle(e.target.checked)
                  }
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