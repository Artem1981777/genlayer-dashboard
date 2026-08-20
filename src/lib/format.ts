export const EXPLORER = "https://explorer-bradbury.genlayer.com"
export const short = (a?: string, n = 4) => (a ? a.slice(0, 2 + n) + "…" + a.slice(-n) : "")
export const addrUrl = (a: string) => EXPLORER + "/address/" + a
export const txUrl = (h: string) => EXPLORER + "/tx/" + h
export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
export function parseHistory(s?: string) {
  try { const h = JSON.parse(s || "[]"); return Array.isArray(h) ? h : [] } catch { return [] }
}
