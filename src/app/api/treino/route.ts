// ============================================================
// API do módulo de treino rico (TRAVA 6) — TOOLING (não mexe no reforço).
// Ações: seed (preset), add, rename, variar, remover, serie (com PR).
// O registro que dá XP/Força continua sendo POST /api/log {comportamento:'treino'}.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRESETS, variarExercicio, type Preset } from "@/lib/treino";
import {
  hojeISO,
  aplicarMasteryPorSerie,
  concederHoloPorPr,
  aplicarDanoBoss,
} from "@/lib/data";
import { distribuicaoDoExercicio, type GrupoMuscular } from "@/lib/engine/mastery";
import type { PersonagemSlug } from "@/lib/photocards";

// v12 PR3: dano ao boss semanal pelo tipo de evento. Bate 1:1 com o cap
// que calcularBossProgresso aplica em cada meta (séries × 1, TKD × 3,
// dança × 5), então bossProgressoDaSemana vira reconciliação silenciosa —
// aqui a recompensa vem no mesmo POST que gerou o evento.
const DANO_POR_SERIE = 1;
// Bônus adicional ao fechar o split inteiro (independente das séries).
const DANO_FECHAR_SESSAO = 3;
const XP_FECHAR_SESSAO = 30;
const SHARDS_FECHAR_SESSAO = 1;

