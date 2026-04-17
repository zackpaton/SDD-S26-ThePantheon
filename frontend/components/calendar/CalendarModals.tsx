"use client"

/**
 * Add / detail / edit event modals shared by month and week views.
 */
import AddEventModal from "@/components/AddEventModal"
import EventDetailsModal from "@/components/EventDetailsModal"
import EditEventModal from "@/components/EditEventModal"
import type { CalendarBoardState } from "./useCalendarBoard"

export default function CalendarModals({ board }: { board: CalendarBoardState }) {
  const {
    userRole,
    userId,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    selectedEvent,
    setSelectedEvent,
    showEventDetails,
    setShowEventDetails,
    fetchEvents,
  } = board

  return (
    <>
      {showAddModal && userId && (
        <AddEventModal
          onClose={() => setShowAddModal(false)}
          onCreate={fetchEvents}
        />
      )}

      {selectedEvent && showEventDetails && (
        <EventDetailsModal
          event={selectedEvent}
          userRole={userRole}
          userId={userId}
          onClose={() => (setSelectedEvent(null), setShowEventDetails(false))}
          onEdit={() => {
            setShowEditModal(true)
            setShowEventDetails(false)
          }}
          onDeleted={() => {
            fetchEvents()
            setSelectedEvent(null)
            setShowEventDetails(false)
          }}
        />
      )}

      {showEditModal && selectedEvent && (
        <EditEventModal
          key={selectedEvent.id}
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false)
            setShowEventDetails(true)
          }}
          onSave={() => {
            fetchEvents()
            setShowEditModal(false)
            setSelectedEvent(null)
            setShowEventDetails(false)
          }}
        />
      )}
    </>
  )
}
