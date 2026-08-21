"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { PROJECTS } from "@/lib/projects"
import { useApp } from "./providers"
import { LayoutDashboard, BarChart3, ShieldCheck, TrendingUp, Menu, X, Plus } from "lucide-react"
import { WalletButton } from "./wallet-button"
const ICONS: Record<string, any> = { ShieldCheck, TrendingUp }
export function Sidebar() {
  const { projectId, setProjectId, mode, setMode } = useApp()
  const path = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="mobilebar">
        <button className="btn icon" onClick={() => setOpen(true)}><Menu size={18} /></button>
        <b>GenLayer Dashboard</b>
      </div>
      <aside className={"sidebar" + (open ? " open" : "")}>
        <div className="brand">
          <div className="mark">◆</div>
          <div style={{ flex: 1 }}><b>GenLayer</b><span>Builder Dashboard</span></div>
          <button className="btn icon" onClick={() => setOpen(false)}><X size={16} /></button>
        </div>
        <div className="side-label">Projects</div>
        {PROJECTS.map((p) => {
          const Icon = ICONS[p.icon] || ShieldCheck
          return (
            <div key={p.id} className={"proj" + (p.id === projectId ? " active" : "")} onClick={() => { setProjectId(p.id); setOpen(false) }}>
              <div className="ic"><Icon size={16} /></div>
              <div className="t"><b>{p.name}</b><span>{p.tagline}</span></div>
            </div>
          )
        })}
        <div className="proj" style={{ opacity: .6 }}><div className="ic"><Plus size={16} /></div><div className="t"><b>Add project</b><span>coming soon</span></div></div>
        <div className="side-label">Navigate</div>
        <Link href="/" className={"navlink" + (path === "/" ? " active" : "")}><LayoutDashboard size={16} /> Overview</Link>
        <Link href="/analytics" className={"navlink" + (path === "/analytics" ? " active" : "")}><BarChart3 size={16} /> Analytics</Link>
        <div className="side-foot">
          <WalletButton />
          <div className="toggle">
            <button className={mode === "live" ? "on" : ""} onClick={() => setMode("live")}>Live</button>
            <button className={mode === "demo" ? "on" : ""} onClick={() => setMode("demo")}>Demo</button>
          </div>
          <span className="dim" style={{ fontSize: 11, textAlign: "center" }}>Testnet Bradbury · 4221</span>
        </div>
      </aside>
    </>
  )
}
