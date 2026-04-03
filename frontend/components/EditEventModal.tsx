"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"

export default function EditEventModal({ event, onClose, onSave }: any) {
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

  // -----------------------------
  // Pre-fill form
  // -----------------------------
  useEffect(() => {
    if (!event) return

    const dateObj = new Date(event.date * 1000)
    const startObj = new Date(event.startTime * 1000)
    const endObj = new Date(event.endTime * 1000)

    setForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      eventType: event.eventType || "",
      date: dateObj.toISOString().split("T")[0],
      startTime: startObj.toISOString().substring(11, 16),
      endTime: endObj.toISOString().substring(11, 16),

      isFormalRush: event.isFormalRush || false,
      beneficiary: event.beneficiary || "",
      fundraisingGoal: event.fundraisingGoal?.toString() || "",
      isFormal: event.isFormal || false,
      hasAlcohol: event.hasAlcohol || false,
      maxCapacity: event.maxCapacity?.toString() || "",
    })
  }, [event])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  // -----------------------------
  // Submit (PUT instead of POST)
  // -----------------------------
  const handleSubmit = async () => {
    try {
      const convDate = `${form.date}T00:00:00-04:00`
      const startISO = `${form.date}T${form.startTime}:00-04:00`
      const endISO = `${form.date}T${form.endTime}:00-04:00`

      const token = await auth.currentUser?.getIdToken()
        const uid = auth.currentUser?.uid

        const res = await fetch(`https://sdd-s26-thepantheon.onrender.com/api/users/${uid}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        })
        const coordinator = await res.json()

      const payload: any = {
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

      await fetch(`https://sdd-s26-thepantheon.onrender.com/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      onSave()
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  // -----------------------------
  // UI (IDENTICAL ORDER)
  // -----------------------------
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Edit Event</h2>

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