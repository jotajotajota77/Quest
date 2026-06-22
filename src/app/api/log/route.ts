// ============================================================
// LOOP CENTRAL — registro 1 toque → reforço ASSIMÉTRICO. (TRAVA 2)
// ------------------------------------------------------------
// Camada universal (TODOS): log + ganho (base + bônus) + atributo/XP/Elo.
// Motor de instalação (SÓ Nutri): Spotify-CRF + fading + porteiro.
// Dança: Spotify como TRILHA (toca sempre, não esmaece).
// Treino/Leitura: só camada universal.
// O hit-confirm sensorial LOCAL já tocou no cliente antes desta chamada.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Comportamento, DecisaoReforco, ModoAudio } from "@/lib/types";
import { atributoDe, familiaDe, FAMILIAS } from "@/lib/comportamentos";
import { calcularGanho, eloDeXp } from "@/lib/engine/reinforcement";
import { tierDeXp } from "@/lib/engine/tier";
import { decidirFading, deveTocarMusica } from "@/lib/engine/fading";
import { sinalEstabilidade } from "@/lib/engine/latency";
import { porteiroPermiteAfinar } from "@/lib/engine/gates";
import { proximaFaixaNova } from "@/lib/spotify/new-in-system";
import {
  garantirAtributos,
  garantirSchedule,
  personagemDoDia,
  registrosHoje,
  registrosNutriDesdeUltimaMusica,
  sinalRobustez,
  ultimaAtividadeAntesDeHoje,
  ultimasLatenciasNutri,
} from "@/lib/data";

const COMPORTAMENTOS_VALIDOS: Comportamento[] = [
  "treino",
  "nutri_refeicao",
  "nutri_agua",
  "leitura",
  "danca",
];

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    comportamento?: Comportamento;
    food_id?: string;
    kcal?: number;
    proteina?: number;
    carbs?: number;
    gordura?: number;
    livro?: string;
    paginas?: number;
    minutos?: number;
  };
  const comportamento = body.comportamento;
  if (!comportamento || !COMPORTAMENTOS_VALIDOS.includes(comportamento)) {
    return NextResponse.json({ error: "comportamento inválido" }, { status: 400 });
  }
  const familia = familiaDe(comportamento);
  const cfg = FAMILIAS[familia];

  // 0. Jackpot de comeback (VR extra) — detectado ANTES de inserir o log:
  //    é o 1º registro de hoje E houve ausência natural (>= 3 dias). Dispara
  //    uma vez por retorno (os próximos logs do dia já não são o 1º). Sem
  //    storage: derivado dos próprios logs. Combina com a voz de retorno.
  const primeiroDeHoje = (await registrosHoje(user.id)) === 0;
  let jackpot: DecisaoReforco["jackpot"] = null;
  if (primeiroDeHoje) {
    const ultima = await ultimaAtividadeAntesDeHoje(user.id);
    if (ultima) {
      const gap = Math.round(
        (Date.now() - new Date(`${ultima}T00:00:00Z`).getTime()) / 86_400_000,
      );
      if (gap >= 3) {
        jackpot = { xp: 50 + 10 * Math.min(gap, 7), rotulo: "Jackpot de retorno!" };
      }
    }
  }

  // 1. Grava o log (timestamp automático no banco).
  // Macros OPCIONAIS (vindas do seletor de alimentos). O 1-toque ignora isto.
  const macros =
    cfg.motorInstalacao && body.kcal != null
      ? {
          food_id: body.food_id ?? null,
          kcal: body.kcal ?? null,
          proteina: body.proteina ?? null,
          carbs: body.carbs ?? null,
          gordura: body.gordura ?? null,
        }
      : {};
  // Detalhes de leitura (livro / páginas / tempo) — opcionais, só p/ leitura.
  const detalhesLeitura =
    comportamento === "leitura"
      ? {
          livro: body.livro?.trim() ? body.livro.trim() : null,
          paginas: body.paginas != null ? Math.round(body.paginas) : null,
          minutos: body.minutos != null ? Math.round(body.minutos) : null,
        }
      : {};
  const { data: log, error: logErr } = await supabase
    .from("logs")
    .insert({ user_id: user.id, comportamento, ...macros, ...detalhesLeitura })
    .select("id, ts")
    .single();
  if (logErr || !log) {
    return NextResponse.json({ error: "falha ao registrar" }, { status: 500 });
  }

  // 2. Ganho = base protegida (sempre) + bônus aditivo do protagonista do dia.
  const personagem = await personagemDoDia(user.id);
  const ganho = calcularGanho(comportamento, personagem);
  const atributo = atributoDe(comportamento);

  // 3. Aplica à progressão ÚNICA do jogador (atributo + XP → Elo).
  const attr = await garantirAtributos(user.id);
  const novoXp = attr.xp + ganho.total + (jackpot?.xp ?? 0);
  const tier = tierDeXp(novoXp);
  await supabase
    .from("atributos")
    .update({
      [atributo]: (attr[atributo] as number) + ganho.total,
      xp: novoXp,
      elo: eloDeXp(novoXp), // legado; o ladder de tier é a leitura concreta
      tier_base: tier.base.sigla,
      tier_divisao: tier.rank % 4, // 0..3 (IV..I)
      atualizado_em: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  // 4. Reforço de áudio — ASSIMÉTRICO por família.
  let esquema: DecisaoReforco["esquema"] = null;
  let musica: DecisaoReforco["musica"] = null;
  let modoAudio: ModoAudio | null = null;

  if (cfg.motorInstalacao) {
    // ── NUTRI: motor de instalação completo (fading + porteiro). ──
    const schedule = await garantirSchedule(user.id, "nutri");
    const latencias = await ultimasLatenciasNutri(user.id);
    const sinal = sinalEstabilidade(latencias);
    const robustez = await sinalRobustez(user.id);
    const decisao = decidirFading(schedule, sinal, porteiroPermiteAfinar(robustez));
    if (decisao.direcao !== "manter") {
      await supabase
        .from("schedule_state")
        .update({
          esquema_atual: decisao.esquemaNovo,
          nivel_afinamento: decisao.nivelNovo,
          ultima_transicao: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("comportamento", "nutri");
    }
    esquema = decisao.esquemaNovo;

    const desdeUltima = await registrosNutriDesdeUltimaMusica(user.id);
    if (deveTocarMusica(esquema, desdeUltima)) {
      musica = await proximaFaixaNova(user.id); // null → fallback local
      modoAudio = "reward";
    }
  } else if (cfg.spotify === "soundtrack") {
    // ── DANÇA: Spotify como TRILHA da atividade — toca sempre, não esmaece,
    //    não passa pelo fading nem entra no histórico de reforço esmaecível. ──
    musica = await proximaFaixaNova(user.id);
    modoAudio = musica ? "trilha" : null;
  }
  // TREINO / LEITURA: só camada universal — sem música como mecânica.

  const resposta: DecisaoReforco = {
    hitConfirm: true,
    ganho,
    atributo,
    esquema,
    musica,
    modoAudio,
    jackpot,
    logId: log.id,
  };
  return NextResponse.json(resposta);
}

// Apagar um registro (ex.: card de refeição). Não estorna XP — é placar, não
// contabilidade; manter simples e sem fricção.
export async function DELETE(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id faltando" }, { status: 400 });
  await supabase.from("logs").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
