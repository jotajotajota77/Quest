// ============================================================
// /plano — Plano personal-trainer 31 dias (cutting + 7× treino).
// ------------------------------------------------------------
// Doc rico com as 15 seções (estratégia, calendário, treinos A-G,
// volume, progressão, cardio, mobilidade, 4 semanas, ajustes,
// checklist, resultado, refeições). Renderiza dentro do app pra
// abrir logado no celular sem depender de artifact externo.
//
// Prioridades v2: PEITO (3× exposures) + ABS com carga (4×).
// ============================================================
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import PlanoJumpNav from "@/components/PlanoJumpNav";
import { MODELOS_ALIMENTARES, METAS_CUTTING } from "@/lib/plano_alimentar";

export default async function PlanoPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="app-shell" style={{ paddingBottom: 120 }}>
      <PlanoHeader />
      <PlanoJumpNav />
      <Estrategia />
      <Calendario />
      {TREINOS.map((t) => <TreinoCard key={t.slug} treino={t} />)}
      <Volume />
      <Progressao />
      <Cardio />
      <Mobilidade />
      <QuatroSemanas />
      <Ajustes />
      <Checklist />
      <Resultado />
      <Refeicoes />
      <VoltarProgramaLink />
      <BottomNav />
    </main>
  );
}

// ────────────────────────────────────────────────────────
// HEADER
// ────────────────────────────────────────────────────────
function PlanoHeader() {
  return (
    <div style={{ padding: "16px 0 12px", borderBottom: "1px solid var(--hairline)", marginBottom: 16 }}>
      <div className="lbl" style={{ color: "var(--kihap)", letterSpacing: "0.18em" }}>
        31 DIAS · 10/08 → 09/09/2026
      </div>
      <h1 className="title-fight" style={{ margin: "4px 0 2px", fontSize: "1.7rem", textTransform: "uppercase" }}>
        Plano cutting + treino 7×
      </h1>
      <p className="subtle" style={{ fontSize: "0.82rem", margin: 0 }}>
        Homem · 28 a · 168 cm · 67 kg · 17,8% BF · Muscul. diária + TKD seg/qua/sex + dança diária.
        <br />
        <strong style={{ color: "var(--gold)" }}>Prioridade v2:</strong> peito (3× exposures) + abs com carga (4×) + V-taper.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 12 }}>
        <StatChip label="kcal/dia" val={`~${METAS_CUTTING.kcal}`} />
        <StatChip label="proteína" val={`~${METAS_CUTTING.proteina_g} g`} />
        <StatChip label="alvo 09/09" val={`~${METAS_CUTTING.peso_alvo_kg} kg`} />
        <StatChip label="BF proj." val={`~${METAS_CUTTING.bf_alvo_pct}%`} />
      </div>
    </div>
  );
}

