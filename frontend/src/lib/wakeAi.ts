import { api } from "./api";

/*
| Les services IA gratuits de Render s'endorment après 15 min et mettent ~1 min à repartir.
| On les réveille dès l'ouverture d'un espace, pour qu'ils soient prêts quand on en a besoin.
*/
let woken = false;

export function wakeAiServices(): void {
  if (woken) return;
  woken = true;
  api.post("/ai/wake").catch(() => undefined);
}
