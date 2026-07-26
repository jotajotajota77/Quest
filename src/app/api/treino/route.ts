// ============================================================
// API do módulo de treino rico (TRAVA 6) — TOOLING (não mexe no reforço).
// Ações: seed (preset), add, rename, variar, remover, serie (com PR).
// O registro que dá XP/Força continua sendo POST /api/log {comportamento:'treino'}.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRESETS, variarExercicio, type Preset } from "@/lib/treino";
import { hojeISO } from "@/lib/data";

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
      return NextResponse.json({ ok: true, is_pr: isPr, recorde });
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
      await supabase.from("treino_sessoes").upsert({
        user_id: user.id,
        data: hoje,
        split,
        finalizada: true,
        atualizado_em: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "ação inválida" }, { status: 400 });
  }
}
