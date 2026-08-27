import { readFileSync, writeFileSync } from "node:fs";
const p = "src/components/actions-panel.tsx";
let s = readFileSync(p, "utf8");
const before = s;
s = s.replace(
  'import { sendWrite, makeWriteClient } from "@/lib/genlayer"',
  'import { sendWrite, makeWriteClient, readState } from "@/lib/genlayer"'
);
s = s.replace(
  '      setOpenFn(null); setForm({})\n      if (onDone) onDone()',
  '      setOpenFn(null); setForm({})\n      setBusy("__sync__")\n      const prevKey = JSON.stringify({ status: (state && state.status) || "", history: (state && state.history) || "" })\n      for (let i = 0; i < 240; i++) {\n        let ns: any = null\n        try { ns = await readState(address) } catch {}\n        if (ns && JSON.stringify({ status: ns.status || "", history: ns.history || "" }) !== prevKey) break\n        await new Promise((r) => setTimeout(r, 4000))\n      }\n      if (onDone) onDone()'
);
s = s.replace(
  '>Actions</div>',
  '>Actions</div>{busy === "__sync__" ? <span className="dim" style={{ fontSize: 11.5 }}>syncing next step, please wait...</span> : null}'
);
if (s === before) { console.log("!!! NO CHANGES"); process.exit(1); }
const need = ['makeWriteClient, readState', 'setBusy("__sync__")', 'await readState(address)', 'syncing next step'];
for (const c of need) { if (!s.includes(c)) { console.log("!!! MISSING:", c); process.exit(1); } }
writeFileSync(p, s);
console.log("PANEL2_PATCHED_OK");
