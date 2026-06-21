// ============================================================
// LOOP CENTRAL DA DIETA — registro 1 toque → reforço. (coração do V1)
// ------------------------------------------------------------
// O hit-confirm sensorial LOCAL já tocou no cliente ANTES desta chamada
// (atraso zero, sem rede). Aqui o servidor:
//   1. grava o log (timestamp automático);
//   2. calcula o ganho = base protegida + bônus aditivo do personagem do dia;
//   3. aplica ao placar/elo (progressão única do usuário);
//   4. reavalia o fading (latência + variabilidade, reversível);
//   5. decide se ESTE registro dispara música nova-no-sistema.
// A música é BÔNUS por cima: se faltar, o reforço local já aconteceu.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DecisaoReforco, TipoLogDieta } from "@/lib/types";
import { calcularGanho, eloDeXp } from "@/lib/engine/reinforcement";
import { decidirFading, deveTocarMusica } from "@/lib/engine/fading";
import { sinalEstabilidade } from "@/lib/engine/latency";
import { proximaFaixaNova } from "@/lib/spotify/new-in-system";
import {
  garantirAtributos,
  garantirSchedule,
  personagemDoDia,
  registrosDesdeUltimaMusica,
  ultimasLatencias,
} from "@/lib/data";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    tipo?: TipoLogDieta;
  };
  const tipo: TipoLogDieta = body.tipo === "hidratacao" ? "hidratacao" : "refeicao";

  // 1. Grava o log (timestamp automático no banco).
  const { data: log, error: logErr } = await supabase
    .from("logs_dieta")
    .insert({ user_id: user.id, tipo })
    .select("id, ts")
    .single();
  if (logErr || !log) {
    return NextResponse.json({ error: "falha ao registrar" }, { status: 500 });
  }

  // 2. Ganho = base protegida (sempre) + bônus aditivo do personagem do dia.
  const personagem = await personagemDoDia(user.id);
  const ganho = calcularGanho("dieta", personagem);

  // 3. Aplica à progressão ÚNICA do usuário.
  const attr = await garantirAtributos(user.id);
  const novoXp = (attr?.xp ?? 0) + ganho.total;
  const novaStamina = (attr?.stamina ?? 0) + ganho.total;
  await supabase
    .from("atributos")
    .update({
      xp: novoXp,
      stamina: novaStamina,
      elo: eloDeXp(novoXp),
      atualizado_em: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  // 4. Reavalia o fading (desempenho, nunca calendário).
  const schedule = await garantirSchedule(user.id, "dieta");
  const latencias = await ultimasLatencias(user.id);
  const sinal = sinalEstabilidade(latencias);
  const decisao = decidirFading(schedule, sinal, {
    user_id: user.id,
    comportamento: "dieta",
  });
  if (decisao.direcao !== "manter") {
    await supabase
      .from("schedule_state")
      .update({
        esquema_atual: decisao.esquemaNovo,
        nivel_afinamento: decisao.nivelNovo,
        ultima_transicao: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("comportamento", "dieta");
  }
  const esquemaVigente = decisao.esquemaNovo;

  // 5. Este registro dispara música? (CRF = sempre; FRn = a cada n)
  let musica = null;
  const desdeUltima = await registrosDesdeUltimaMusica(user.id);
  if (deveTocarMusica(esquemaVigente, desdeUltima)) {
    musica = await proximaFaixaNova(user.id); // null se Spotify fora → fallback
  }

  const resposta: DecisaoReforco = {
    hitConfirm: true,
    ganho,
    musica,
    esquema: esquemaVigente,
  };
  return NextResponse.json({ ...resposta, logId: log.id });
}
