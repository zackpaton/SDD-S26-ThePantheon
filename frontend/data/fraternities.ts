/**
 * Static fraternity list with Tailwind color classes for calendar event chips and filters.
 */
export const fraternities = [
  { name: "Acacia", color: "bg-yellow-500" },
  { name: "Alpha Chi Rho", color: "bg-red-500" },
  { name: "Alpha Sigma Phi", color: "bg-green-500" },
  { name: "Chi Phi", color: "bg-purple-500" },
  { name: "Delta Kappa Epsilon", color: "bg-pink-500" },
  { name: "Delta Phi", color: "bg-indigo-500" },
  { name: "Delta Tau Delta", color: "bg-teal-500" },
  { name: "Lambda Chi Alpha", color: "bg-orange-500" },
  { name: "Phi Gamma Delta", color: "bg-cyan-500" },
  { name: "Phi Kappa Theta", color: "bg-lime-500" },
  { name: "Phi Mu Delta", color: "bg-fuchsia-500" },
  { name: "Phi Sigma Kappa", color: "bg-rose-500" },
  { name: "Pi Kappa Alpha", color: "bg-violet-500" },
  { name: "Pi Kappa Phi", color: "bg-emerald-500" },
  { name: "Pi Lambda Phi", color: "bg-sky-500" },
  { name: "Psi Upsilon", color: "bg-pink-600" },
  { name: "Sigma Alpha Epsilon", color: "bg-blue-600" },
  { name: "Sigma Chi", color: "bg-green-600" },
  { name: "Sigma Phi Epsilon", color: "bg-red-600" },
  { name: "Tau Epsilon Phi", color: "bg-yellow-600" },
  { name: "Tau Kappa Epsilon", color: "bg-indigo-600" },
  { name: "Theta Xi", color: "bg-purple-600" },
  { name: "Zeta Psi", color: "bg-pink-600" },
]

/** Map of fraternity name to Tailwind class for quick color lookup without scanning the array. */
export const fraternityColors: Record<string, string> = Object.fromEntries(
  fraternities.map(f => [f.name, f.color]),
)