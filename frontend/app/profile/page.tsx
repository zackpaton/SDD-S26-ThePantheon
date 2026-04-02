"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        return
      }

      setUser(currentUser)

      try {
        // 🔥 Fetch profile from your backend (recommended)
        const token = await currentUser.getIdToken()

        const res = await fetch(`http://localhost:3001/api/users/${currentUser.uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()
        setProfile(data)
      } catch (err) {
        console.error("Failed to load profile:", err)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = "/login"
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg">You are not logged in.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="bg-white shadow rounded p-6 flex flex-col gap-4">
        <div>
          <span className="font-semibold">First Name: </span>
          {profile?.firstName || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Last Name: </span>
          {profile?.lastName || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Class Year: </span>
          {profile?.classYear || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Major: </span>
          {profile?.major || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Interests: </span>
          {profile?.interests || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Email: </span>
          {user.email}
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  )
}