function StatChip({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ padding: "6px 8px", border: "1px solid var(--hairline)", borderRadius: 6, background: "var(--surface)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--ink)" }}>{val}</div>
      <div style={{ fontSize: "0.58rem", color: "var(--ink-dim)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// §1 ESTRATÉGIA
// ────────────────────────────────────────────────────────
function Estrategia() {
  return (
    <SecaoWrap id="estrategia" num="§1" titulo="Estratégia — em 8 linhas">
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        <li><Item /> Alvo 09/09: <em>~63 kg com ~14–15% BF</em>, cintura menor, ombros/dorsal com V mais claro, peito e abdômen definidos.</li>
        <li><Item /> Motor: déficit ~28–31% (700–850 kcal), proteína alta (150 g), 7× musc, TKD 3×, passos.</li>
        <li><Item /> Em déficit, força é <em>preservada</em> — o objetivo não é PR toda semana, é manter carga e volume.</li>
        <li><Item /> Split: 5 sessões duras (A–E) + 1 acessório curto (F) + 1 regenerativo (G).</li>
        <li><Item /> Legs (C) cai na quarta — <em>RIR 2–3, nunca falha</em> — pra não destruir pernas antes do TKD noturno.</li>
        <li><Item /> Cardio é <em>ajuste fino</em>, não motor: 8 k passos + 1 Z2 no domingo. TKD já é HIIT natural.</li>
        <li><Item /> Progressão double: sobe reps até teto da faixa, aí sobe carga. Sem trocar exercício em 31 dias.</li>
        <li><Item /> <strong>Realismo:</strong> em 31 dias ganho de músculo visível é improvável. O que muda a foto é a gordura saindo.</li>
      </ul>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// §2 CALENDÁRIO
// ────────────────────────────────────────────────────────
const CAL: { data: string; split: string; tag: string; tkd?: boolean; regen?: boolean }[] = [
  // Semana 1
  { data: "10/08", split: "A · Push #1", tag: "+ dança · TKD 20h", tkd: true },
  { data: "11/08", split: "B · Pull", tag: "+ dança" },
  { data: "12/08", split: "C · Legs", tag: "+ dança · TKD 20h", tkd: true },
  { data: "13/08", split: "D · Push #2 + ABS", tag: "+ dança · marmita" },
  { data: "14/08", split: "E · Arms + ABS", tag: "+ dança · TKD 20h · marmita", tkd: true },
  { data: "15/08", split: "F · Chest+ + ABS", tag: "+ dança" },
  { data: "16/08", split: "G · Regen", tag: "+ dança longa · meal prep", regen: true },
  // Semana 2
  { data: "17/08", split: "A · Push #1", tag: "SEM 2 · TKD 20h", tkd: true },
  { data: "18/08", split: "B · Pull", tag: "" },
  { data: "19/08", split: "C · Legs", tag: "TKD 20h", tkd: true },
  { data: "20/08", split: "D · Push #2 + ABS", tag: "marmita" },
  { data: "21/08", split: "E · Arms + ABS", tag: "TKD 20h · marmita", tkd: true },
  { data: "22/08", split: "F · Chest+ + ABS", tag: "" },
  { data: "23/08", split: "G · Regen", tag: "meal prep", regen: true },
  // Semana 3
  { data: "24/08", split: "A · Push #1", tag: "SEM 3 · TKD 20h", tkd: true },
  { data: "25/08", split: "B · Pull", tag: "" },
  { data: "26/08", split: "C · Legs", tag: "TKD 20h", tkd: true },
  { data: "27/08", split: "D · Push #2 + ABS", tag: "marmita" },
  { data: "28/08", split: "E · Arms + ABS", tag: "TKD 20h · marmita", tkd: true },
  { data: "29/08", split: "F · Chest+ + ABS", tag: "" },
  { data: "30/08", split: "G · Regen", tag: "meal prep", regen: true },
  // Semana 4 · deload interno
  { data: "31/08", split: "A · Push #1", tag: "SEM 4 · TKD 20h · -1 série", tkd: true },
  { data: "01/09", split: "B · Pull", tag: "-1 série por exerc" },
  { data: "02/09", split: "C · Legs", tag: "TKD 20h · -1 série", tkd: true },
  { data: "03/09", split: "D · Push #2 + ABS", tag: "marmita · -1 série" },
  { data: "04/09", split: "E · Arms + ABS", tag: "TKD 20h · marmita", tkd: true },
  { data: "05/09", split: "F · Chest+ + ABS", tag: "volume normal" },
  { data: "06/09", split: "G · Regen", tag: "meal prep", regen: true },
  // Semana 5 parcial
  { data: "07/09", split: "A · Push #1", tag: "SEM 5 · TKD 20h", tkd: true },
  { data: "08/09", split: "B · Pull", tag: "" },
  { data: "09/09", split: "C · Legs (leve)", tag: "TKD 20h · FOTO FINAL", tkd: true },
];

function Calendario() {
  return (
    <SecaoWrap id="calendario" num="§2" titulo="Calendário — 4 semanas + 2 dias">
      <p className="subtle" style={{ fontSize: "0.8rem", margin: "0 0 8px", maxWidth: 520 }}>
        Rotação fixa por dia da semana. Barra dourada = TKD à noite. Cor esmaecida = domingo regenerativo.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, fontSize: "0.6rem" }}>
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} style={{ textAlign: "center", color: "var(--ink-dim)", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 0" }}>{d}</div>
        ))}
        {CAL.map((c) => (
          <div
            key={c.data}
            style={{
              padding: "4px 3px",
              minHeight: 60,
              border: "1px solid var(--hairline)",
              borderLeft: c.tkd ? "3px solid var(--gold)" : "1px solid var(--hairline)",
              borderRadius: 4,
              background: c.regen ? "color-mix(in srgb, var(--surface) 40%, transparent)" : "var(--surface)",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.72rem", color: "var(--ink)" }}>{c.data}</span>
            <span style={{ fontWeight: 700, fontSize: "0.56rem", color: "var(--kihap)", lineHeight: 1.15 }}>{c.split}</span>
            <span style={{ fontSize: "0.52rem", color: "var(--ink-dim)", lineHeight: 1.15 }}>{c.tag}</span>
          </div>
        ))}
      </div>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// TREINOS A–G (dados)
// ────────────────────────────────────────────────────────
interface Row {
  ex: string;
  sr: string;      // "4 × 6-10"
  desc: string;    // "2 min"
  rir: string;     // "2" | "1-2" | "—"
  nota: string;
}
interface TreinoPlan {
  slug: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  titulo: string;
  quando: string;
  intensidade: "hard" | "medio" | "light" | "regen";
  duracao: string;
  linhas: Row[];
  nota: string;
}

const TREINOS: TreinoPlan[] = [
  {
    slug: "A",
    titulo: "Push #1 — Peito↑ + Ombro + Tríceps",
    quando: "Segunda · TKD 20h",
    intensidade: "medio",
    duracao: "45–55 min",
    linhas: [
      { ex: "Supino inclinado halter (30°)", sr: "4 × 6-10", desc: "2 min", rir: "2", nota: "Principal do peito da sem. Escápula presa." },
      { ex: "Supino reto máquina", sr: "3 × 10-12", desc: "90 s", rir: "2", nota: "Máquina pra progredir sem stress no ombro." },
      { ex: "Crucifixo inclinado polia", sr: "3 × 12-15", desc: "60 s", rir: "1", nota: "Amplitude > carga." },
      { ex: "Desenvolvimento halter", sr: "3 × 8-10", desc: "90 s", rir: "2", nota: "Cotovelo levemente à frente." },
      { ex: "Elevação lateral", sr: "4 × 12-15", desc: "45 s", rir: "1", nota: "Prioridade V-taper. Cadência lenta." },
      { ex: "Tríceps corda", sr: "3 × 12-15", desc: "60 s", rir: "1", nota: "Abre a corda no final." },
      { ex: "Tríceps testa", sr: "2 × 8-12", desc: "75 s", rir: "1", nota: "Opcional se sobrar tempo." },
    ],
    nota: "TKD à noite → mantém RIR 2. Se cansaço > 7/10, corta a testa.",
  },
  {
    slug: "B",
    titulo: "Pull — Costas + Bíceps + Post",
    quando: "Terça · sem TKD",
    intensidade: "hard",
    duracao: "55–65 min",
    linhas: [
      { ex: "Barra fixa pronada", sr: "4 × AMRAP (6-10)", desc: "2 min", rir: "1", nota: "Se passar 12 limpas, cinta com peso." },
      { ex: "Remada curvada barra", sr: "4 × 6-10", desc: "2 min", rir: "2", nota: "Espessura de costas." },
      { ex: "Puxada supinada", sr: "3 × 8-12", desc: "90 s", rir: "2", nota: "Foco V — pegada na largura do ombro." },
      { ex: "Remada unilateral halter", sr: "3 × 10-12 (cada)", desc: "60 s", rir: "1", nota: "Cotovelo colado ao corpo." },
      { ex: "Face pull corda", sr: "4 × 15-20", desc: "45 s", rir: "1", nota: "Post deltoide 1º da sem." },
      { ex: "Rosca direta", sr: "3 × 8-10", desc: "75 s", rir: "1", nota: "Barra reta ou W." },
      { ex: "Rosca martelo", sr: "3 × 10-12", desc: "60 s", rir: "1", nota: "Braquial + antebraço." },
    ],
    nota: "Dia mais livre pra puxar pesado. Banana pré-treino.",
  },
  {
    slug: "C",
    titulo: "Legs + Core técnico",
    quando: "Quarta · TKD 20h",
    intensidade: "medio",
    duracao: "50–60 min",
    linhas: [
      { ex: "Agachamento livre ou búlgaro", sr: "4 × 6-8 (3 × 8/lado)", desc: "2 min", rir: "2-3", nota: "RIR 3 no dia de TKD. NUNCA falha." },
      { ex: "Leg press 45°", sr: "3 × 10-12", desc: "90 s", rir: "2", nota: "Pés médios — foco quadríceps." },
      { ex: "Stiff halter", sr: "3 × 8-10", desc: "90 s", rir: "2", nota: "Base do chute — posterior + glúteo." },
      { ex: "Cadeira flexora", sr: "3 × 12-15", desc: "60 s", rir: "1", nota: "Pausa 1 s no topo." },
      { ex: "Elevação de quadril", sr: "3 × 10-12", desc: "60 s", rir: "1", nota: "Glúteo — pausa 1 s no topo." },
      { ex: "Panturrilha em pé", sr: "4 × 12-15", desc: "45 s", rir: "1", nota: "Pausa embaixo, sobe explosivo." },
      { ex: "Pallof press polia", sr: "3 × 10 (cada)", desc: "45 s", rir: "1", nota: "Anti-rotação — core técnico." },
    ],
    nota: "Se pernas duras > 6/10 antes, corta metade e vai embora.",
  },
  {
    slug: "D",
    titulo: "Push #2 + ABS pesado (dia forte)",
    quando: "Quinta · sem TKD",
    intensidade: "hard",
    duracao: "55–65 min",
    linhas: [
      { ex: "Supino inclinado barra", sr: "4 × 8-10", desc: "2 min", rir: "2", nota: "2º estímulo peito superior." },
      { ex: "Peck deck (foco superior)", sr: "3 × 12-15", desc: "60 s", rir: "1", nota: "Isolador — sente a contração." },
      { ex: "Desenvolvimento arnold", sr: "3 × 10-12", desc: "90 s", rir: "2", nota: "Rota completa deltoide anterior." },
      { ex: "Elevação lateral polia baixa", sr: "4 × 12-15", desc: "45 s", rir: "1", nota: "Unilateral — tensão contínua." },
      { ex: "Face pull", sr: "3 × 15-20", desc: "45 s", rir: "1", nota: "Post 2º da sem." },
      { ex: "Crunch na polia (com peso)", sr: "4 × 12-15", desc: "45 s", rir: "1", nota: "AB COM CARGA = ab que cresce. Sobe carga toda semana." },
      { ex: "Elevação de pernas barra", sr: "3 × 8-12", desc: "60 s", rir: "1", nota: "AB inferior. Pausa embaixo." },
      { ex: "Cable woodchopper", sr: "3 × 10 (cada)", desc: "45 s", rir: "1", nota: "Oblíquo com carga." },
    ],
    nota: "Dia principal de peito + abs. Chega alimentado.",
  },
  {
    slug: "E",
    titulo: "Shoulders/Arms leve + ABS #2",
    quando: "Sexta · TKD 20h",
    intensidade: "light",
    duracao: "40–50 min",
    linhas: [
      { ex: "Desenvolvimento halter", sr: "3 × 8-10", desc: "90 s", rir: "2", nota: "Único composto do dia." },
      { ex: "Elevação lateral (varia)", sr: "4 × 12-15", desc: "45 s", rir: "1", nota: "Halter → polia → máquina, alterna." },
      { ex: "Crucifixo invertido peck deck", sr: "3 × 12-15", desc: "45 s", rir: "1", nota: "Post deltoide." },
      { ex: "Rosca scott máquina", sr: "3 × 8-12", desc: "60 s", rir: "1", nota: "Bíceps 2º." },
      { ex: "Rosca martelo corda", sr: "3 × 12", desc: "60 s", rir: "1", nota: "Braquial." },
      { ex: "Tríceps corda", sr: "3 × 12-15", desc: "60 s", rir: "1", nota: "Tríceps 2º." },
      { ex: "Ab wheel (rollout)", sr: "3 × 6-10", desc: "60 s", rir: "1", nota: "Joelho no chão até dominar." },
      { ex: "Reverse crunch", sr: "3 × 12-15", desc: "45 s", rir: "1", nota: "AB inferior dinâmico." },
    ],
    nota: "Sistema descansado pro TKD à noite. Se aparecer PR aqui, tá bom demais.",
  },
  {
    slug: "F",
    titulo: "Chest+ (Peito 3º + Ombro + ABS #3)",
    quando: "Sábado · sem TKD",
    intensidade: "medio",
    duracao: "40–45 min",
    linhas: [
      { ex: "Supino inclinado máquina", sr: "3 × 10-12", desc: "90 s", rir: "2", nota: "3ª exposure peito superior da sem." },
      { ex: "Crossover polia alta", sr: "3 × 12-15", desc: "60 s", rir: "1", nota: "Foco fibras médias/inferiores." },
      { ex: "Elevação lateral halter", sr: "5 × 12-15", desc: "45 s", rir: "1", nota: "5 SÉRIES DEDICADAS. Meta 31d: 12 kg limpo." },
      { ex: "Face pull", sr: "3 × 15-20", desc: "45 s", rir: "1", nota: "Post 3º da sem." },
      { ex: "Mergulho paralela", sr: "3 × 8-12", desc: "90 s", rir: "1-2", nota: "Tríceps + peito baixo. Peso corporal." },
      { ex: "Prancha com peso nas costas", sr: "3 × 30-45s", desc: "45 s", rir: "—", nota: "Core estático COM carga. Progride +2,5 kg quando bater 45 s." },
      { ex: "Panturrilha sentado", sr: "3 × 15-20", desc: "45 s", rir: "1", nota: "Sóleo — fibra diferente da em pé." },
    ],
    nota: "Cirúrgico. Não vira treino cheio.",
  },
  {
    slug: "G",
    titulo: "Regen — Mobilidade + Core + Cardio Z2",
    quando: "Domingo · regenerativo",
    intensidade: "regen",
    duracao: "60–90 min",
    linhas: [
      { ex: "Cardio Z2 (subida / bike / trote)", sr: "45–60 min", desc: "—", rir: "—", nota: "Zona 2 = dá pra conversar em frases." },
      { ex: "Prancha + prancha lateral + dead bug + bird dog + hollow hold", sr: "3 rounds", desc: "60 s entre rounds", rir: "—", nota: "Circuit core dinâmico." },
      { ex: "Mobilidade TKD (90/90, cossack, frog, WGS)", sr: "15 min", desc: "—", rir: "—", nota: "Ver §11 abaixo." },
      { ex: "Dança longa", sr: "30–60 min", desc: "—", rir: "—", nota: "Coreo nova sem pressão." },
    ],
    nota: "Sem musculação de força. Domingo é manutenção do corpo, não estímulo.",
  },
];

function TreinoCard({ treino }: { treino: TreinoPlan }) {
  const cor = treino.intensidade === "hard" ? "var(--kihap)"
    : treino.intensidade === "medio" ? "var(--belt-yellow)"
    : treino.intensidade === "light" ? "var(--chama)"
    : "var(--hairline)";
  return (
    <SecaoWrap id={`treino-${treino.slug.toLowerCase()}`} num={treino.slug} titulo={treino.titulo}>
      <div className="panel" style={{ padding: 14, borderLeft: `4px solid ${cor}`, marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 10 }}>
          {treino.quando} <span style={{ color: cor, paddingLeft: 6, marginLeft: 6, borderLeft: "1px solid var(--hairline)" }}>{treino.duracao}</span>
        </div>
        <div style={{ overflowX: "auto", border: "1px solid var(--hairline)", borderRadius: 6 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)" }}>
                <Th>Exercício</Th><Th style={{ whiteSpace: "nowrap" }}>Séries × reps</Th><Th>Desc.</Th><Th>RIR</Th><Th>Nota</Th>
              </tr>
            </thead>
            <tbody>
              {treino.linhas.map((r, i) => (
                <tr key={i} style={{ borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}>
                  <Td style={{ fontWeight: 600, minWidth: 140 }}>{r.ex}</Td>
                  <Td style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{r.sr}</Td>
                  <Td style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{r.desc}</Td>
                  <Td style={{ fontFamily: "var(--font-mono)", color: "var(--gold)" }}>{r.rir}</Td>
                  <Td style={{ color: "var(--ink-dim)", fontSize: "0.72rem", minWidth: 180 }}>{r.nota}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="subtle" style={{ margin: "10px 0 0", fontSize: "0.78rem", fontStyle: "italic" }}>{treino.nota}</p>
      </div>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// §8 VOLUME SEMANAL
// ────────────────────────────────────────────────────────
const VOLUME_ROWS: { grupo: string; series: string; onde: string; racional: string }[] = [
  { grupo: "Peito (superior)", series: "18–20", onde: "A(7) + D(7) + F(6)", racional: "3× exposures — PRIORIDADE v2." },
  { grupo: "Ombro lateral", series: "17", onde: "A(4) + D(4) + E(4) + F(5)", racional: "4× exposures — V-taper." },
  { grupo: "Ombro posterior", series: "10–12", onde: "B(4) + D(3) + E(3) + F(3)", racional: "Face pull + crucifixo inv." },
  { grupo: "Costas", series: "13–15", onde: "B(13)", racional: "1× hard só, evita colisão com abs D." },
  { grupo: "Bíceps", series: "9", onde: "B(6) + E(3)", racional: "Braço cheio sem afogar recuperação." },
  { grupo: "Tríceps", series: "8–10", onde: "A(5) + E(3) + F(3)", racional: "Toque frequente, volume moderado." },
  { grupo: "Quadríceps", series: "7", onde: "C(7)", racional: "Baixo POR DESIGN — TKD à noite." },
  { grupo: "Post coxa / glúteo", series: "9", onde: "C(9)", racional: "Stiff + flexora + hip thrust." },
  { grupo: "Panturrilha", series: "7", onde: "C(4) + F(3)", racional: "Em pé + sentado — 2 fibras." },
  { grupo: "ABS (com carga)", series: "17", onde: "D(10) + E(6) + F(3) + G(circuit)", racional: "PRIORIDADE v2 — 4× exposures, progride carga." },
];

function Volume() {
  return (
    <SecaoWrap id="volume" num="§8" titulo="Volume semanal por músculo">
      <p className="subtle" style={{ fontSize: "0.78rem", margin: "0 0 8px" }}>
        Séries efetivas (≤ 3 RIR). Faixas escolhidas pra <em>preservar</em> massa no déficit — não hipertrofia-maximalista.
      </p>
      <div style={{ overflowX: "auto", border: "1px solid var(--hairline)", borderRadius: 6, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }}>
          <thead><tr><Th>Grupo</Th><Th>Séries/sem</Th><Th>Onde entra</Th><Th>Racional</Th></tr></thead>
          <tbody>
            {VOLUME_ROWS.map((r) => (
              <tr key={r.grupo} style={{ borderTop: "1px solid var(--hairline)" }}>
                <Td style={{ fontWeight: 600 }}>{r.grupo}</Td>
                <Td style={{ fontFamily: "var(--font-mono)", color: "var(--gold)" }}>{r.series}</Td>
                <Td style={{ color: "var(--ink-dim)", fontSize: "0.72rem" }}>{r.onde}</Td>
                <Td style={{ color: "var(--ink-dim)", fontSize: "0.72rem" }}>{r.racional}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout tom="gold" label="Por que volume moderado em déficit?">
        Em déficit ~30% recuperação cai. Adicionar volume não vira mais músculo — vira mais cansaço. A meta é
        <em> preservação com toque frequente</em>: cada músculo 2× (peito e abs 3–4×), suficiente pro sinal
        anabólico sem afogar recuperação.
      </Callout>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// §9 PROGRESSÃO
// ────────────────────────────────────────────────────────
function Progressao() {
  return (
    <SecaoWrap id="progressao" num="§9" titulo="Progressão — double progression">
      <p>Um exercício fica com você os 31 dias. Só troca se doer.</p>
      <ol style={{ paddingLeft: 20 }}>
        <li><strong>Semana 1:</strong> calibra. Carga que deixa no <em>meio</em> da faixa com RIR 2–3.</li>
        <li><strong>A cada sessão:</strong> tenta +1 rep em cada série, mesma carga.</li>
        <li><strong>Todas atingiram o teto</strong> (ex: 3×12 em 8–12) → sobe carga (+1 kg isolador, +2,5 kg composto) e volta pro meio-baixo.</li>
        <li><strong>Se cair 2 reps vs. sem anterior:</strong> mantém carga, reajusta sono/descanso.</li>
        <li><strong>Se cair 4+ reps em 2 sessões seguidas:</strong> desce 5–10% na próxima sem — é fadiga, não fracasso.</li>
      </ol>

      <div style={{ overflowX: "auto", border: "1px solid var(--hairline)", borderRadius: 6, background: "var(--surface)", marginTop: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", fontVariantNumeric: "tabular-nums" }}>
          <thead><tr>
            <Th>Exemplo · Supino inclinado H (4 × 6–10)</Th>
            <Th>Set 1</Th><Th>Set 2</Th><Th>Set 3</Th><Th>Set 4</Th>
            <Th>Decisão</Th>
          </tr></thead>
          <tbody>
            <ProgRow left="S1 · 20 kg" sets={[8, 8, 7, 7]} dec="Base — calibra." />
            <ProgRow left="S2 · 20 kg" sets={[9, 9, 8, 8]} dec="+1 rep → mantém carga." />
            <ProgRow left="S3 · 20 kg" sets={[10, 10, 9, 9]} dec="Meta bateu no teto." />
            <ProgRow left="S4 · 22 kg" sets={[7, 7, 6, 6]} dec="Sobe carga, volta pro meio." />
          </tbody>
        </table>
      </div>

      <Callout tom="good" label="Onde levar quase à falha">
        Isoladores: elevação lateral, crucifixo, rosca, extensora, flexora, panturrilha,
        crunch polia. RIR 1, ocasionalmente falha na última série.
      </Callout>
      <Callout tom="bad" label="Onde NÃO buscar falha">
        Agachamento, remada barra, desenvolvimento barra, stiff, mergulho, elevação de pernas.
        RIR 2 é o piso — falha em composto = fadiga cara, forma quebrada, risco.
      </Callout>
    </SecaoWrap>
  );
}

function ProgRow({ left, sets, dec }: { left: string; sets: number[]; dec: string }) {
  return (
    <tr style={{ borderTop: "1px solid var(--hairline)" }}>
      <Td>{left}</Td>
      {sets.map((s, i) => <Td key={i} style={{ fontFamily: "var(--font-mono)" }}>{s}</Td>)}
      <Td style={{ color: "var(--ink-dim)", fontSize: "0.7rem" }}>{dec}</Td>
    </tr>
  );
}

// ────────────────────────────────────────────────────────
// §10 CARDIO
// ────────────────────────────────────────────────────────
function Cardio() {
  return (
    <SecaoWrap id="cardio" num="§10" titulo="Cardio + passos">
      <div style={{ overflowX: "auto", border: "1px solid var(--hairline)", borderRadius: 6, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
          <thead><tr><Th>Fonte</Th><Th>Meta base</Th><Th>Quando escalar</Th></tr></thead>
          <tbody>
            <tr style={{ borderTop: "1px solid var(--hairline)" }}>
              <Td style={{ fontWeight: 600 }}>Passos diários</Td>
              <Td style={{ fontFamily: "var(--font-mono)" }}>8.000 · TKD +2.000</Td>
              <Td style={{ color: "var(--ink-dim)", fontSize: "0.72rem" }}>Peso parado 10 dias → sobe pra 10.000.</Td>
            </tr>
            <tr style={{ borderTop: "1px solid var(--hairline)" }}>
              <Td style={{ fontWeight: 600 }}>Cardio Z2 (dom G)</Td>
              <Td style={{ fontFamily: "var(--font-mono)" }}>1× · 45–60 min</Td>
              <Td style={{ color: "var(--ink-dim)", fontSize: "0.72rem" }}>Peso parado 14d + passos em 10k → +1× 30min qui.</Td>
            </tr>
            <tr style={{ borderTop: "1px solid var(--hairline)" }}>
              <Td style={{ fontWeight: 600 }}>TKD (seg/qua/sex)</Td>
              <Td style={{ fontFamily: "var(--font-mono)" }}>3× · 2h</Td>
              <Td style={{ color: "var(--ink-dim)", fontSize: "0.72rem" }}>HIIT natural — não precisa "compensar" com corrida.</Td>
            </tr>
            <tr style={{ borderTop: "1px solid var(--hairline)" }}>
              <Td style={{ fontWeight: 600 }}>Dança pós-musc</Td>
              <Td style={{ fontFamily: "var(--font-mono)" }}>30 min diários</Td>
              <Td style={{ color: "var(--ink-dim)", fontSize: "0.72rem" }}>Conta como passos + cardio leve.</Td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: "0.82rem", marginTop: 10 }}>Comida é o motor do déficit. Cardio é ajuste fino — se usar cardio pra "compensar" comer mais, o déficit some.</p>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// §11 MOBILIDADE
// ────────────────────────────────────────────────────────
const MOB_ROWS = [
  { ex: "90/90 hip switch", sr: "2 × 8/lado", alvo: "Rotação de quadril — controle int/ext." },
  { ex: "Cossack squat", sr: "2 × 6/lado", alvo: "Abertura lateral + adutor ativo." },
  { ex: "Frog pose (pulsos)", sr: "2 × 30 s", alvo: "Adutores." },
  { ex: "World's greatest stretch", sr: "2 × 5/lado", alvo: "Flexor de quadril + T-spine." },
  { ex: "Elevação de perna ativa (deitado)", sr: "2 × 8/lado", alvo: "Chute ativo até altura máxima limpa." },
  { ex: "Kneeling hip flexor stretch", sr: "2 × 30 s/lado", alvo: "Libera quadril anterior." },
  { ex: "Standing kick-hold (ap chagi)", sr: "2 × 5s no topo, 5/lado", alvo: "Controle no ápice do chute." },
];

function Mobilidade() {
  return (
    <SecaoWrap id="mob" num="§11" titulo="Mobilidade TKD — 10–15 min · 3–5×/sem">
      <p className="subtle" style={{ fontSize: "0.8rem" }}>
        Depois da dança ou antes do TKD. NUNCA troca por alongamento passivo pré-musculação (pré-treino é dinâmico).
      </p>
      <div style={{ overflowX: "auto", border: "1px solid var(--hairline)", borderRadius: 6, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
          <thead><tr><Th>Movimento</Th><Th>Sets</Th><Th>Alvo</Th></tr></thead>
          <tbody>
            {MOB_ROWS.map((r) => (
              <tr key={r.ex} style={{ borderTop: "1px solid var(--hairline)" }}>
                <Td style={{ fontWeight: 600 }}>{r.ex}</Td>
                <Td style={{ fontFamily: "var(--font-mono)" }}>{r.sr}</Td>
                <Td style={{ color: "var(--ink-dim)", fontSize: "0.72rem" }}>{r.alvo}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// §12 QUATRO SEMANAS
// ────────────────────────────────────────────────────────
const SEM_CARDS = [
  { titulo: "Semana 1 · 10–16/08 · Calibração", texto: "Cargas em RIR 2–3 no meio da faixa. Anota tudo. Sem falha. Base." },
  { titulo: "Semana 2 · 17–23/08 · Progressão de reps", texto: "Mesma carga da S1. Meta: +1 rep por série. Metabólico adaptou, força volta." },
  { titulo: "Semana 3 · 24–30/08 · Progressão de carga", texto: "Exercícios no teto sobem carga (+1 kg iso, +2,5 kg comp). Fadiga acumula no fim da sem." },
  { titulo: "Semana 4 · 31/08–06/09 · Sustentação (mini-deload)", texto: "TIRA 1 SÉRIE de cada exerc em A–D. Cargas iguais. Preserva força pra 09/09." },
  { titulo: "Semana 5 (parcial) · 07–09/09 · Fecha", texto: "Só A/B/C leve. Água normal. Foto no dia 09 pela manhã, mesma iluminação de 10/08." },
];

function QuatroSemanas() {
  return (
    <SecaoWrap id="semanas" num="§12" titulo="Estratégia por semana">
      {SEM_CARDS.map((s) => (
        <div key={s.titulo} className="panel" style={{ padding: "10px 12px", marginBottom: 8 }}>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 3 }}>{s.titulo}</div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-dim)" }}>{s.texto}</p>
        </div>
      ))}
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// §13 AJUSTES
// ────────────────────────────────────────────────────────
const AJUSTES_ROWS = [
  ["Perdeu > 4 reps em 2 sessões", "Fadiga acumulada", "-1 série de cada exerc por 1 sem. Sobe sono pra 8h."],
  ["Dormiu < 6h por 3 noites", "Sono", "NÃO sobe carga. Corta cardio Z2 da sem."],
  ["Fome constante entre refeições 4 dias", "Déficit excessivo", "+100–150 kcal (½ pão + ½ fruta)."],
  ["Chutes TKD lentos, baixos", "Glicogênio baixo", "1 fruta 30 min pré-dojang. Água + sal."],
  ["Peso parado 14 dias", "Déficit acabou", "Passos → 10k. NÃO corta comida."],
  ["Perdeu > 1,5 kg em 1 sem (fora S1)", "Déficit agressivo", "+100 kcal. Perder rápido = perder músculo."],
  ["Ansiedade alta, humor caindo", "Estresse composto", "Corta cardio extra. G vira 100% descanso."],
];

function Ajustes() {
  return (
    <SecaoWrap id="ajustes" num="§13" titulo="Se a recuperação piorar">
      <p>Se sua força cair drasticamente, <em>NÃO presuma que precisa treinar mais</em>. Diagnóstico:</p>
      <div style={{ overflowX: "auto", border: "1px solid var(--hairline)", borderRadius: 6, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
          <thead><tr><Th>Sinal</Th><Th>Provável causa</Th><Th>Ajuste</Th></tr></thead>
          <tbody>
            {AJUSTES_ROWS.map(([s, c, a], i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--hairline)" }}>
                <Td style={{ fontWeight: 600 }}>{s}</Td>
                <Td style={{ color: "var(--ink-dim)" }}>{c}</Td>
                <Td style={{ color: "var(--ink-dim)" }}>{a}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// §14 CHECKLIST
// ────────────────────────────────────────────────────────
const CHK_ITEMS = [
  "1.800 kcal · 150 g proteína",
  "3–3,5 L água",
  "≥ 8.000 passos (10 k em dia de TKD)",
  "Musc feita (registrada no /treino)",
  "30 min dança pós-musc",
  "TKD (seg/qua/sex)",
  "Mobilidade 10 min (dias sem TKD)",
  "Sono ≥ 7 h",
  "Peso pela manhã em jejum (usa a média móvel)",
  "1 foto/semana mesma iluminação (domingo)",
];

function Checklist() {
  return (
    <SecaoWrap id="chk" num="§14" titulo="Checklist diário">
      <div style={{ display: "grid", gap: 4 }}>
        {CHK_ITEMS.map((it) => (
          <div key={it} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 10px", border: "1px solid var(--hairline)", borderRadius: 6, background: "var(--surface)" }}>
            <span style={{ width: 12, height: 12, border: "1.5px solid var(--ink-dim)", borderRadius: 3, flexShrink: 0, marginTop: 3 }} />
            <span style={{ fontSize: "0.82rem" }}>{it}</span>
          </div>
        ))}
      </div>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// §15 RESULTADO
// ────────────────────────────────────────────────────────
function Resultado() {
  return (
    <SecaoWrap id="resultado" num="§15" titulo="Resultado realista em 09/09">
      <Callout tom="good" label="Muito provável">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Perda de 3–4 kg (a maioria de gordura).</li>
          <li>Cintura menor em ~2–4 cm.</li>
          <li>Foto lateral com mais separação ombro/cintura.</li>
          <li>Preservação total da força (pode até subir em isoladores).</li>
          <li>Manutenção/melhora TKD (peso menor → chute mais rápido).</li>
        </ul>
      </Callout>
      <Callout tom="gold" label="Provável">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>BF caindo de 17,8% pra 14–15%.</li>
          <li>Definição visível abdômen superior (2 gomos).</li>
          <li>Contorno nítido peitoral + deltoide lateral.</li>
          <li>Braço parecendo maior (mesma medida, menos pele/gordura).</li>
        </ul>
      </Callout>
      <Callout tom="warn" label="Possível, não garantido">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Abdômen inferior visível (depende da genética).</li>
          <li>+1–1,5 kg reais de músculo (só se destreinado nesses grupos).</li>
          <li>Deltoide lateral +1 cm.</li>
          <li>13% BF (exigiria déficit maior).</li>
        </ul>
      </Callout>
      <Callout tom="bad" label="Improvável em 31 dias">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>+3 kg de músculo.</li>
          <li>Ficar shredded &lt; 10% BF.</li>
          <li>Ganhar massa significativa em cutting a partir de 17,8%.</li>
          <li>Mudança dramática na proporção óssea (isso é anos).</li>
        </ul>
      </Callout>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// § REFEIÇÕES (do plano_alimentar.ts)
// ────────────────────────────────────────────────────────
function Refeicoes() {
  return (
    <SecaoWrap id="refeicoes" num="§" titulo="Plano alimentar — 7 modelos (A–G)">
      <p className="subtle" style={{ fontSize: "0.8rem", margin: "0 0 8px" }}>
        Base ~1.750–1.840 kcal · ~150–161 g P. Modelo C substitui macarrão por arroz mantendo kcal/prot.
      </p>
      {MODELOS_ALIMENTARES.map((m) => (
        <div key={m.slug} className="panel" style={{ padding: 12, marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", textTransform: "uppercase" }}>
            Modelo {m.slug} — {m.nome}
          </div>
          <div className="subtle" style={{ fontSize: "0.72rem", marginBottom: 6 }}>
            {["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][m.dia_semana_padrao]}
            {m.observacao ? ` · ${m.observacao}` : ""}
          </div>
          <ul style={{ paddingLeft: 18, margin: "4px 0 6px", fontSize: "0.8rem" }}>
            {m.refeicoes.map((r) => (
              <li key={r.refeicao} style={{ marginBottom: 3 }}>
                <strong style={{ textTransform: "capitalize" }}>{r.refeicao}:</strong>{" "}
                <span style={{ color: "var(--ink-dim)" }}>{r.itens.join(" · ")}</span>
              </li>
            ))}
          </ul>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--gold)" }}>
            {m.kcal} kcal · {m.proteina_g} g P · {m.carbo_g} g C · {m.gordura_g} g G
          </div>
        </div>
      ))}
      <Callout tom="gold" label="Regra geral">
        Proteína em <em>todas</em> as 5 refeições. Vegetais livres. Peso é cozido/pronto.
        Nos dias de treino duplo (seg/qua/sex): +1 fruta ou +1 c. sopa arroz no almoço.
      </Callout>
    </SecaoWrap>
  );
}

// ────────────────────────────────────────────────────────
// LINK PRA /programa
// ────────────────────────────────────────────────────────
function VoltarProgramaLink() {
  return (
    <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--hairline)", color: "var(--ink-dim)", fontSize: "0.8rem" }}>
      <p>
        <strong>Registra na app:</strong> abre /treino, seleciona o split do dia
        (A–G segue o dia da semana) e loga série por série. A app credita XP,
        mastery, boss e drops de photocard.
      </p>
      <p>
        <strong>Fotos:</strong> tira em 10/08, 16/08, 23/08, 30/08 e 09/09. Sempre
        mesma janela às 7h, jejum, cueca preta.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <Link href="/programa" className="chip">← Voltar pro /programa (calendário)</Link>
        <Link href="/treino" className="chip">Ir pro /treino →</Link>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Helpers UI
// ────────────────────────────────────────────────────────
function SecaoWrap({ id, num, titulo, children }: { id: string; num: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginTop: 26, scrollMarginTop: 84 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem", fontFamily: "var(--font-display)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
        <span style={{ color: "var(--kihap)", fontFamily: "var(--font-mono)", fontWeight: 700, marginRight: 6, fontSize: "0.9rem" }}>{num}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{
      padding: "6px 8px", textAlign: "left", fontFamily: "var(--font-mono)",
      fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
      color: "var(--ink-dim)", background: "color-mix(in srgb, var(--surface) 90%, transparent)",
      ...style,
    }}>{children}</th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "6px 8px", verticalAlign: "top", ...style }}>{children}</td>;
}

function Item() {
  return <span style={{ color: "var(--kihap)", fontWeight: 800, marginRight: 4 }}>·</span>;
}

function Callout({ tom, label, children }: { tom: "gold" | "good" | "bad" | "warn"; label: string; children: React.ReactNode }) {
  const cor = tom === "good" ? "var(--chama)" : tom === "bad" ? "var(--kihap)" : tom === "warn" ? "var(--belt-yellow)" : "var(--gold)";
  return (
    <div style={{
      border: "1px solid var(--hairline)", borderLeft: `4px solid ${cor}`, borderRadius: 6,
      padding: "10px 12px", background: `color-mix(in srgb, ${cor} 6%, var(--surface))`,
      margin: "8px 0",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.14em",
        textTransform: "uppercase", color: cor, marginBottom: 6, fontWeight: 700,
      }}>{label}</div>
      <div style={{ fontSize: "0.82rem" }}>{children}</div>
    </div>
  );
}
