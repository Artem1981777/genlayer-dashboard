"use client"
import { useState } from "react"
import { addContract } from "@/lib/store"
import { toast } from "sonner"
import { Plus } from "lucide-react"
export function AddContract({ projectId, onAdded }: { projectId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState("")
  if (!open) return <button className="btn" onClick={() => setOpen(true)}><Plus size={14} /> Add</button>
  return (
    <div className="flex gap center wrap">
      <input className="input" style={{ maxWidth: 220 }} placeholder="0x… address" value={val} onChange={(e) => setVal(e.target.value)} />
      <button className="btn primary" onClick={() => {
        const a = val.trim()
        if (!/^0x[a-fA-F0-9]{40}$/.test(a)) { toast.error("Invalid address"); return }
        addContract(projectId, a); setVal(""); setOpen(false); onAdded(); toast.success("Contract added")
      }}>Save</button>
      <button className="btn" onClick={() => { setOpen(false); setVal("") }}>Cancel</button>
    </div>
  )
}
