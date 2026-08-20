"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { PROJECTS } from "@/lib/projects"
type Mode = "live" | "demo"
type Ctx = { projectId: string; setProjectId: (id: string) => void; mode: Mode; setMode: (m: Mode) => void }
const AppCtx = createContext<Ctx | null>(null)
export function useApp() { const c = useContext(AppCtx); if (!c) throw new Error("useApp outside provider"); return c }
export function Providers({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectId] = useState(PROJECTS[0].id)
  const [mode, setMode] = useState<Mode>("live")
  useEffect(() => {
    try { const p = localStorage.getItem("gl-project"); if (p) setProjectId(p); const m = localStorage.getItem("gl-mode") as Mode; if (m) setMode(m) } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem("gl-project", projectId) } catch {} }, [projectId])
  useEffect(() => { try { localStorage.setItem("gl-mode", mode) } catch {} }, [mode])
  return <AppCtx.Provider value={{ projectId, setProjectId, mode, setMode }}>{children}</AppCtx.Provider>
}
