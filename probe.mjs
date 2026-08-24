import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
const client = createClient({ chain: testnetBradbury });
const addrs = ["0x235F51b11b9F96d6673df37553Ef58373c4324F9", "0x72f6BE503a8319A40515641536C1d74378623914", "0x6f33FF874366aEd9B071505Ffa1057072b8FC37C", "0x274bF783F93Ffe330440905BA80321514972A954", "0x9a87961693FF753de5AeBcfD72D861BD21C9d0A4", "0x29deC22b8AFcD114B1831A7Dc9F1FB872dc8E223"];
for (const a of addrs) { try { const s = await client.readContract({ address: a, functionName: "get_state", args: [] }); console.log("ALIVE", a, JSON.stringify(s).slice(0, 120)); } catch (e) { console.log("DEAD ", a, String(e && e.message ? e.message : e).slice(0, 80)); } }
