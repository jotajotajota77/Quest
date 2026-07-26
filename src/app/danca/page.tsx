// ============================================================
// Aba Dança (v10.2) — o palco.
// ------------------------------------------------------------
// Espaço dedicado a treino de dança K-pop: mestre em pose de palco, faixa
// dinâmica de dança, coreografia sorteada do dia. Reforça o domínio "danca"
// (que virou cardio de esquiva) como comportamento próprio.
// ============================================================
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  avatarJogador,
  garantirProgressoDominio,
  personagemDoDia,
} from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import CharacterImage from "@/components/CharacterImage";
import ContextualHero from "@/components/ContextualHero";
import CoreoSorteador, { coreografiaDoDia } from "@/components/CoreoSorteador";
import DancaLog, { type DancaLogRow } from "@/components/DancaLog";
import { candidatosHero } from "@/lib/heroi";
import { dicaDoDia } from "@/lib/dicas";
import { hojeISO } from "@/lib/data";
import { imagemPose } from "@/lib/personagens";
import { faixaAtual } from "@/lib/engine/faixa";
import type { Personagem } from "@/lib/types";

export default async function DancaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [personagem, sanha, progressos, { data: historicoRaw }] = await Promise.all([
    personagemDoDia(user.id),
    avatarJogador(),
    garantirProgressoDominio(user.id),
    supabase
      .from("logs_danca")
      .select("id, ts, musica, spotify_url, duracao_min, nota")
      .eq("user_id", user.id)
      .order("ts", { ascending: false })
      .limit(50),
  ]);
  const historico = (historicoRaw ?? []) as DancaLogRow[];

  const danca = progressos.find((p) => p.dominio === "danca");
  const faixaDanca = danca ? faixaAtual(danca) : null;
  const mestreDoPalco: Personagem | null =
    personagem?.dominio === "danca" ? personagem : null;
  const coreo = coreografiaDoDia(hojeISO());

  return (
    <main className="app-shell">
      <ContextualHero
        candidatos={candidatosHero("danca", mestreDoPalco ?? personagem, sanha)}
        nome={mestreDoPalco?.nome ?? sanha?.nome ?? "Palco"}
        titulo={mestreDoPalco?.titulo ?? "K-pop dance — presença antes de força"}
        dica={dicaDoDia("home", hojeISO())}
        altura={220}
      />

      <div className="panel" style={{ marginBottom: 16, borderLeft: "3px solid var(--gold)" }}>
        <h1 className="title-fight" style={{ fontSize: "1.8rem", margin: 0 }}>
          Palco · 무대
        </h1>
        <p className="subtle" style={{ marginTop: 4 }}>
          Dança K-pop é presença + cardio. Uma coreografia sorteada por dia.
        </p>
      </div>

      {/* Coreografia do dia + sortear de novo (v11) */}
      <CoreoSorteador inicial={coreo} />

      {/* Registro + histórico de sessão de dança. */}
      <DancaLog historico={historico} />

      {/* Progresso da faixa dança */}
      {faixaDanca && (
        <div className="panel" style={{ marginBottom: 14, borderColor: "var(--gold)" }}>
          <div className="lbl">Sua faixa Dança · 댄스</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
              {faixaDanca.rotulo}
            </div>
            {!faixaDanca.atingiuMaxima && (
              <div className="subtle" style={{ fontSize: "0.8rem" }}>
                · {faixaDanca.xpNoNivel}/{faixaDanca.xpPraProxima} XP
              </div>
            )}
          </div>
          {!faixaDanca.atingiuMaxima && (
            <div className="xp-bar" style={{ margin: "8px 0 4px" }}>
              <div className="xp-fill" style={{ width: `${faixaDanca.pctPraProxima}%` }} />
            </div>
          )}
          <p className="subtle" style={{ marginTop: 8, fontSize: "0.75rem" }}>
            XP entra quando você treina com um mestre de dança no hub.
          </p>
        </div>
      )}

      {/* Mestre no palco */}
      {mestreDoPalco ? (
        <div
          className="panel"
          style={{ marginBottom: 14, display: "grid", gap: 10, borderLeft: "3px solid var(--gold)" }}
        >
          <div className="lbl">Seu líder de dança hoje</div>
          <div
            style={{
              aspectRatio: "4 / 5",
              maxHeight: 380,
              borderRadius: 10,
              overflow: "hidden",
              background: "linear-gradient(160deg, var(--lilac), var(--surface))",
              border: "1px solid var(--hairline)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CharacterImage
              src={imagemPose(mestreDoPalco.slug, "palco")}
              nome={mestreDoPalco.nome}
              className="roster-face"
              fallbackSize="4rem"
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>
              {mestreDoPalco.nome}
              {mestreDoPalco.nome_kr && (
                <span className="subtle" style={{ marginLeft: 8, fontSize: "0.75em", fontWeight: 500 }}>
                  {mestreDoPalco.nome_kr}
                </span>
              )}
            </div>
            {mestreDoPalco.titulo && (
              <div className="subtle" style={{ color: "var(--gold)", fontSize: "0.85rem" }}>
                {mestreDoPalco.titulo}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="panel"
          style={{ marginBottom: 14, borderLeft: "3px solid var(--text-dim)" }}
        >
          <div className="lbl">Sem líder de dança hoje</div>
          <p className="subtle" style={{ margin: "6px 0 0" }}>
            Nenhum mestre de dança selecionado. Escolha um no{" "}
            <Link href="/hub" style={{ color: "var(--gold)" }}>
              hub
            </Link>{" "}
            pra somar XP em dança.
          </p>
        </div>
      )}

      {/* Sanha em palco/corpo (sempre) */}
      {sanha && (
        <div
          className="panel"
          style={{ marginBottom: 14, display: "grid", gap: 10, borderLeft: "3px solid var(--calm)" }}
        >
          <div className="lbl">Você no palco</div>
          <div
            style={{
              aspectRatio: "4 / 5",
              maxHeight: 320,
              borderRadius: 10,
              overflow: "hidden",
              background: "linear-gradient(160deg, var(--lilac), var(--surface))",
              border: "1px solid var(--hairline)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CharacterImage
              src={imagemPose(sanha.slug, "palco")}
              nome={sanha.nome}
              className="roster-face"
              fallbackSize="4rem"
            />
          </div>
          <p
            className="subtle"
            style={{ margin: 0, fontSize: "0.72rem", fontStyle: "italic", textAlign: "center" }}
          >
            &quot;Dança é conversa entre corpo e música. Escute antes de responder.&quot;
          </p>
        </div>
      )}

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="lbl">Rotina de palco</div>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Aquecimento — cardio leve 3-5min pra soltar quadril e ombro.</li>
          <li>Isolação — pescoço, ombro, quadril separadamente.</li>
          <li>Coreografia — 1× no espelho, 1× na câmera, 1× sem parar.</li>
          <li>Freestyle 2min — improviso solta o corpo do &quot;certo&quot;.</li>
          <li>Alongamento passivo — quadril, panturrilha.</li>
        </ul>
      </div>

      <BottomNav />
    </main>
  );
}
