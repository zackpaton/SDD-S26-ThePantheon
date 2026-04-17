import Link from "next/link"

/**
 * Root 404 UI — explicit route avoids relying on Next’s generated /_not-found chunk (can mis-compile in dev on some setups).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">Page not found</h1>
      <p className="max-w-md text-neutral-600">
        The page you requested does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-black bg-purple-400 px-4 py-2 font-medium text-black hover:bg-purple-500"
      >
        Back to home
      </Link>
    </div>
  )
}
