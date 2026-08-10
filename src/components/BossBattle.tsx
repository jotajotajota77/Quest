// ============================================================
// BossBattle — card RPG do boss da semana. Mostra HP restante em barra,
// contadores por meta (séries/TKD/dança/nutri) e o arco narrativo do boss.
// v11.3.
// ============================================================
import type { BossProgresso } from "@/lib/boss";
import type { Personagem } from "@/lib/types";
import { posesCascata } from "@/lib/personagens";
import CharacterImage from "@/components/CharacterImage";
import type { BossEstadoDB } from "@/lib/engine/boss_persistente";
import {
  XP_RECOMPENSA_BOSS,
  SHARDS_BONUS_BOSS,
} from "@/lib/engine/boss_persistente";
import { photocardPorId } from "@/lib/photocards";

// v12 PR3: label curto do personagem pra recompensa do drop.
const LABEL_PERSONAGEM: Record<string, string> = {
  "ryuki-han":     "Ryuki",
  "ji-seok-moon":  "Ji-seok",
  "hujin-kim":     "Hujin",
  "sanhee-park":   "Sanhee",
  "chan-ho-lee":   "Chan-ho",
  "sanha":         "Sanha",
};

export default function BossBattle({
  progresso,
  mestre,
  estado,
}: {
  progresso: BossProgresso;
  mestre: Personagem | null;
  estado?: BossEstadoDB | null;
}) {
  const { boss, hp_restante, pct_hp, derrotado } = progresso;
  const cor = derrotado ? "var(--good)" : boss.cor_tema;

  // v12 PR3: descrição real da recompensa (XP + shards + photocard dropada).
  // Antes de derrotar: mostra o QUE se ganhará. Depois: mostra o QUE foi ganho.
  const dropId = estado?.photocard_drop_id ?? null;
  const drop = dropId ? photocardPorId(dropId) : null;
  const recompensaTexto = (() => {
    const partes = [
      `+${XP_RECOMPENSA_BOSS} XP`,
      `+${SHARDS_BONUS_BOSS} shards`,
    ];
    if (derrotado && drop) {
      const nome = LABEL_PERSONAGEM[drop.personagem] ?? drop.personagem;
      partes.push(`photocard ${nome} (${drop.raridade})`);
    } else if (!derrotado) {
      partes.push("photocard da season");
    }
    return partes.join(" + ");
  })();

  return (
    <div
      className="panel"
      style={{
        marginBottom: 16,
        padding: 14,
        borderLeft: `4px solid ${cor}`,
        background: `color-mix(in srgb, ${cor} 6%, var(--surface))`,
      }}
    >
      {/* Header — boss + HP bar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {mestre && (
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              border: `2px solid ${cor}`,
              background: "linear-gradient(160deg, var(--lilac), var(--surface))",
            }}
          >
            <CharacterImage
              srcs={posesCascata(mestre.slug, "vitoria")}
              nome={mestre.nome}
              className="roster-face"
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="lbl"
            style={{
              color: cor,
              letterSpacing: "0.12em",
              fontSize: "0.66rem",
            }}
          >
            ⚔️ BOSS DA SEMANA
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
            {boss.emoji} {boss.nome_boss}
          </div>
        </div>
        {derrotado && (
          <span
            className="pr-badge"
            style={{
              color: "var(--good)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              fontWeight: 800,
            }}
          >
            DERROTADO
          </span>
        )}
      </div>

      {/* HP bar */}
      <div
        className="xp-bar"
        style={{
          marginTop: 10,
          background: "color-mix(in srgb, var(--panel-border) 60%, transparent)",
        }}
      >
        <div
          className="xp-fill"
          style={{
            width: `${100 - pct_hp}%`,
            background: derrotado ? "var(--good)" : cor,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div
        className="subtle"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          marginTop: 4,
        }}
      >
        HP {hp_restante}/{boss.hp_total} · dano{" "}
        {Math.round(((boss.hp_total - hp_restante) / boss.hp_total) * 100)}%
      </div>

      {/* Metas — 4 chips com contador */}
      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
        }}
      >
        <MetaChip
          icon="🏋️"
          label="séries"
          atual={progresso.series_feitas}
          alvo={boss.metas.series}
        />
        <MetaChip
          icon="🥋"
          label="TKD"
          atual={progresso.tkd_feitas}
          alvo={boss.metas.tkd}
        />
        <MetaChip
          icon="💃"
          label="dança"
          atual={progresso.danca_feitas}
          alvo={boss.metas.danca}
        />
        <MetaChip
          icon="🍎"
          label="nutri"
          atual={progresso.nutri_feitas}
          alvo={boss.metas.nutri}
        />
      </div>

      {/* Arco narrativo */}
      <p
        className="subtle"
        style={{
          marginTop: 10,
          fontSize: "0.75rem",
          fontStyle: "italic",
          lineHeight: 1.4,
        }}
      >
        &quot;{boss.arco}&quot;
      </p>

      {/* Recompensa */}
      <div
        style={{
          marginTop: 8,
          fontSize: "0.72rem",
          color: "var(--gold)",
          fontWeight: 700,
        }}
      >
        {derrotado ? "✓ Recompensa creditada: " : "Recompensa: "}
        {recompensaTexto}
      </div>
    </div>
  );
}

function MetaChip({
  icon,
  label,
  atual,
  alvo,
}: {
  icon: string;
  label: string;
  atual: number;
  alvo: number;
}) {
  const completo = atual >= alvo;
  return (
    <div
      style={{
        textAlign: "center",
        padding: "6px 4px",
        borderRadius: 8,
        border: `1px solid ${completo ? "var(--good)" : "var(--hairline)"}`,
        background: completo
          ? "color-mix(in srgb, var(--good) 8%, transparent)"
          : "transparent",
      }}
    >
      <div style={{ fontSize: "1rem" }}>{icon}</div>
      <div
        style={{
          fontWeight: 800,
          fontSize: "0.85rem",
          color: completo ? "var(--good)" : "var(--text)",
        }}
      >
        {atual}/{alvo}
      </div>
      <div
        className="subtle"
        style={{
          fontSize: "0.6rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
