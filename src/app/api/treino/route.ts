// ============================================================
// API do módulo de treino rico (TRAVA 6) — TOOLING (não mexe no reforço).
// Ações: seed (preset), add, rename, variar, remover, serie (com PR).
// O registro que dá XP/Força continua sendo POST /api/log {comportamento:'treino'}.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRESETS, variarExercicio, type Preset } from "@/lib/treino";

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
      const hoje = new Date().toISOString().slice(0, 10);
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
