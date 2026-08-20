import { ProjectDef } from "./types"
export const PROJECTS: ProjectDef[] = [
  {
    id: "moderator",
    name: "Content Moderator",
    tagline: "Self-calibrating AI moderation",
    icon: "ShieldCheck",
    accent: "#b6ff6c",
    repo: "https://github.com/Artem1981777/genlayer-content-moderator",
    demo: "https://artem1981777.github.io/genlayer-content-moderator/",
    decisionField: "verdict",
    decisions: [
      { value: "APPROVE", label: "Approve", tone: "ok" },
      { value: "FLAG", label: "Flag", tone: "warn" },
      { value: "REMOVE", label: "Remove", tone: "bad" },
    ],
    seedContracts: [
      "0xbf844361E8d9CD30a11ff4b6Fe7E715413C17fC5",
      "0x237fD615062d9C952659DC357eaA94B8Be1370DC",
    ],
  },
  {
    id: "prediction",
    name: "Prediction Market",
    tagline: "Web-evidenced resolver + disputes",
    icon: "TrendingUp",
    accent: "#8ee63a",
    repo: "https://github.com/Artem1981777/genlayer-prediction-market",
    demo: "https://artem1981777.github.io/genlayer-prediction-market/",
    decisionField: "outcome",
    decisions: [
      { value: "YES", label: "Yes", tone: "ok" },
      { value: "NO", label: "No", tone: "bad" },
      { value: "UNRESOLVED", label: "Unresolved", tone: "muted" },
    ],
    seedContracts: [
      "0x5853abFE0CBF83ac65cd3DACFB35Bb1B0314C969",
      "0xd2Ead3C6BbaCe1D423F156762f33A2C9B406C73f",
    ],
  },
]
export const getProject = (id: string) => PROJECTS.find((p) => p.id === id) || PROJECTS[0]
