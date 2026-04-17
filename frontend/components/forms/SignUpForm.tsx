"use client"

/**
 * Registration form: creates a Firebase user then POSTs profile (role, fraternity) to the backend.
 */
import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { API_ORIGIN } from "@/lib/apiBase"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { fraternities } from "@/data/fraternities"

/** Validates passwords, creates the auth account, syncs `/api/users`, and sends the user to the calendar. */
export default function SignUpForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("")
  const [fraternity, setFraternity] = useState("")

  const router = useRouter()

  /** Runs client-side checks, Firebase signup, and backend user creation in sequence. */
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
      await fetch(`${API_ORIGIN}/api/users`, {
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

  const inputClass =
    "w-full rounded border border-gray-300 px-3 py-2.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:py-2 sm:text-sm"

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <form
        className="mb-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-md sm:px-8 sm:pt-6 sm:pb-8"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* First Name */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="text"
            placeholder="First Name"
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* Last Name */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="text"
            placeholder="Last Name"
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <input
            className={inputClass}
            type="password"
            placeholder="Confirm Password"
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Role Dropdown */}
        <div className="mb-4">
          <select
            className={`${inputClass} bg-white`}
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
              className={`${inputClass} bg-white`}
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
            type="button"
            onClick={handleSignup}
            className="min-h-[44px] w-full rounded bg-purple-500 py-2.5 font-bold text-white hover:bg-purple-700 sm:min-h-0 sm:py-2"
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