// v12.7: rotas de HOLO por grupo — foco atualizado.
//   chest    → min       (novo dominio 'peito')
//   shoulders→ sanha     (novo dominio 'ombros')
//   demais permanecem: back/biceps/triceps continuam com Hujin (upper),
//   lower com Sanhee (lower), core com Ryuki (abs), taekwondo com
//   Chan-ho, danca com Ji-seok.
const PERSONAGEM_POR_GRUPO: Partial<Record<GrupoMuscular, PersonagemSlug>> = {
  chest: "min",
  back: "hujin-kim",
  shoulders: "sanha",
  biceps: "hujin-kim",
  triceps: "hujin-kim",
  lower: "sanhee-park",
  core: "ryuki-han",
  taekwondo: "chan-ho-lee",
  danca: "ji-seok-moon",
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  switch (action) {
    case "seed": {
      const preset = String(body.preset) as Preset;
      const cfg = PRESETS[preset];
      if (!cfg) return NextResponse.json({ error: "preset inválido" }, { status: 400 });
      await supabase.from("treino_exercicios").delete().eq("user_id", user.id);
      const linhas = cfg.itens.map((it, i) => ({
        user_id: user.id,
        nome: it.nome,
        grupo_muscular: it.grupo,
        split: it.split,
        ordem: i,
        custom: false,
      }));
      const { error } = await supabase.from("treino_exercicios").insert(linhas);
      if (error) return NextResponse.json({ error: "falha seed" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // v11: sincroniza o /treino com o /plano — apaga tudo e insere só os
    // exercícios do programa (split keys prog_*). Preserva o custom=true.
    case "sync_programa": {
      const { exerciciosDoPrograma } = await import("@/lib/programa");
      // Preserva os exercícios custom (adicionados via "Registrar avulso")
      const { data: customs } = await supabase
        .from("treino_exercicios")
        .select("nome, grupo_muscular, split, ordem")
        .eq("user_id", user.id)
        .eq("custom", true);
      // Apaga tudo
      await supabase.from("treino_exercicios").delete().eq("user_id", user.id);
      // Insere programa
      const progLinhas = exerciciosDoPrograma().map((ex) => ({
        user_id: user.id,
        nome: ex.nome,
        grupo_muscular: ex.grupo,
        split: ex.split,
        ordem: ex.ordem,
        custom: false,
      }));
      const customLinhas = (customs ?? []).map((c) => ({
        user_id: user.id,
        nome: c.nome as string,
        grupo_muscular: c.grupo_muscular as string | null,
        split: c.split as string | null,
        ordem: (c.ordem as number) ?? 999,
        custom: true,
      }));
      const { error } = await supabase
        .from("treino_exercicios")
        .insert([...progLinhas, ...customLinhas]);
      if (error) {
        return NextResponse.json({ error: "falha sync" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, count: progLinhas.length });
    }

    // v10.3: adiciona um preset ao plano existente (sem apagar). Útil pra
    // encaixar Core + Cardio junto do split semanal.
    case "merge_preset": {
      const preset = String(body.preset) as Preset;
      const cfg = PRESETS[preset];
      if (!cfg) return NextResponse.json({ error: "preset inválido" }, { status: 400 });
      // Se o split desse preset já existe (algum exercicio com esse split),
      // não duplica.
      const splitKey = cfg.itens[0]?.split ?? "";
      if (splitKey) {
        const { data: jaExiste } = await supabase
          .from("treino_exercicios")
          .select("id")
          .eq("user_id", user.id)
          .eq("split", splitKey)
          .limit(1);
        if (jaExiste && jaExiste.length > 0) {
          return NextResponse.json({ ok: true, ja_existia: true });
        }
      }
      const linhas = cfg.itens.map((it, i) => ({
        user_id: user.id,
        nome: it.nome,
        grupo_muscular: it.grupo,
        split: it.split,
        ordem: 900 + i,
        custom: false,
      }));
      const { error } = await supabase.from("treino_exercicios").insert(linhas);
      if (error) return NextResponse.json({ error: "falha merge" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case "add": {
      const nome = String(body.nome ?? "").trim();
      const grupo = String(body.grupo ?? "").trim() || null;
      const split = String(body.split ?? "").trim() || null;
      if (!nome) return NextResponse.json({ error: "nome vazio" }, { status: 400 });
      const { error } = await supabase.from("treino_exercicios").insert({
        user_id: user.id,
        nome,
        grupo_muscular: grupo,
        split,
        ordem: 999,
        custom: true,
      });
      if (error) return NextResponse.json({ error: "falha add" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case "rename": {
      const id = String(body.id ?? "");
      const nome = String(body.nome ?? "").trim();
      if (!id || !nome) return NextResponse.json({ error: "dados" }, { status: 400 });
      await supabase
        .from("treino_exercicios")
        .update({ nome })
        .eq("id", id)
        .eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    }

    case "variar": {
      const id = String(body.id ?? "");
      const { data: ex } = await supabase
        .from("treino_exercicios")
        .select("nome, grupo_muscular")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!ex) return NextResponse.json({ error: "não achado" }, { status: 404 });
      const novo = variarExercicio(
        (ex.grupo_muscular as string) ?? "",
        ex.nome as string,
      );
      await supabase
        .from("treino_exercicios")
        .update({ nome: novo })
        .eq("id", id)
        .eq("user_id", user.id);
      return NextResponse.json({ ok: true, nome: novo });
    }

    case "remover": {
      const id = String(body.id ?? "");
      await supabase
        .from("treino_exercicios")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    }

    case "serie": {
      const nome = String(body.nome ?? "").trim();
      const peso = body.peso != null ? Number(body.peso) : null;
      const reps = body.reps != null ? Number(body.reps) : null;
      const exercicioId = body.exercicio_id ? String(body.exercicio_id) : null;
      if (!nome) return NextResponse.json({ error: "nome vazio" }, { status: 400 });

      // Top set: maior peso anterior para o mesmo exercício.
      // is_pr = igualou OU superou o recorde (>=) → estrela + som.
      // recorde = superou de fato (>) → muda o flavor pra "PR!".
      let isPr = false;
      let recorde = false;
      if (peso != null) {
        const { data: prev } = await supabase
          .from("treino_series")
          .select("peso")
          .eq("user_id", user.id)
          .eq("nome", nome)
          .not("peso", "is", null)
          .order("peso", { ascending: false })
          .limit(1)
          .maybeSingle();
        const melhor = prev?.peso != null ? Number(prev.peso) : -Infinity;
        isPr = peso >= melhor;
        recorde = peso > melhor;
      }

      const { error } = await supabase.from("treino_series").insert({
        user_id: user.id,
        exercicio_id: exercicioId,
        nome,
        peso,
        reps,
        is_pr: isPr,
      });
      if (error) return NextResponse.json({ error: "falha série" }, { status: 500 });

      // v12: fan-out RPG — Muscle Mastery + 5 eixos de atributo. Silencioso
      // se der erro (não queremos que uma falha aqui derrube o registro).
      let masteryGrupos: { grupo: GrupoMuscular; xp: number }[] = [];
      try {
        const r = await aplicarMasteryPorSerie(user.id, nome, peso, reps);
        masteryGrupos = r.mastery;
      } catch {
        /* mastery é tooling — não falha o registro */
      }

      // v12: PR real de musculação → HOLO photocard do "personagem responsável"
      // pelo grupo principal da série. Mapeamento estático abaixo.
      let photocardId: string | null = null;
      if (recorde) {
        try {
          const distrib = distribuicaoDoExercicio(nome);
          if (distrib) {
            const grupoPrincipal = Object.entries(distrib).sort(
              (a, b) => (b[1] as number) - (a[1] as number),
            )[0]?.[0] as GrupoMuscular | undefined;
            if (grupoPrincipal) {
              const personagem = PERSONAGEM_POR_GRUPO[grupoPrincipal];
              if (personagem) {
                const drop = await concederHoloPorPr(user.id, personagem);
                photocardId = drop.photocardId;
              }
            }
          }
        } catch {
          /* drop cosmético — não pode falhar o POST */
        }
      }

      // v12 PR3: cada série real desce 1 no HP do boss semanal. Idempotente
      // pra recompensa (aplicarDanoBoss só credita XP/shards/drop uma vez).
      let bossRecompensa: {
        derrotou: boolean;
        xp?: number;
        shards?: number;
        photocardId?: string | null;
      } = { derrotou: false };
      try {
        const r = await aplicarDanoBoss(user.id, DANO_POR_SERIE);
        bossRecompensa = {
          derrotou: r.derrotou,
          xp: r.recompensa?.xp,
          shards: r.recompensa?.shards,
          photocardId: r.recompensa?.photocardId ?? null,
        };
      } catch {
        /* boss é tooling; não pode quebrar o registro de série */
      }

      return NextResponse.json({
        ok: true,
        is_pr: isPr,
        recorde,
        mastery: masteryGrupos,
        photocardId,
        boss: bossRecompensa,
      });
    }

    case "remover_serie": {
      const id = String(body.id ?? "");
      await supabase
        .from("treino_series")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    }

    case "fechar_sessao": {
      // Marca a sessão do dia (split) como finalizada. O reforço (log de treino
      // → Força + hit-confirm) é disparado pelo cliente via /api/log à parte.
      const split = String(body.split ?? "").trim();
      if (!split) return NextResponse.json({ error: "split" }, { status: 400 });
      const hoje = hojeISO();

      // v12 PR3: recompensa idempotente por (user, data, split). Só credita
      // XP/shards/dano de boss se treino_sessoes.xp_creditado ainda for false.
      const { data: sessaoAtual } = await supabase
        .from("treino_sessoes")
        .select("xp_creditado")
        .eq("user_id", user.id)
        .eq("data", hoje)
        .eq("split", split)
        .maybeSingle();
      const jaCreditou = Boolean(sessaoAtual?.xp_creditado);

      await supabase.from("treino_sessoes").upsert({
        user_id: user.id,
        data: hoje,
        split,
        finalizada: true,
        xp_creditado: true,
        atualizado_em: new Date().toISOString(),
      });

      let bonus: {
        creditou: boolean;
        xp: number;
        shards: number;
        boss: { derrotou: boolean; photocardId?: string | null };
      } = {
        creditou: false,
        xp: 0,
        shards: 0,
        boss: { derrotou: false },
      };
      if (!jaCreditou) {
        try {
          const { data: attr } = await supabase
            .from("atributos")
            .select("xp, shards")
            .eq("user_id", user.id)
            .maybeSingle();
          await supabase
            .from("atributos")
            .update({
              xp: ((attr?.xp as number) ?? 0) + XP_FECHAR_SESSAO,
              shards: ((attr?.shards as number) ?? 0) + SHARDS_FECHAR_SESSAO,
            })
            .eq("user_id", user.id);
          const rBoss = await aplicarDanoBoss(user.id, DANO_FECHAR_SESSAO);
          bonus = {
            creditou: true,
            xp: XP_FECHAR_SESSAO,
            shards: SHARDS_FECHAR_SESSAO,
            boss: {
              derrotou: rBoss.derrotou,
              photocardId: rBoss.recompensa?.photocardId ?? null,
            },
          };
        } catch {
          /* bonus é cosmético — não pode falhar o fechar_sessao */
        }
      }

      return NextResponse.json({ ok: true, bonus });
    }

    default:
      return NextResponse.json({ error: "ação inválida" }, { status: 400 });
  }
}
