"use client"

/**
 * Modal for editing an existing event: pre-fills from Unix timestamps, PUTs updates, and runs onSave on success.
 */
import { useState, type ChangeEvent } from "react"
import { API_ORIGIN } from "@/lib/apiBase"
import { auth } from "@/lib/firebase"

type EditableEvent = {
  id: string
  title?: string
  description?: string
  location?: string
  eventType?: string
  date: number
  startTime: number
  endTime: number
  isFormalRush?: boolean
  beneficiary?: string
  fundraisingGoal?: number
  isFormal?: boolean
  hasAlcohol?: boolean
  maxCapacity?: number
}

type UpdateEventPayload = {
  title: string
  description: string
  location: string
  eventType: string
  date: string
  startTime: string
  endTime: string
  coordinatorId: string | undefined
  fraternity: string | undefined
  isFormalRush?: boolean
  beneficiary?: string
  fundraisingGoal?: number
  isFormal?: boolean
  hasAlcohol?: boolean
  maxCapacity?: number
}

type EditEventModalProps = {
  event: EditableEvent
  onClose: () => void
  onSave: () => void
}

type EditEventFormState = {
  title: string
  description: string
  location: string
  eventType: string
  date: string
  startTime: string
  endTime: string
  isFormalRush: boolean
  beneficiary: string
  fundraisingGoal: string
  isFormal: boolean
  hasAlcohol: boolean
  maxCapacity: string
}

/** Maps a stored event (Unix seconds) into date/time strings for HTML date and time inputs. */
function createFormStateFromEvent(ev: EditableEvent): EditEventFormState {
  const dateObj = new Date(ev.date * 1000)
  const startObj = new Date(ev.startTime * 1000)
  const endObj = new Date(ev.endTime * 1000)
  const pad = (n: number) => n.toString().padStart(2, "0")

  return {
    title: ev.title || "",
    description: ev.description || "",
    location: ev.location || "",
    eventType: ev.eventType || "",
    date: dateObj.toISOString().split("T")[0],
    startTime: `${pad(startObj.getHours())}:${pad(startObj.getMinutes())}`,
    endTime: `${pad(endObj.getHours())}:${pad(endObj.getMinutes())}`,
    isFormalRush: ev.isFormalRush || false,
    beneficiary: ev.beneficiary || "",
    fundraisingGoal: ev.fundraisingGoal?.toString() || "",
    isFormal: ev.isFormal || false,
    hasAlcohol: ev.hasAlcohol || false,
    maxCapacity: ev.maxCapacity?.toString() || "",
  }
}

/** Form state is initialized from props via createFormStateFromEvent; PUT merges coordinator fields from the API user record. */
export default function EditEventModal({ event, onClose, onSave }: EditEventModalProps) {
  const [submitError, setSubmitError] = useState("")
  const [form, setForm] = useState<EditEventFormState>(() => createFormStateFromEvent(event))

  /** Updates one field in the local edit form (text or checkbox). */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target
    const name = target.name
    const nextValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : (target as HTMLInputElement | HTMLSelectElement).value
    setForm({
      ...form,
      [name]: nextValue,
    })
  }

  // -----------------------------
  // Submit (PUT instead of POST)
  // -----------------------------
  /** Sends PUT /api/events/:id with the merged body and coordinator metadata, then onSave + onClose. */
  const handleSubmit = async () => {
    try {
      setSubmitError("")
      const convDate = `${form.date}T00:00:00-04:00`
      const startISO = `${form.date}T${form.startTime}:00-04:00`
      const endISO = `${form.date}T${form.endTime}:00-04:00`

      const token = await auth.currentUser?.getIdToken()
        const uid = auth.currentUser?.uid

        const res = await fetch(`${API_ORIGIN}/api/users/${uid}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        })
        const coordinator = (await res.json()) as {
          id?: string
          fraternity?: string
        }

      const payload: UpdateEventPayload = {
        title: form.title,
        description: form.description,
        location: form.location,
        eventType: form.eventType,
        date: convDate,
        startTime: startISO,
        endTime: endISO,
        // 🔹 Coordinator info
      coordinatorId: coordinator.id,
      fraternity: coordinator.fraternity,
      }

      // Match AddEventModal logic EXACTLY
      if (form.eventType === "Recruitment") {
        payload.isFormalRush = form.isFormalRush
      }

      if (form.eventType === "Philanthropy") {
        payload.beneficiary = form.beneficiary
        payload.fundraisingGoal = Number(form.fundraisingGoal)
      }

      if (form.eventType === "Social") {
        payload.isFormal = form.isFormal
        payload.hasAlcohol = form.hasAlcohol
        payload.maxCapacity = Number(form.maxCapacity)
      }

      const putRes = await fetch(`${API_ORIGIN}/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const putBody = (await putRes.json().catch(() => ({}))) as { error?: string }
      if (!putRes.ok) {
        setSubmitError(putBody.error || `Could not save event (${putRes.status})`)
        return
      }

      onSave()
      onClose()
    } catch (err) {
      console.error(err)
      setSubmitError("Something went wrong. Please try again.")
    }
  }

  // -----------------------------
  // UI (IDENTICAL ORDER)
  // -----------------------------
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Edit Event</h2>

        {submitError ? (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {/* Event Type FIRST */}
          <select
            name="eventType"
            value={form.eventType}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          >
            <option value="" disabled hidden>
              Event Type
            </option>
            <option>Recruitment</option>
            <option>Philanthropy</option>
            <option>Social</option>
            <option>Other</option>
          </select>

          {/* Base fields */}
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          {/* ===== Dynamic Fields (IDENTICAL) ===== */}

          {form.eventType === "Recruitment" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isFormalRush"
                checked={form.isFormalRush}
                onChange={handleChange}
              />
              Formal Recruitment
            </label>
          )}

          {form.eventType === "Philanthropy" && (
            <>
              <input
                name="beneficiary"
                placeholder="Beneficiary"
                value={form.beneficiary}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                name="fundraisingGoal"
                placeholder="Fundraising Goal ($)"
                value={form.fundraisingGoal}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </>
          )}

          {form.eventType === "Social" && (
            <>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFormal"
                  checked={form.isFormal}
                  onChange={handleChange}
                />
                Formal Event
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hasAlcohol"
                  checked={form.hasAlcohol}
                  onChange={handleChange}
                />
                Has Alcohol
              </label>

              <input
                name="maxCapacity"
                placeholder="Maximum Capacity"
                value={form.maxCapacity}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}