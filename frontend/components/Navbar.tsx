"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { name: "Calendar", path: "/calendar" },
  { name: "Events", path: "/events" },
  { name: "Chat", path: "/chat" },
  { name: "Profile", path: "/profile" },
  { name: "Settings", path: "/settings" },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo / App Name */}
        <Link href="/calendar" className="text-xl font-semibold">
          Greeked Out
        </Link>

        {/* Nav Links */}
        <div className="flex gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.path

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}