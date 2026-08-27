import { readFileSync, writeFileSync } from "node:fs";
const p = "src/components/actions-panel.tsx";
let s = readFileSync(p, "utf8");
const before = s;
s = s.replace(
  'import { ACTIONS, canDo, whyNot, type ActionDef } from "@/lib/actions"',
  'import { ACTIONS, canDo, phaseOk, whyNot, type ActionDef } from "@/lib/actions"'
);
s = s.replace(
  "  const actions = allActions.filter((a) => canDo(a, state, acct))",
  "  const actions = allActions.filter((a) => phaseOk(a, state))"
);
s = s.replace(
  "disabled={busy !== null} onClick={() => click(a)}>",
  'disabled={busy !== null || !canDo(a, state, acct)} title={canDo(a, state, acct) ? "" : whyNot(a, state, acct)} onClick={() => click(a)}>'
);
if (s === before) { console.log("!!! NO CHANGES - strings not found"); process.exit(1); }
const need = ["phaseOk, whyNot", "filter((a) => phaseOk(a, state))", "!canDo(a, state, acct)}", "title={canDo(a, state, acct)"];
for (const c of need) { if (!s.includes(c)) { console.log("!!! MISSING:", c); process.exit(1); } }
writeFileSync(p, s);
console.log("PANEL_PATCHED_OK");
