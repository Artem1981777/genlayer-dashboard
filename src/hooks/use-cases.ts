"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { readState } from "@/lib/genlayer"
import { loadTracked } from "@/lib/store"
import { TrackedCase } from "@/lib/types"
async function readRetry(address: string, tries = 3): Promise<any> {
  let last: any = null
  for (let i = 0; i < tries; i++) {
    try { return await readState(address) } catch (e) { last = e; await new Promise((r) => setTimeout(r, 700 * (i + 1))) }
  }
  throw last
}
async function mapLimit(items: string[], limit: number, fn: (a: string) => Promise<TrackedCase>): Promise<TrackedCase[]> {
  const out: TrackedCase[] = new Array(items.length)
  let idx = 0
  async function worker() { while (idx < items.length) { const c = idx++; out[c] = await fn(items[c]) } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, () => worker()))
  return out
}
export function useCases(projectId: string, intervalMs = 6000) {
  const [cases, setCases] = useState<TrackedCase[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const timer = useRef<any>(null)
  const good = useRef<Record<string, TrackedCase>>({})
  const refresh = useCallback(async () => {
    const store = loadTracked(); const addrs = store[projectId] || []
    const results = await mapLimit(addrs, 3, async (address) => {
      try { const state = await readRetry(address); const tc = { address, projectId, state } as TrackedCase; good.current[address] = tc; return tc }
      catch (e: any) { const prev = good.current[address]; if (prev) return prev; return { address, projectId, error: String(e?.message || e) } as TrackedCase }
    })
    setCases(results); setLoading(false); setLastSync(Date.now())
  }, [projectId])
  useEffect(() => {
    setLoading(true); setCases([]); good.current = {}; refresh()
    timer.current = setInterval(refresh, intervalMs)
    return () => clearInterval(timer.current)
  }, [refresh, intervalMs])
  return { cases, loading, lastSync, refresh }
}
