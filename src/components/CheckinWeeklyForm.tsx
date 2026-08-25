"use client";

// ============================================================
// CheckinWeeklyForm — formulário do review semanal (§41).
// ------------------------------------------------------------
// 3 medidas de cintura + agregados. Média das 3 aparece em tempo real.
// PR1: só grava. Sem verdict aqui — vem no PR4.
// ============================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeeklyCheckin } from "@/lib/physique/tipos";
import { mediaCintura } from "@/lib/physique/math";

interface Props {
  inicial: WeeklyCheckin | null;
  semanaIso: string;
}

export default function CheckinWeeklyForm({ inicial, semanaIso }: Props) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<string | null>(inicial?.criado_em ?? null);
  const [erro, setErro] = useState<string | null>(null);

  const [m1, setM1] = useState(strOf(inicial?.cintura_medida_1));
  const [m2, setM2] = useState(strOf(inicial?.cintura_medida_2));
  const [m3, setM3] = useState(strOf(inicial?.cintura_medida_3));
  const [proteinaPct, setProteinaPct] = useState(strOf(inicial?.proteina_pct));
  const [caloriasPct, setCaloriasPct] = useState(strOf(inicial?.calorias_pct));
  const [sonoHMedio, setSonoHMedio] = useState(strOf(inicial?.sono_h_medio));
  const [fomeMedia, setFomeMedia] = useState(strOf(inicial?.fome_media));
  const [tkdSess, setTkdSess] = useState(strOf(inicial?.tkd_sessoes));
  const [dancaSess, setDancaSess] = useState(strOf(inicial?.danca_sessoes));

  const mediaViva = useMemo(
    () => mediaCintura(numOf(m1), numOf(m2), numOf(m3)),
    [m1, m2, m3],
  );

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "weekly",
          semana_iso: semanaIso,
          cintura_medida_1: numOf(m1),
          cintura_medida_2: numOf(m2),
          cintura_medida_3: numOf(m3),
          proteina_pct: numOf(proteinaPct),
          calorias_pct: numOf(caloriasPct),
          sono_h_medio: numOf(sonoHMedio),
          fome_media: numOf(fomeMedia),
          tkd_sessoes: numOf(tkdSess),
          danca_sessoes: numOf(dancaSess),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j?.error ?? "falhou");
      } else {
        setSalvoEm(j?.checkin?.criado_em ?? new Date().toISOString());
        router.refresh();
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro de rede");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card titulo="Cintura (3 medidas)">
        <p style={{ margin: "0 0 10px", color: "var(--ink-dim)", fontSize: 12 }}>
          Umbigo, mesmo lugar, mesmo estado (respiração calma). 3× reduz ruído.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="1ª medida" valor={m1} setValor={setM1} sufixo="cm" step="0.1" />
          <Field label="2ª medida" valor={m2} setValor={setM2} sufixo="cm" step="0.1" />
          <Field label="3ª medida" valor={m3} setValor={setM3} sufixo="cm" step="0.1" />
        </div>
        {mediaViva != null && (
          <div style={{ marginTop: 10, padding: 10, background: "var(--ground)", borderRadius: 10, fontSize: 13 }}>
            Média: <strong style={{ color: "var(--calm)" }}>{mediaViva} cm</strong>
          </div>
        )}
      </Card>

      <Card titulo="Aderência">
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="Proteína atingida" valor={proteinaPct} setValor={setProteinaPct} sufixo="%" step="1" />
          <Field label="Calorias atingidas" valor={caloriasPct} setValor={setCaloriasPct} sufixo="%" step="1" />
        </div>
      </Card>

      <Card titulo="Sinal semanal">
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="Sono médio" valor={sonoHMedio} setValor={setSonoHMedio} sufixo="h" step="0.1" />
          <Field label="Fome média" valor={fomeMedia} setValor={setFomeMedia} sufixo="/10" step="0.1" />
          <Field label="TKD sessões" valor={tkdSess} setValor={setTkdSess} sufixo="x" step="1" />
          <Field label="Dança sessões" valor={dancaSess} setValor={setDancaSess} sufixo="x" step="1" />
        </div>
      </Card>

      {erro && (
        <div style={{ color: "var(--kihap)", fontSize: 13 }}>Erro: {erro}</div>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="btn btn-primary"
        style={{ padding: "14px", fontSize: 16 }}
      >
        {salvando ? "Salvando…" : inicial ? "Atualizar" : "Salvar review"}
      </button>

      {salvoEm && !salvando && (
        <p style={{ color: "var(--chama)", fontSize: 13, textAlign: "center", margin: 0 }}>
          Review salvo em{" "}
          {new Date(salvoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}.
        </p>
      )}
    </div>
  );
}

function strOf(n: number | null | undefined): string {
  return n == null ? "" : String(n);
}
function numOf(s: string): number | null {
  if (s === "" || s == null) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <h2 style={{ margin: "0 0 10px", fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--ink-dim)" }}>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  valor,
  setValor,
  sufixo,
  step,
}: {
  label: string;
  valor: string;
  setValor: (s: string) => void;
  sufixo?: string;
  step?: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
      <span style={{ flex: 1 }}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        style={{
          width: 100,
          padding: "8px 10px",
          background: "var(--ground)",
          color: "var(--ink)",
          border: "1px solid var(--hairline)",
          borderRadius: 10,
          fontSize: 14,
        }}
      />
      {sufixo && <span style={{ color: "var(--ink-dim)", fontSize: 13, width: 30 }}>{sufixo}</span>}
    </label>
  );
}
