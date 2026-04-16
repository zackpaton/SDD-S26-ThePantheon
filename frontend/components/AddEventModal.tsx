"use client"

/**
 * Modal form for coordinators to create a new calendar event (typed fields per event category) and POST to the API.
 */
import { useState, type ChangeEvent } from "react"
import { auth } from "@/lib/firebase"

type CreateEventPayload = {
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

type AddEventModalProps = {
  onClose: () => void
  onCreate: () => void
}

/** Controlled form that loads coordinator info, builds the payload, and calls onCreate after a successful POST. */
export default function AddEventModal({ onClose, onCreate }: AddEventModalProps) {
  const [submitError, setSubmitError] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    eventType: "",
    date: "",
    startTime: "",
    endTime: "",

    // Recruitment
    isFormalRush: false,

    // Philanthropy
    beneficiary: "",
    fundraisingGoal: "",

    // Social
    isFormal: false,
    hasAlcohol: false,
    maxCapacity: "",
  })

  /** Updates a single form field from controlled inputs or checkboxes. */
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

  /** Validates implicit required fields, POSTs JSON to /api/events with auth, then closes and refreshes. */
  const handleSubmit = async () => {
  try {
    setSubmitError("")
    const convDate = `${form.date}T00:00:00-04:00`
    const startISO = `${form.date}T${form.startTime}:00-04:00`
    const endISO = `${form.date}T${form.endTime}:00-04:00`

    // 🔹 Fetch coordinator profile from backend
    const token = await auth.currentUser?.getIdToken()
    const uid = auth.currentUser?.uid

    const res = await fetch(`http://localhost:3001/api/users/${uid}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const coordinator = (await res.json()) as {
      id?: string
      fraternity?: string
    }

    const payload: CreateEventPayload = {
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

    // Add only relevant fields
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

    const createRes = await fetch("http://localhost:3001/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const body = (await createRes.json().catch(() => ({}))) as { error?: string }
    if (!createRes.ok) {
      setSubmitError(body.error || `Could not create event (${createRes.status})`)
      return
    }

    onCreate()
    onClose()
  } catch (err) {
    console.error(err)
    setSubmitError("Something went wrong. Please try again.")
  }
}

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add Event</h2>

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
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="description"
            placeholder="Description"
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="location"
            placeholder="Location"
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            type="date"
            name="date"
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="time"
            name="startTime"
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="time"
            name="endTime"
            onChange={handleChange}
            className="border p-2 rounded"
          />

          {/* ===== Dynamic Fields ===== */}

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
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                name="fundraisingGoal"
                placeholder="Fundraising Goal ($)"
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
            Add
          </button>
        </div>
      </div>
    </div>
  )
}