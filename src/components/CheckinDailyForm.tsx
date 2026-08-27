"use client";

// ============================================================
// CheckinDailyForm — formulário do daily check-in (§40, <60s).
// ------------------------------------------------------------
// Slider 0-10 pra escalas subjetivas (fome/energia/dor/stress).
// Segmented pill pra humor. Peso e sono como numéricos opcionais.
// Chips booleanos pros "previstos hoje".
//
// PR1: só grava. Nada de XP, nada de badges. Feedback visual = "salvo".
// ============================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyCheckin, Humor } from "@/lib/physique/tipos";

const HUMORES: { valor: Humor; label: string; emoji: string }[] = [
  { valor: "otimo", label: "ótimo", emoji: "☼" },
  { valor: "normal", label: "normal", emoji: "○" },
  { valor: "cansado", label: "cansado", emoji: "◐" },
  { valor: "destruido", label: "destruído", emoji: "●" },
];

interface Props {
  inicial: DailyCheckin | null;
  /** Data alvo do check-in (YYYY-MM-DD). Default = hoje. */
  dataAlvo?: string;
  /** Data de hoje ISO. Server-injected — evita usar new Date() no cliente pra
   *  timezone drift. */
  hoje?: string;
  /** Se true, form tá em modo retroativo (data != hoje). */
  retroativo?: boolean;
}

