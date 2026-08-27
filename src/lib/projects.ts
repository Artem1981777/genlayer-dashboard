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
      "0x2d8257E5C7343f40F7Da5380E0d26b599a6036DE",
      "0x391Cd354F2D74058F5dCAA42D80ECF158A2043Cf",
      "0xc87881c7223e1d47Bf13EBDC50ADFaA0d0EFC4dC",
      "0xF83a360cBA484C09E34018D3FF2f3800d6470DC3",
      "0x0747802565F083d1784ED3f8Ff973Bf0920A61ea",
      "0xD7E2ef74a1ACAAF579E97b2843Cac02EefE15A2c",
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
