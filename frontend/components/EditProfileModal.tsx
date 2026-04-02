"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"

interface Props {
  profile: any
  userId: string
  onClose: () => void
  onSave: (updatedProfile: any) => void
}

export default function EditProfileModal({ profile, userId, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<any>({ ...profile })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error("User not logged in")
      const token = await currentUser.getIdToken()

      const res = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to update profile")
      const updatedProfile = await res.json()
      onSave(updatedProfile)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <div className="flex flex-col gap-3">
          <div>
            <label className="font-semibold">First Name</label>
            <input
              name="firstName"
              value={formData.firstName || ""}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="font-semibold">Last Name</label>
            <input
              name="lastName"
              value={formData.lastName || ""}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="font-semibold">Class Year</label>
            <input
              name="classYear"
              value={formData.classYear || ""}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="font-semibold">Major</label>
            <input
              name="major"
              value={formData.major || ""}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="font-semibold">Interests</label>
            <textarea
              name="interests"
              value={formData.interests || ""}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}