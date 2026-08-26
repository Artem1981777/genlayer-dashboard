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
      "0x235F51b11b9F96d6673df37553Ef58373c4324F9",
      "0x16C0747A98dCa576Fd1A495DD5FA2be0E1333192",
      "0x30Bb0bc6dA84d377C339949DDfF2d87539F77EB7",
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
      "0xd5fbdf280d1726079d3741B4E18BaD656851A34d",
      "0x86d36795b66c29A7445945585a4C9f09C289C8ba",
      "0x5853abFE0CBF83ac65cd3DACFB35Bb1B0314C969",
      
    ],
  },
  {
    id: "oracle", kind: "oracle",
    name: "Multi-Source Oracle",
    tagline: "Median-consensus price feeds",
    icon: "Radio",
    accent: "#5ad1ff",
    repo: "https://github.com/Artem1981777/genlayer-multi-source-oracle",
    demo: "https://explorer-bradbury.genlayer.com/address/0x9a87961693FF753de5AeBcfD72D861BD21C9d0A4",
    decisionField: "verdict",
    decisions: [],
    seedContracts: ["0x9a87961693FF753de5AeBcfD72D861BD21C9d0A4"],
  },
]
export const getProject = (id: string) => PROJECTS.find((p) => p.id === id) || PROJECTS[0]
