export function StatusDot({ tone = "ok" }: { tone?: "ok" | "warn" | "bad" }) {
  return <span className={"dot" + (tone === "ok" ? "" : " " + tone)} />
}