export default function CheckinDailyForm({ inicial, dataAlvo, hoje, retroativo }: Props) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<string | null>(inicial?.criado_em ?? null);
  const [erro, setErro] = useState<string | null>(null);

  const [pesoKg, setPesoKg] = useState<string>(
    inicial?.peso_kg != null ? String(inicial.peso_kg) : "",
  );
  const [sonoH, setSonoH] = useState<string>(
    inicial?.sono_h != null ? String(inicial.sono_h) : "",
  );
  const [sonoQualidade, setSonoQualidade] = useState<number>(inicial?.sono_qualidade ?? 3);
  const [fome, setFome] = useState<number>(inicial?.fome ?? 5);
  const [energia, setEnergia] = useState<number>(inicial?.energia ?? 5);
  const [dor, setDor] = useState<number>(inicial?.dor ?? 0);
  const [stress, setStress] = useState<number>(inicial?.stress ?? 3);
  const [humor, setHumor] = useState<Humor | null>(inicial?.humor ?? null);
  const [treinoPrev, setTreinoPrev] = useState<boolean>(inicial?.treino_previsto ?? false);
  const [tkdPrev, setTkdPrev] = useState<boolean>(inicial?.tkd_previsto ?? false);
  const [dancaPrev, setDancaPrev] = useState<boolean>(inicial?.danca_prevista ?? false);
  const [nota, setNota] = useState<string>(inicial?.nota ?? "");

  const jaExiste = !!inicial;
  const textoBotao = useMemo(() => {
    if (salvando) return "Salvando…";
    if (jaExiste) return "Atualizar";
    return "Salvar";
  }, [salvando, jaExiste]);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "daily",
          data: dataAlvo,
          peso_kg: pesoKg === "" ? null : Number(pesoKg),
          sono_h: sonoH === "" ? null : Number(sonoH),
          sono_qualidade: sonoQualidade,
          fome,
          energia,
          dor,
          stress,
          humor,
          treino_previsto: treinoPrev,
          tkd_previsto: tkdPrev,
          danca_prevista: dancaPrev,
          nota: nota.trim() || null,
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
      {/* v14: seletor de data. Sempre visível, badge quando retroativo. */}
      <div
        style={{
          background: retroativo
            ? "color-mix(in srgb, var(--belt-gold) 12%, var(--surface))"
            : "var(--surface)",
          border: `1px solid ${retroativo ? "var(--belt-gold)" : "var(--hairline)"}`,
          borderRadius: 16,
          padding: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 0.5, textTransform: "uppercase" }}>
            Data
          </div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {retroativo && (
              <span style={{ color: "var(--belt-gold)", fontWeight: 700, marginRight: 6 }}>
                ⏪ Retroativo
              </span>
            )}
            <strong>{dataAlvo ? fmtDataBr(dataAlvo) : "hoje"}</strong>
          </div>
        </div>
        <input
          type="date"
          value={dataAlvo ?? hoje ?? ""}
          max={hoje}
          onChange={(e) => {
            const v = e.target.value;
            const url = v && v !== hoje ? `/checkin?date=${v}` : "/checkin";
            router.push(url);
          }}
          style={{
            padding: "6px 10px",
            background: "var(--ground)",
            color: "var(--ink)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            fontSize: 13,
            colorScheme: "dark",
          }}
        />
      </div>

      <Card titulo="Como tá?" >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {HUMORES.map((h) => (
            <button
              key={h.valor}
              type="button"
              onClick={() => setHumor(h.valor === humor ? null : h.valor)}
              className="btn"
              style={{
                padding: "10px 14px",
                borderColor: humor === h.valor ? "var(--calm)" : "var(--hairline)",
                background: humor === h.valor ? "color-mix(in srgb, var(--calm) 15%, var(--surface))" : "var(--surface)",
              }}
            >
              <span style={{ marginRight: 6 }}>{h.emoji}</span>
              {h.label}
            </button>
          ))}
        </div>
      </Card>

      <Card titulo="Sensações">
        <Slider label="Fome" valor={fome} setValor={setFome} min={0} max={10} baixo="sem" alto="fominha" />
        <Slider label="Energia" valor={energia} setValor={setEnergia} min={0} max={10} baixo="zerado" alto="ligado" />
        <Slider label="Dor" valor={dor} setValor={setDor} min={0} max={10} baixo="nenhuma" alto="pesada" />
        <Slider label="Estresse" valor={stress} setValor={setStress} min={0} max={10} baixo="calmo" alto="apertado" />
      </Card>

      <Card titulo="Sono">
        <div style={{ display: "grid", gap: 10 }}>
          <Field
            label="Horas dormidas"
            valor={sonoH}
            setValor={setSonoH}
            placeholder="ex 7.5"
            sufixo="h"
            step="0.1"
            inputMode="decimal"
          />
          <Slider
            label="Qualidade"
            valor={sonoQualidade}
            setValor={setSonoQualidade}
            min={1}
            max={5}
            baixo="ruim"
            alto="ótima"
          />
        </div>
      </Card>

      <Card titulo="Peso (opcional)">
        <p style={{ margin: "0 0 8px", color: "var(--ink-dim)", fontSize: 12 }}>
          Peso individual é ruído. Rastreamos média móvel. Anota se quiser.
        </p>
        <Field
          label="Peso hoje"
          valor={pesoKg}
          setValor={setPesoKg}
          placeholder="ex 78.4"
          sufixo="kg"
          step="0.1"
          inputMode="decimal"
        />
      </Card>

      <Card titulo="Previsão do dia">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip label="Treino" ativo={treinoPrev} onClick={() => setTreinoPrev((v) => !v)} />
          <Chip label="TKD" ativo={tkdPrev} onClick={() => setTkdPrev((v) => !v)} />
          <Chip label="Dança" ativo={dancaPrev} onClick={() => setDancaPrev((v) => !v)} />
        </div>
      </Card>

      <Card titulo="Nota (opcional)">
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          placeholder="algo mudou? avisa aqui"
          style={{
            width: "100%",
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--hairline)",
            borderRadius: 12,
            padding: "10px 12px",
            fontFamily: "inherit",
            fontSize: 14,
            resize: "vertical",
          }}
        />
      </Card>

      {erro && (
        <div style={{ color: "var(--kihap)", fontSize: 13 }}>Erro: {erro}</div>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="btn btn-primary"
        style={{ padding: "14px", fontSize: 16, marginTop: 4 }}
      >
        {textoBotao}
      </button>

      {salvoEm && !salvando && (
        <p style={{ color: "var(--chama)", fontSize: 13, textAlign: "center", margin: 0 }}>
          Registrado {new Date(salvoEm).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
        </p>
      )}
    </div>
  );
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

function Slider({
  label,
  valor,
  setValor,
  min,
  max,
  baixo,
  alto,
}: {
  label: string;
  valor: number;
  setValor: (n: number) => void;
  min: number;
  max: number;
  baixo: string;
  alto: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <strong style={{ color: "var(--calm)" }}>{valor}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--calm)" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-dim)" }}>
        <span>{baixo}</span>
        <span>{alto}</span>
      </div>
    </div>
  );
}

function Field({
  label,
  valor,
  setValor,
  placeholder,
  sufixo,
  step,
  inputMode,
}: {
  label: string;
  valor: string;
  setValor: (s: string) => void;
  placeholder?: string;
  sufixo?: string;
  step?: string;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
      <span style={{ flex: 1 }}>{label}</span>
      <input
        type="number"
        inputMode={inputMode ?? "decimal"}
        step={step}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
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
      {sufixo && <span style={{ color: "var(--ink-dim)", fontSize: 13, width: 22 }}>{sufixo}</span>}
    </label>
  );
}

function fmtDataBr(iso: string): string {
  // Evita new Date(iso) que parseia como UTC e vira dia anterior no Brasil.
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function Chip({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn"
      style={{
        padding: "8px 14px",
        fontSize: 13,
        borderColor: ativo ? "var(--kihap)" : "var(--hairline)",
        background: ativo ? "color-mix(in srgb, var(--kihap) 15%, var(--surface))" : "var(--surface)",
      }}
    >
      {label}
    </button>
  );
}
