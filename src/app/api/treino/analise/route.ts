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
import { perfilDe, seriesRecentes } from "@/lib/data";
import { ENFASE_IA } from "@/lib/objetivos";

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

  const [series, perfil] = await Promise.all([
    seriesRecentes(user.id, 80),
    perfilDe(user.id),
  ]);
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
        "Você é um treinador de força conciso, prático e BASEADO EM DADOS. A " +
        "partir do histórico, diga o que está CERTO e o que está ERRADO pra " +
        "evoluir: sobrecarga progressiva aplicada?, volume por grupo muscular, " +
        "equilíbrio empurrar/puxar, grupos atrasados, tendência de PR, " +
        "frequência, sinais de sub/supertreino e timing de deload. Você NÃO vê " +
        "execução (sem vídeo) — dê cues/erros comuns como genéricos, sem " +
        "prometer análise de forma. Personalize ao PERFIL e às ÊNFASES do aluno. " +
        "Português do Brasil, direto, bullets curtos, sem disclaimers longos.",
      messages: [
        {
          role: "user",
          content:
            (perfil?.trim() ? `Meu perfil: ${perfil.trim()}\n` : "") +
            `Ênfases: ${ENFASE_IA}\n\n` +
            "Minhas séries recentes (peso x reps, mais recentes primeiro):\n" +
            resumo +
            "\n\nAvalie progressão, volume e equilíbrio por grupo; aponte o que " +
            "está certo e errado e sugira ajustes de carga/volume/variação " +
            "alinhados ao perfil e às ênfases.",
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
