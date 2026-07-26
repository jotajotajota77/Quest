// ============================================================
// Aba Taekwondo (v10.2) — o dojang dedicado.
// ------------------------------------------------------------
// Espaço próprio pra treino de TKD: mestre em pose kihap, sparring duo
// (mestre × Sanha), progresso da faixa TKD (kup/dan) e citações de dojang.
// Não substitui o log 1-toque de treino — é a página de identidade e prática.
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
import { candidatosHero } from "@/lib/heroi";
import { dicaDoDia } from "@/lib/dicas";
import { hojeISO } from "@/lib/data";
import { imagemPose } from "@/lib/personagens";
import { faixaAtual } from "@/lib/engine/faixa";
import type { Personagem } from "@/lib/types";

const CITACOES = [
  "Kihap não é grito — é decisão.",
  "A faixa não te promove. Ela reconhece.",
  "Guarda alta, pé leve, cabeça fria.",
  "Cada dobok é uma promessa que o corpo assina.",
  "O sabum ensina — a esteira testa.",
];

function citacaoDoDia(iso: string): string {
  let h = 0;
  for (const c of iso) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CITACOES[h % CITACOES.length];
}

export default async function TaekwondoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [personagem, sanha, progressos] = await Promise.all([
    personagemDoDia(user.id),
    avatarJogador(),
    garantirProgressoDominio(user.id),
  ]);

  const tkd = progressos.find((p) => p.dominio === "taekwondo");
  const faixaTkd = tkd ? faixaAtual(tkd) : null;
  const mestreDoDojang: Personagem | null =
    personagem?.dominio === "taekwondo" ? personagem : null;

  return (
    <main className="app-shell">
      <ContextualHero
        candidatos={candidatosHero("taekwondo", mestreDoDojang ?? personagem, sanha)}
        nome={mestreDoDojang?.nome ?? sanha?.nome ?? "Dojang"}
        titulo={mestreDoDojang?.titulo ?? "Taekwondo — o caminho do pé e da mão"}
        dica={dicaDoDia("home", hojeISO())}
        altura={220}
      />

      <div className="panel" style={{ marginBottom: 16, borderLeft: "3px solid var(--kihap)" }}>
        <h1 className="title-fight" style={{ fontSize: "1.8rem", margin: 0 }}>
          Dojang · 도장
        </h1>
        <p className="subtle" style={{ marginTop: 4 }}>
          Seu espaço de treino de taekwondo. Kihap, sparring, faixa.
        </p>
      </div>

      {/* Progresso da faixa TKD */}
      {faixaTkd && (
        <div className="panel" style={{ marginBottom: 14, borderColor: "var(--kihap)" }}>
          <div className="lbl">Sua faixa TKD · 태권도</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
              {faixaTkd.rotulo}
            </div>
            {!faixaTkd.atingiuMaxima && (
              <div className="subtle" style={{ fontSize: "0.8rem" }}>
                · {faixaTkd.xpNoNivel}/{faixaTkd.xpPraProxima} XP
              </div>
            )}
          </div>
          {!faixaTkd.atingiuMaxima && (
            <div className="xp-bar" style={{ margin: "8px 0 4px" }}>
              <div className="xp-fill" style={{ width: `${faixaTkd.pctPraProxima}%` }} />
            </div>
          )}
          <p className="subtle" style={{ marginTop: 8, fontSize: "0.75rem" }}>
            XP entra quando você treina TKD com um mestre desse domínio no hub.
            Escolha Chan-ho pra somar.
          </p>
        </div>
      )}

      {/* Mestre em kihap */}
      {mestreDoDojang ? (
        <div
          className="panel"
          style={{ marginBottom: 14, display: "grid", gap: 10, borderLeft: "3px solid var(--kihap)" }}
        >
          <div className="lbl">Seu sabum hoje</div>
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
              src={imagemPose(mestreDoDojang.slug, "kihap")}
              nome={mestreDoDojang.nome}
              className="roster-face"
              fallbackSize="4rem"
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>
              {mestreDoDojang.nome}
              {mestreDoDojang.nome_kr && (
                <span className="subtle" style={{ marginLeft: 8, fontSize: "0.75em", fontWeight: 500 }}>
                  {mestreDoDojang.nome_kr}
                </span>
              )}
            </div>
            {mestreDoDojang.titulo && (
              <div className="subtle" style={{ color: "var(--kihap)", fontSize: "0.85rem" }}>
                {mestreDoDojang.titulo}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="panel"
          style={{ marginBottom: 14, borderLeft: "3px solid var(--text-dim)" }}
        >
          <div className="lbl">Sem sabum hoje</div>
          <p className="subtle" style={{ margin: "6px 0 0" }}>
            Nenhum mestre de TKD selecionado no hub hoje. Vá ao{" "}
            <Link href="/hub" style={{ color: "var(--kihap)" }}>
              hub
            </Link>{" "}
            e escolha um mestre com domínio taekwondo pra treinar com ele.
          </p>
        </div>
      )}

      {/* Sparring duo: mestre × Sanha */}
      {mestreDoDojang && sanha && (
        <div
          className="panel"
          style={{ marginBottom: 14, display: "grid", gap: 10, borderLeft: "3px solid var(--kihap)" }}
        >
          <div className="lbl">Sparring · esteira</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, display: "grid", gap: 4 }}>
              <div
                style={{
                  aspectRatio: "3 / 4",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "linear-gradient(160deg, var(--lilac), var(--surface))",
                  border: "1px solid var(--hairline)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CharacterImage
                  src={imagemPose(mestreDoDojang.slug, "sparring")}
                  nome={mestreDoDojang.nome}
                  className="roster-face"
                />
              </div>
              <div
                className="subtle"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.66rem",
                  textAlign: "center",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {mestreDoDojang.nome} · sabum
              </div>
            </div>
            <div
              style={{
                alignSelf: "center",
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem",
                color: "var(--kihap)",
              }}
              aria-hidden
            >
              vs
            </div>
            <div style={{ flex: 1, display: "grid", gap: 4 }}>
              <div
                style={{
                  aspectRatio: "3 / 4",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "linear-gradient(160deg, var(--lilac), var(--surface))",
                  border: "1px solid var(--hairline)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CharacterImage
                  src={imagemPose(sanha.slug, "sparring")}
                  nome={sanha.nome}
                  className="roster-face"
                />
              </div>
              <div
                className="subtle"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.66rem",
                  textAlign: "center",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {sanha.nome} · trainee
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sanha em kihap solo (sempre) */}
      {sanha && (
        <div
          className="panel"
          style={{ marginBottom: 14, display: "grid", gap: 10, borderLeft: "3px solid var(--calm)" }}
        >
          <div className="lbl">Sua stance · 태권도 kihap</div>
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
              src={imagemPose(sanha.slug, "kihap")}
              nome={sanha.nome}
              className="roster-face"
              fallbackSize="4rem"
            />
          </div>
          <p
            className="subtle"
            style={{ margin: 0, fontSize: "0.72rem", fontStyle: "italic", textAlign: "center" }}
          >
            &quot;{citacaoDoDia(hojeISO())}&quot;
          </p>
        </div>
      )}

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="lbl">Rotina do dojang</div>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Aquecimento — corda 3×2min ou trote na esteira.</li>
          <li>Alongamento dinâmico — quadril, ísquios, ombro.</li>
          <li>Poomsae ou drills de chute — controle antes de força.</li>
          <li>Sparring leve — foco em distância e leitura.</li>
          <li>Volta à calma — respiração + alongamento passivo.</li>
        </ul>
      </div>

      <BottomNav />
    </main>
  );
}
