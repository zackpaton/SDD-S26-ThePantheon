"use client"

import React, { useState } from "react"

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
  const [rsvpStatus, setRsvpStatus] = useState<boolean>(false) // Guest RSVP toggle

  const handleRSVP = async () => {
    try {
      // Replace with your API endpoint for RSVP
      await fetch(`http://localhost:3001/api/events/${event.id}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" }
      })
      setRsvpStatus(true)
    } catch (err) {
      console.error("RSVP failed:", err)
    }
  }

  const isCoordinatorOwner = userRole === "Event Coordinator" && event.coordinatorId === userId

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
          {event.location || "N/A"}
        </div>

        <div className="text-sm mb-4">
          <span className="font-semibold">Description: </span>
          {event.description || "N/A"}
        </div>

        {/* Coordinator sees Edit & RSVP info */}
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
              {event.rsvps?.length || 0} people
            </div>
          </>
        )}

        {/* Guest sees RSVP button */}
        {userRole === "Guest User" && (
          <button
            onClick={handleRSVP}
            disabled={rsvpStatus}
            className={`w-full py-2 rounded text-white ${
              rsvpStatus ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {rsvpStatus ? "RSVPed" : "RSVP"}
          </button>
        )}
      </div>
    </div>
  )
}