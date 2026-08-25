"use client";

// ============================================================
// PhaseDashboard — UI da /phase (PR4, §42, §88).
// ------------------------------------------------------------
// Server component passa fase + target + última decisão. Cliente:
//   - Botão "Reavaliar agora" → POST /api/phase avaliar.
//   - Botões da decisão: Continuar (aceito), Adiar, Ignorar.
//   - "Ver análise" expande signals.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PhysiquePhase } from "@/lib/physique/tipos";
import type { EngineDecisionRow } from "@/lib/physique/data";

interface TargetVigente {
  id: number;
  kcal: number;
  kcal_range_min: number;
  kcal_range_max: number;
  protein_g: number;
  origem: string | null;
}

interface Props {
  fase: PhysiquePhase;
  target: TargetVigente | null;
  decisao: EngineDecisionRow | null;
}

const LABEL_DECISAO: Record<string, { txt: string; cor: string; sub: string }> = {
  keep_course:     { txt: "Continue",         cor: "var(--chama)", sub: "progresso dentro do esperado" },
  small_adjustment:{ txt: "Pequeno ajuste",   cor: "var(--calm)",  sub: "estagnação com alta aderência" },
  recovery:        { txt: "Recovery",         cor: "var(--kihap)", sub: "sinal de que corpo precisa pausa" },
  phase_review:    { txt: "Rever a fase",     cor: "var(--belt-gold)", sub: "alvo próximo — considerar transição" },
  watch:           { txt: "Observando",       cor: "var(--ink-dim)", sub: "dados insuficientes ou sinais mistos" },
  recovery_check:  { txt: "⚠ Recovery check", cor: "var(--kihap)", sub: "guardrail §72 disparou — pausar cutting" },
};

export default function PhaseDashboard({ fase, target, decisao }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [verAnalise, setVerAnalise] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaDec, setUltimaDec] = useState<EngineDecisionRow | null>(decisao);

  async function reavaliar() {
    setOcupado(true);
    setErro(null);
    try {
      const res = await fetch("/api/phase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "avaliar" }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j?.error ?? "falha");
      } else {
        const r = j.resultado as {
          decision: EngineDecisionRow["decision"];
          reason: string;
          confidence: number;
          signals: EngineDecisionRow["signals"];
        };
        setUltimaDec({
          id: j.decisaoId ?? 0,
          criado_em: new Date().toISOString(),
          decision: r.decision,
          reason: r.reason ?? "",
          confidence: r.confidence,
          signals: r.signals,
          aceito: "pendente",
          decidido_em: null,
        });
        router.refresh();
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro de rede");
    } finally {
      setOcupado(false);
    }
  }

  async function decidir(aceito: "aceito" | "adiado" | "ignorado") {
    if (!ultimaDec) return;
    setOcupado(true);
    setErro(null);
    try {
      const res = await fetch("/api/phase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "decidir", id: ultimaDec.id, aceito }),
      });
      const j = await res.json();
      if (!res.ok) setErro(j?.error ?? "falha");
      else {
        setUltimaDec({ ...ultimaDec, aceito, decidido_em: new Date().toISOString() });
        router.refresh();
      }
    } finally {
      setOcupado(false);
    }
  }

  const label = ultimaDec ? LABEL_DECISAO[ultimaDec.decision] : null;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={cardStyle}>
        <h2 style={h2Style}>Fase atual</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <strong style={{ fontSize: 20 }}>{fase.type.toUpperCase()}</strong>
          <span style={{ color: "var(--ink-dim)", fontSize: 13 }}>
            desde {fmtData(fase.started_at)}
          </span>
        </div>
        {fase.goal_description && (
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink-dim)" }}>
            {fase.goal_description}
          </p>
        )}
      </section>

      {target && (
        <section style={cardStyle}>
          <h2 style={h2Style}>Target ativo</h2>
          <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
            <Linha
              label="Calorias"
              valor={`${target.kcal} kcal`}
              sub={`faixa ${target.kcal_range_min}–${target.kcal_range_max}`}
            />
            <Linha
              label="Proteína"
              valor={`${target.protein_g} g/dia`}
            />
            {fase.calorie_target_min_floor && (
              <Linha
                label="Piso §72"
                valor={`${fase.calorie_target_min_floor} kcal`}
                sub="engine nunca sugere abaixo disso"
              />
            )}
          </div>
        </section>
      )}

      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={h2Style}>Última decisão</h2>
          <button
            className="btn"
            style={{ padding: "6px 12px", fontSize: 12 }}
            disabled={ocupado}
            onClick={reavaliar}
          >
            {ocupado ? "…" : "Reavaliar agora"}
          </button>
        </div>

        {!ultimaDec && (
          <p style={{ color: "var(--ink-dim)", fontSize: 13 }}>
            Sem avaliação ainda. Toque em <strong>Reavaliar agora</strong> pra
            rodar o engine.
          </p>
        )}

        {ultimaDec && label && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                padding: 12,
                background: "var(--ground)",
                borderLeft: `4px solid ${label.cor}`,
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ color: label.cor, fontSize: 16 }}>{label.txt}</strong>
                <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                  confiança {(Number(ultimaDec.confidence ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-dim)" }}>
                {label.sub}
              </p>
              {ultimaDec.reason && (
                <p style={{ margin: "8px 0 0", fontSize: 13 }}>{ultimaDec.reason}</p>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                style={{ padding: "10px 14px", fontSize: 13 }}
                disabled={ocupado || ultimaDec.aceito !== "pendente"}
                onClick={() => decidir("aceito")}
              >
                {ultimaDec.aceito === "aceito" ? "✓ aceito" : "Continuar"}
              </button>
              <button
                className="btn"
                style={{ padding: "10px 14px", fontSize: 13 }}
                onClick={() => setVerAnalise((v) => !v)}
              >
                {verAnalise ? "ocultar análise" : "Ver análise"}
              </button>
              <button
                className="btn"
                style={{ padding: "10px 14px", fontSize: 13 }}
                disabled={ocupado || ultimaDec.aceito !== "pendente"}
                onClick={() => decidir("adiado")}
              >
                {ultimaDec.aceito === "adiado" ? "⏰ adiado" : "Adiar"}
              </button>
              <button
                className="btn"
                style={{ padding: "10px 14px", fontSize: 13, color: "var(--ink-dim)" }}
                disabled={ocupado || ultimaDec.aceito !== "pendente"}
                onClick={() => decidir("ignorado")}
              >
                Ignorar
              </button>
            </div>

            {verAnalise && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--ink-dim)" }}>
                  Signals
                </h3>
                <SinaisTable signals={ultimaDec.signals} />
              </div>
            )}

            <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--ink-dim)" }}>
              avaliada em {new Date(ultimaDec.criado_em).toLocaleString("pt-BR")}
            </p>
          </div>
        )}
      </section>

      {erro && <div style={{ color: "var(--kihap)", fontSize: 13 }}>Erro: {erro}</div>}
    </div>
  );
}

