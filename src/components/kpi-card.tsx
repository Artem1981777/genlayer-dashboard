"use client"
import { motion } from "framer-motion"
import { ReactNode } from "react"
export function KpiCard({ label, value, meta, icon }: { label: ReactNode; value: ReactNode; meta?: ReactNode; icon?: ReactNode }) {
  return (
    <motion.div className="card hover kpi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="lbl">{icon}{label}</div>
      <div className="val">{value}</div>
      {meta ? <div className="meta">{meta}</div> : null}
    </motion.div>
  )
}
