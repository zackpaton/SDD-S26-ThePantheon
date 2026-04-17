"use client"

/**
 * Modal to edit the signed-in user’s profile fields and persist via PUT /api/users/:userId.
 */
import { useState } from "react"
import { API_ORIGIN } from "@/lib/apiBase"
import { auth } from "@/lib/firebase"

/** User document fields used by this modal and returned from the API. */
export type UserProfile = {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
  classYear?: string
  major?: string
  interests?: string
  role?: string
  fraternity?: string
}

interface Props {
  profile: UserProfile
  userId: string
  onClose: () => void
  onSave: (updatedProfile: UserProfile) => void
}

/** Local form mirrors profile; on successful save passes the server JSON to onSave before closing. */
export default function EditProfileModal({ profile, userId, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<UserProfile>({ ...profile })
  const [loading, setLoading] = useState(false)

  /** Merges input/textarea changes into formData by field name. */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  /** Authenticated PUT of formData; surfaces errors to the console only. */
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error("User not logged in")
      const token = await currentUser.getIdToken()

      const res = await fetch(`${API_ORIGIN}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to update profile")
      const updatedProfile = (await res.json()) as UserProfile
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