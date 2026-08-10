// v12: Training Raid overlay — camada RPG sobre o TrainingModule.
// Cada split vira um boss fight; séries planejadas = HP; séries feitas = dano.
// Puramente derivado do plano + séries de hoje; sem storage novo.
"use client";

import { useMemo } from "react";
import type { TreinoExercicio, TreinoSerie } from "@/lib/types";
import { DOW_TO_SPLIT_KEY, LABEL_PROGRAMA_SPLIT } from "@/lib/programa";
import { SPLIT_LABEL } from "@/lib/treino";

interface Props {
  plano: TreinoExercicio[];
  seriesHoje: TreinoSerie[];
}

/** Boss thematizado por split — nome + emoji + cor. */
const BOSS_POR_SPLIT: Record<string, { nome: string; emoji: string; cor: string }> = {
  prog_seg_pull:      { nome: "Back Warden",        emoji: "🌿", cor: "var(--calm)" },
  prog_ter_push:      { nome: "Chest Guardian",     emoji: "🫁", cor: "var(--neon-2)" },
  prog_qua_lower:     { nome: "Iron Legs",          emoji: "🦵", cor: "var(--gold)" },
  prog_qui_upper:     { nome: "Upper Colossus",     emoji: "💪", cor: "var(--neon)" },
  prog_sex_full:      { nome: "Full Body Titan",    emoji: "⚔️", cor: "var(--kihap)" },
  core_cardio:        { nome: "Core Ronin",         emoji: "🔥", cor: "var(--lilac)" },
};

const HP_POR_SERIE_PLANEJADA = 20;
const HP_DEFAULT_SPLIT = 200;

export default function TrainingRaid({ plano, seriesHoje }: Props) {
  const splitHoje = DOW_TO_SPLIT_KEY[new Date().getDay()];

  const { hpTotal, danoAtual, exerciciosDoSplit, seriesFeitas, bossMeta } = useMemo(() => {
    const exs = plano.filter((e) => (e.split ?? "—") === splitHoje);
    const bossM = BOSS_POR_SPLIT[splitHoje ?? ""] ?? {
      nome: LABEL_PROGRAMA_SPLIT[splitHoje as never] ??
        SPLIT_LABEL[splitHoje ?? ""] ??
        "Boss do dia",
      emoji: "⚔️",
      cor: "var(--kihap)",
    };
    // HP = 3 séries por exercício × 20; padrão 200 se sem plano.
    const planejadas = exs.length > 0 ? exs.length * 3 : 0;
    const hp = planejadas * HP_POR_SERIE_PLANEJADA || HP_DEFAULT_SPLIT;
    const nomesDoSplit = new Set(exs.map((e) => e.nome.toLowerCase()));
    const feitas = seriesHoje.filter((s) =>
      nomesDoSplit.size === 0 || nomesDoSplit.has(s.nome.toLowerCase()),
    );
    // Cada série feita causa 15-25 dano (proporcional a peso/reps; simples aqui = 20)
    const dano = feitas.length * 20;
    return {
      hpTotal: hp,
      danoAtual: Math.min(hp, dano),
      exerciciosDoSplit: exs,
      seriesFeitas: feitas.length,
      bossMeta: bossM,
    };
  }, [plano, seriesHoje, splitHoje]);

  if (exerciciosDoSplit.length === 0) return null;

  const derrotado = danoAtual >= hpTotal;
  const pct = Math.min(100, (danoAtual / hpTotal) * 100);

  return (
    <div
      className="panel"
      style={{
        marginTop: 12,
        marginBottom: 12,
        display: "grid",
        gap: 8,
        borderLeft: `3px solid ${bossMeta.cor}`,
        background: derrotado
          ? "linear-gradient(120deg, rgba(0,255,150,0.05), transparent)"
          : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <div>
          <span
            className="subtle"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginRight: 8,
            }}
          >
            {derrotado ? "boss defeated" : "training raid"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 800,
            }}
          >
            {bossMeta.emoji} {bossMeta.nome}
          </span>
        </div>
        <span
          className="subtle"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}
        >
          {seriesFeitas} séries · {Math.max(0, hpTotal - danoAtual)} HP
        </span>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 6,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: derrotado
              ? "linear-gradient(90deg, var(--good), var(--neon))"
              : `linear-gradient(90deg, ${bossMeta.cor}, var(--gold))`,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      <p
        className="subtle"
        style={{
          margin: 0,
          fontSize: "0.7rem",
          fontStyle: "italic",
        }}
      >
        {derrotado
          ? "완벽! Split fechado — sessão libera +30 XP + shard e desce HP no boss semanal."
          : `Cada série registrada = ~20 dano local. Fechar o split desce o boss da semana e libera drop.`}
      </p>
    </div>
  );
}
