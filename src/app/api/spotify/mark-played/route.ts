// ============================================================
// Marca o resultado do reforço de áudio no histórico.  (nova-no-sistema)
// ------------------------------------------------------------
// O cliente chama isto APÓS tentar tocar a faixa cheia:
//   * sucesso → tipo_reforco 'faixa_cheia' (faixa deixa de ser nova-no-sistema);
//   * falha   → tipo_reforco 'fallback_local' (faixa NÃO é marcada como tocada;
//     entra na fila "a tocar" via flag `enfileirar`).
// O hit-confirm local já ocorreu no cliente; aqui só registramos o histórico.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TipoReforco } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    logId?: string;
    faixaId?: string;
    tipo?: TipoReforco;
  };
  const tipo: TipoReforco =
    body.tipo === "faixa_cheia" ? "faixa_cheia" : "fallback_local";

  // No fallback NÃO gravamos faixa_id como tocada — assim a faixa continua
  // "nova-no-sistema" e pode tocar quando o Spotify voltar.
  const faixaId = tipo === "faixa_cheia" ? (body.faixaId ?? null) : null;

  const { error } = await supabase.from("historico_reforco").insert({
    user_id: user.id,
    log_id: body.logId ?? null,
    faixa_id: faixaId,
    tipo_reforco: tipo,
  });
  if (error) {
    return NextResponse.json({ error: "falha ao marcar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
