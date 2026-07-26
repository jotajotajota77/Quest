// ============================================================
// Aba Quests (v10.2) — as sidequests expandidas.
// ------------------------------------------------------------
// Vitrine dedicada de quests do dia + histórico de sidequests concluídas
// (últimos 7 dias). Reforço visual: mestre em pose de vitória (troféu).
// A avaliação é a mesma da home (avaliarQuests) — aqui só respira mais.
// ============================================================
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  avaliarQuests,
  avatarJogador,
  familiasLogadasHoje,
  hojeISO,
  personagemDoDia,
  registrosHoje,
  trackersHoje,
} from "@/lib/data";
import { trackersFeitos } from "@/lib/protocolo";
import BottomNav from "@/components/BottomNav";
import CharacterImage from "@/components/CharacterImage";
import ContextualHero from "@/components/ContextualHero";
import { candidatosHero } from "@/lib/heroi";
import { dicaDoDia } from "@/lib/dicas";
import { imagemPose } from "@/lib/personagens";

export default async function QuestsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [personagem, sanha, nucleo, trackers, nHoje] = await Promise.all([
    personagemDoDia(user.id),
    avatarJogador(),
    familiasLogadasHoje(user.id),
    trackersHoje(user.id),
    registrosHoje(user.id),
  ]);

  const quests = await avaliarQuests(user.id, {
    nucleo,
    trackersFeitos: trackersFeitos(trackers),
    aguaCount: trackers.agua_count,
    registrosHoje: nHoje,
  });

  // Histórico de sidequests concluídas (últimos 7 dias)
  const desde = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const { data: historicoRaw } = await supabase
    .from("quests")
    .select("data, descricao, xp, tipo, estado")
    .eq("user_id", user.id)
    .gte("data", desde)
    .eq("estado", "completa")
    .order("data", { ascending: false });
  const historico = (historicoRaw ?? []) as {
    data: string;
    descricao: string;
    xp: number;
    tipo: string;
    estado: string;
  }[];
  const totalXp7d = historico.reduce((s, h) => s + Number(h.xp ?? 0), 0);

  const diarias = quests.filter((q) => q.tipo === "diaria");
  const sides = quests.filter((q) => q.tipo === "sidequest");
  const feitas = quests.filter((q) => q.completa).length;

  return (
    <main className="app-shell">
      <ContextualHero
        candidatos={candidatosHero("quests", personagem, sanha)}
        nome={personagem?.nome ?? sanha?.nome ?? "Quests"}
        titulo={personagem?.titulo ?? "Missões — reconhecimento do que você já fez"}
        dica={dicaDoDia("home", hojeISO())}
        altura={220}
      />

      <div className="panel" style={{ marginBottom: 16, borderLeft: "3px solid var(--gold)" }}>
        <h1 className="title-fight" style={{ fontSize: "1.8rem", margin: 0 }}>
          Quests
        </h1>
        <p className="subtle" style={{ marginTop: 4 }}>
          {feitas}/{quests.length} do dia · {totalXp7d} XP ganho nos últimos 7 dias
        </p>
      </div>

      {/* Mestre em vitória (só se tem mestre) */}
      {personagem && (
        <div
          className="panel"
          style={{ marginBottom: 14, display: "grid", gap: 10, borderLeft: "3px solid var(--gold)" }}
        >
          <div className="lbl">Reconhecimento</div>
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
              srcs={[
                imagemPose(personagem.slug, "vitoria"),
                imagemPose(personagem.slug, "treino"),
                imagemPose(personagem.slug, "corpo"),
                imagemPose(personagem.slug, "rosto"),
              ]}
              nome={personagem.nome}
              className="roster-face"
              fallbackSize="4rem"
            />
          </div>
          <p className="subtle" style={{ margin: 0, fontSize: "0.75rem", textAlign: "center" }}>
            {personagem.nome} confere seu dia. Cada quest fechada é uma marca no
            registro.
          </p>
        </div>
      )}

      {/* Diárias */}
      {diarias.length > 0 && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="lbl">Diárias · reset à meia-noite</div>
          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {diarias.map((q) => (
              <div
                key={q.quest_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${q.completa ? "var(--good)" : "var(--hairline)"}`,
                  background: q.completa
                    ? "color-mix(in srgb, var(--good) 8%, transparent)"
                    : "transparent",
                }}
              >
                <span
                  style={{
                    color: q.completa ? "var(--good)" : "var(--text)",
                    fontWeight: q.completa ? 700 : 500,
                  }}
                >
                  {q.completa ? "✓ " : "○ "}
                  {q.descricao}
                </span>
                <span className="subtle" style={{ color: "var(--gold)", fontWeight: 700 }}>
                  +{q.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sidequests */}
      {sides.length > 0 && (
        <div className="panel" style={{ marginBottom: 14, borderLeft: "3px solid var(--neon)" }}>
          <div className="lbl">Sidequests · o extra do dia</div>
          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {sides.map((q) => (
              <div
                key={q.quest_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${q.completa ? "var(--good)" : "var(--hairline)"}`,
                  background: q.completa
                    ? "color-mix(in srgb, var(--good) 8%, transparent)"
                    : "transparent",
                }}
              >
                <span
                  style={{
                    color: q.completa ? "var(--good)" : "var(--text)",
                    fontWeight: q.completa ? 700 : 500,
                  }}
                >
                  {q.completa ? "✓ " : "○ "}
                  {q.descricao}
                </span>
                <span className="subtle" style={{ color: "var(--gold)", fontWeight: 700 }}>
                  +{q.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico 7 dias */}
      {historico.length > 0 && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div className="lbl">Histórico · últimos 7 dias</div>
            <span className="subtle" style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
              {historico.length} concluídas
            </span>
          </div>
          <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
            {historico.slice(0, 20).map((h, i) => (
              <div
                key={`${h.data}-${i}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "4px 0",
                  borderBottom: "1px dashed var(--hairline)",
                  fontSize: "0.8rem",
                }}
              >
                <span className="subtle" style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                  {h.data.slice(5).replace("-", "/")}
                </span>
                <span style={{ flex: 1, marginLeft: 10 }}>
                  {h.descricao}
                  {h.tipo === "sidequest" && (
                    <span className="subtle" style={{ fontSize: "0.65rem" }}> · side</span>
                  )}
                </span>
                <span className="subtle" style={{ color: "var(--gold)" }}>+{h.xp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
