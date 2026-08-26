"use client"
import { PROJECTS } from "./projects"
const KEY = "gl-tracked-v2"
type Store = Record<string, string[]>
function seed(): Store { const s: Store = {}; for (const p of PROJECTS) s[p.id] = [...p.seedContracts]; return s }
export function loadTracked(): Store {
  if (typeof window === "undefined") return seed()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) { const s = seed(); localStorage.setItem(KEY, JSON.stringify(s)); return s }
    const parsed = JSON.parse(raw); const base = seed()
    for (const p of PROJECTS) if (!parsed[p.id]) parsed[p.id] = base[p.id]
    return parsed
  } catch { return seed() }
}
export function saveTracked(s: Store) { if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s)) }
export function addContract(projectId: string, address: string) {
  const s = loadTracked(); const list = s[projectId] || []
  if (!list.map((x) => x.toLowerCase()).includes(address.toLowerCase())) list.unshift(address)
  s[projectId] = list; saveTracked(s); return s
}
export function removeContract(projectId: string, address: string) {
  const s = loadTracked(); s[projectId] = (s[projectId] || []).filter((x) => x.toLowerCase() !== address.toLowerCase())
  saveTracked(s); return s
}
