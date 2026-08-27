import { readFileSync, writeFileSync } from "node:fs";
let pg = readFileSync("src/app/page.tsx", "utf8");
if (!pg.includes("create-case")) {
  pg = pg.replace('import { AddContract } from "@/components/add-contract"', 'import { AddContract } from "@/components/add-contract"\nimport { CreateCase } from "@/components/create-case"');
  pg = pg.replace('<div className="flex between center wrap gap"><b>Cases</b><AddContract projectId={projectId} onAdded={refresh} /></div>', '<div className="flex between center wrap gap"><b>Cases</b><div className="flex gap center wrap">{projectId === "moderator" ? <CreateCase onCreated={(a?: string) => { refresh(); if (a) setSelected(a) }} /> : null}<AddContract projectId={projectId} onAdded={refresh} /></div></div>');
  writeFileSync("src/app/page.tsx", pg);
}
let ap = readFileSync("src/components/actions-panel.tsx", "utf8");
if (!ap.includes("actions.some((a) => !canDo")) {
  const anchor = "      {activeDef ? (";
  const block = '      {actions.some((a) => !canDo(a, state, acct)) ? (\n        <div className="dim mt8" style={{ fontSize: 11.5, lineHeight: 1.6 }}>\n          {actions.filter((a) => !canDo(a, state, acct)).map((a) => (\n            <div key={a.fn}>{a.label}: {whyNot(a, state, acct)}{a.role === "creator" && state && state.creator ? " (operator " + String(state.creator).slice(0, 6) + "..." + String(state.creator).slice(-4) + ")" : a.role === "author" && state && state.author ? " (author " + String(state.author).slice(0, 6) + "..." + String(state.author).slice(-4) + ")" : ""}</div>\n          ))}\n        </div>\n      ) : null}\n';
  ap = ap.replace(anchor, block + anchor);
  writeFileSync("src/components/actions-panel.tsx", ap);
}
console.log("PAGE_PANEL_PATCHED_OK");