function Linha({ label, valor, sub }: { label: string; valor: string; sub?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ color: "var(--ink-dim)" }}>{label}</span>
      <span>
        <strong>{valor}</strong>
        {sub && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--ink-dim)" }}>{sub}</span>}
      </span>
    </div>
  );
}

function SinaisTable({ signals }: { signals: EngineDecisionRow["signals"] }) {
  const s = signals as unknown as Record<string, number | null>;
  const fmt = (v: number | null | undefined, suf = "") =>
    v == null ? "–" : `${typeof v === "number" ? v.toFixed(2).replace(/\.00$/, "") : v}${suf}`;
  return (
    <div style={{ display: "grid", gap: 4, fontSize: 12, background: "var(--ground)", padding: 10, borderRadius: 8 }}>
      <SinalRow k="perda/sem" v={fmt(s.s_perda_pct, "%")} />
      <SinalRow k="cintura Δ" v={fmt(s.s_cintura_delta_cm, " cm")} />
      <SinalRow k="performance Δ" v={fmt(s.s_perf_pct, "%")} />
      <SinalRow k="sono médio" v={fmt(s.s_sono_h, " h")} />
      <SinalRow k="fome média" v={fmt(s.s_fome, "/10")} />
      <SinalRow k="aderência" v={fmt(s.s_aderencia_pct, "%")} />
      <SinalRow k="dias na fase" v={fmt(s.dias_na_fase)} />
      <SinalRow k="kcal target" v={fmt(s.kcal_target_atual)} />
      <SinalRow k="piso §72" v={fmt(s.kcal_min_floor)} />
    </div>
  );
}

function SinalRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--ink-dim)" }}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

function fmtData(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--hairline)",
  borderRadius: 16,
  padding: 14,
};

const h2Style: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 14,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "var(--ink-dim)",
};
