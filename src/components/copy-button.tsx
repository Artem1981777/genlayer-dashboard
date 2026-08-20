"use client"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
export function CopyButton({ text, title }: { text: string; title?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button className="btn icon" title={title || "Copy"} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setOk(true); toast.success("Copied"); setTimeout(() => setOk(false), 1200) }
      catch { toast.error("Copy failed") }
    }}>{ok ? <Check size={14} /> : <Copy size={14} />}</button>
  )
}
