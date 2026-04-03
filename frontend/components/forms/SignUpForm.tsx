"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { fraternities } from "@/data/fraternities"

export default function SignUpForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("")
  const [fraternity, setFraternity] = useState("")

  const router = useRouter()

  const handleSignup = async () => {
    try {
      if (password !== confirmPassword) {
        alert("Passwords do not match")
        return
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters")
        return
      }

      if (role === "Event Coordinator" && !fraternity) {
        alert("Please select a fraternity")
        return
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      console.log("✅ User created:", userCredential.user)

      // Send profile data to backend
      await fetch("https://sdd-s26-thepantheon.onrender.com/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          firstName,
          lastName,
          email,
          role,
          fraternity: role === "Event Coordinator" ? fraternity : null,
        }),
      })

      router.push("/calendar")
    } catch (err) {
      console.error("❌ Signup error:", err)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-80"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* First Name */}
        <div className="mb-4">
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            type="text"
            placeholder="First Name"
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* Last Name */}
        <div className="mb-4">
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            type="text"
            placeholder="Last Name"
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            type="password"
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Role Dropdown */}
        <div className="mb-4">
          <select
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="" disabled hidden>
                Select Role
            </option>
            <option>Guest User</option>
            <option>Event Coordinator</option>
          </select>
        </div>

        {/* Fraternity Dropdown (Conditional) */}
        {role === "Event Coordinator" && (
          <div className="mb-4">
            <select
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              value={fraternity}
              onChange={(e) => setFraternity(e.target.value)}
            >

              <option value="" disabled hidden>Select Fraternity</option>
              {fraternities.map(f => (
                <option key={f.name}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <button
            onClick={handleSignup}
            className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 rounded"
          >
            Sign Up
          </button>

          <br />

          <a
            href="/login"
            className="block font-bold text-center text-purple-500 mt-4"
          >
            Already have an account? <br />Login
          </a>
        </div>
      </form>
    </div>
  )
}