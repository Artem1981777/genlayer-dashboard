"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { readState } from "@/lib/genlayer"
import { loadTracked } from "@/lib/store"
import { TrackedCase } from "@/lib/types"
export function useCases(projectId: string, intervalMs = 6000) {
  const [cases, setCases] = useState<TrackedCase[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const timer = useRef<any>(null)
  const refresh = useCallback(async () => {
    const store = loadTracked(); const addrs = store[projectId] || []
    const results = await Promise.all(addrs.map(async (address) => {
      try { const state = await readState(address); return { address, projectId, state } as TrackedCase }
      catch (e: any) { return { address, projectId, error: String(e?.message || e) } as TrackedCase }
    }))
    setCases(results); setLoading(false); setLastSync(Date.now())
  }, [projectId])
  useEffect(() => {
    setLoading(true); setCases([]); refresh()
    timer.current = setInterval(refresh, intervalMs)
    return () => clearInterval(timer.current)
  }, [refresh, intervalMs])
  return { cases, loading, lastSync, refresh }
}
