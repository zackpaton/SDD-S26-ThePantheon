// /data/fraternities.ts
export const fraternities = [
  { name: "Sigma Chi", color: "bg-yellow-500" },
  { name: "Phi Delta Theta", color: "bg-red-500" },
  { name: "Lambda Chi Alpha", color: "bg-green-500" },
  { name: "Kappa Sigma", color: "bg-purple-500" },
  { name: "Alpha Tau Omega", color: "bg-pink-500" },
  { name: "Pi Kappa Alpha", color: "bg-indigo-500" },
  { name: "Beta Theta Pi", color: "bg-teal-500" },
  { name: "Sigma Alpha Epsilon", color: "bg-orange-500" },
  { name: "Theta Chi", color: "bg-cyan-500" },
  { name: "Phi Kappa Psi", color: "bg-lime-500" },
  { name: "Delta Chi", color: "bg-fuchsia-500" },
  { name: "Sigma Nu", color: "bg-rose-500" },
  { name: "Tau Kappa Epsilon", color: "bg-violet-500" },
  { name: "Zeta Beta Tau", color: "bg-emerald-500" },
  { name: "Alpha Epsilon Pi", color: "bg-sky-500" },
  { name: "Sigma Phi Epsilon", color: "bg-pink-600" },
  { name: "Phi Gamma Delta", color: "bg-blue-600" },
  { name: "Delta Sigma Phi", color: "bg-green-600" },
  { name: "Kappa Alpha Order", color: "bg-red-600" },
  { name: "Pi Kappa Phi", color: "bg-yellow-600" },
  { name: "Phi Sigma Kappa", color: "bg-indigo-600" },
  { name: "Alpha Sigma Phi", color: "bg-purple-600" },
  { name: "Delta Tau Delta", color: "bg-pink-600" },
]

// Optional: create a fast lookup for EventItem colors
export const fraternityColors: Record<string, string> = Object.fromEntries(
  fraternities.map(f => [f.name, f.color])
)