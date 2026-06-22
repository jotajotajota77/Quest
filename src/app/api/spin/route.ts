// Daily Spin — reforço de RAZÃO VARIÁVEL autocontido, 1×/dia.
// Não depende de evento externo (≠ jackpot de comeback). Entrega leve:
// bônus de XP, cosmético ou boon do dia. Idempotente por dia.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tierDeXp } from "@/lib/engine/tier";
import { garantirAtributos, hojeISO, spinDeHoje } from "@/lib/data";

type Recompensa =
  | { tipo: "xp"; valor: number; rotulo: string }
  | { tipo: "boon"; rotulo: string }
  | { tipo: "cosmetico"; rotulo: string };

// Tabela de razão variável: pesos diferentes, surpresa autêntica.
const TABELA: { peso: number; gerar: () => Recompensa }[] = [
  { peso: 30, gerar: () => ({ tipo: "xp", valor: 15, rotulo: "+15 XP" }) },
  { peso: 18, gerar: () => ({ tipo: "xp", valor: 35, rotulo: "+35 XP" }) },
  { peso: 7, gerar: () => ({ tipo: "xp", valor: 75, rotulo: "+75 XP (raro!)" }) },
  { peso: 20, gerar: () => ({ tipo: "boon", rotulo: "Boon: foco afiado hoje" }) },
  { peso: 15, gerar: () => ({ tipo: "boon", rotulo: "Boon: respiração calma" }) },
  { peso: 10, gerar: () => ({ tipo: "cosmetico", rotulo: "Cosmético: brilho neon" }) },
];

function sortear(): Recompensa {
  const total = TABELA.reduce((a, b) => a + b.peso, 0);
  let x = Math.random() * total;
  for (const item of TABELA) {
    if (x < item.peso) return item.gerar();
    x -= item.peso;
  }
  return TABELA[0].gerar();
}

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  // 1×/dia: se já girou, devolve o mesmo (idempotente).
  const existente = await spinDeHoje(user.id);
  if (existente) {
    return NextResponse.json({ recompensa: existente, jaGirou: true });
  }

  const recompensa = sortear();
  await supabase.from("daily_spin").insert({
    user_id: user.id,
    data: hojeISO(),
    recompensa,
  });

  // XP entra na progressão única.
  if (recompensa.tipo === "xp") {
    const attr = await garantirAtributos(user.id);
    const novoXp = attr.xp + recompensa.valor;
    const tier = tierDeXp(novoXp);
    await supabase
      .from("atributos")
      .update({
        xp: novoXp,
        tier_base: tier.base.sigla,
        tier_divisao: tier.rank % 4,
        atualizado_em: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ recompensa, jaGirou: false });
}
