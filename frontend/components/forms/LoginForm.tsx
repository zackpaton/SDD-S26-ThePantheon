"use client"

/**
 * Email/password login form using Firebase Auth; redirects to /calendar on success.
 */
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

/** Uncontrolled inputs with local state; calls signInWithEmailAndPassword then router.push. */
export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  /** Signs in with Firebase and navigates to the calendar route. */
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()

      console.log("✅ Logged in:", userCredential.user)
      console.log("🔥 Token:", token)

      // redirect after login
      router.push("/calendar")
    } catch (err) {
      console.error("❌ Login error:", err)
    }
  }

  const inputClass =
    "w-full rounded border border-gray-300 px-3 py-2.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:py-2 sm:text-sm"

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
      <form
        className="mb-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-md sm:px-8 sm:pt-6 sm:pb-8"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="mb-4">
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={handleLogin}
            className="min-h-[44px] w-full rounded bg-purple-500 py-2.5 font-bold text-white hover:bg-purple-700 sm:min-h-0 sm:py-2"
          >
            Login
          </button>

          <a className="block text-right text-purple-500 mt-2">
            Forgot Password?
          </a>

          <br />

          <a
            href="/sign-up"
            className="block font-bold text-center text-purple-500"
          >
            Don't have an account? <br />Sign up
          </a>
        </div>
      </form>
    </div>
  )
}