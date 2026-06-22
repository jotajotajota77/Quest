// ============================================================
// Análise de treino por IA (Claude API) — FORA DO LOOP CRÍTICO. (TRAVA 6)
// ------------------------------------------------------------
// Utilidade, não reforço. Degrada suave: sem ANTHROPIC_API_KEY (ou se a
// chamada falhar), devolve { disponivel:false } e a UI mostra "sem análise
// nesta sessão". NUNCA bloqueia o registro/treino.
//
// Ponto de plugar a key: variável de ambiente ANTHROPIC_API_KEY na Vercel.
// ============================================================
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { seriesRecentes } from "@/lib/data";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  // Degradação suave: sem key, não há análise — e tudo bem.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      disponivel: false,
      msg: "Sem análise nesta sessão (configure ANTHROPIC_API_KEY).",
    });
  }

  const series = await seriesRecentes(user.id, 80);
  if (series.length === 0) {
    return NextResponse.json({
      disponivel: false,
      msg: "Registre algumas séries primeiro para a IA analisar.",
    });
  }

  // Resumo compacto por exercício (última vs. anterior + PR), enviado à IA.
  const porNome = new Map<string, typeof series>();
  for (const s of series) {
    const arr = porNome.get(s.nome) ?? [];
    arr.push(s);
    porNome.set(s.nome, arr);
  }
  const resumo = [...porNome.entries()]
    .map(([nome, ss]) => {
      const linhas = ss
        .slice(0, 6)
        .map((s) => `${s.peso ?? "?"}kg x ${s.reps ?? "?"}${s.is_pr ? " (PR)" : ""}`)
        .join("; ");
      return `- ${nome}: ${linhas}`;
    })
    .join("\n");

  try {
    const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 900,
      system:
        "Você é um treinador de força conciso e prático. Analise execução, " +
        "progressão e dê 2–4 sugestões acionáveis em português do Brasil. " +
        "Seja direto, sem floreio, sem disclaimers médicos longos. Use bullets curtos.",
      messages: [
        {
          role: "user",
          content:
            "Minhas séries recentes (peso x reps, mais recentes primeiro):\n" +
            resumo +
            "\n\nAvalie progressão por exercício e sugira ajustes de carga/volume/variação.",
        },
      ],
    });

    const texto = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ disponivel: true, analise: texto });
  } catch {
    // Fora do loop crítico: falha de IA não pesa em nada.
    return NextResponse.json({
      disponivel: false,
      msg: "Sem análise nesta sessão (a IA não respondeu).",
    });
  }
}
