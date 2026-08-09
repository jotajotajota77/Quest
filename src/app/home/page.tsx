// ============================================================
// Home / dashboard — a ESPINHA do loop diário (v9).
// ------------------------------------------------------------
// O GOAL DASHBOARD (cutting 17,8%→13% BF até 09/09) é o coração da home.
// Alta frequência: tier + progresso + 2 atributos + VOZ contextual do
// protagonista + FOCO do dia (o treino do split de hoje, anti-paralisia) +
// DAILY SPIN + entrada do MODO NÉVOA. O registro 1-toque vive nas abas; o
// corpo real detalhado fica no Espelho (TRAVA de exposição) — só um resumo
// curto do goal aparece aqui.
// ============================================================
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  avatarJogador,
  diaDeHoje,
  diaFinalizado,
  diasComLogSet,
  diasNevoaSet,
  familiasLogadasHoje,
  garantirAtributos,
  garantirMeta,
  corpoRealRecente,
  personagemDoDia,
  registrosHoje,
  spinDeHoje,
  hojeISO,
  logs7Dias,
  trackersHoje,
  avaliarQuests,
} from "@/lib/data";
import ProtocoloCard from "@/components/ProtocoloCard";
import FinalizarDiaButton from "@/components/FinalizarDiaButton";
import QuestsCard from "@/components/QuestsCard";
import ResetHistoricoButton from "@/components/ResetHistoricoButton";
import GoalDashboard from "@/components/GoalDashboard";
import AppHeader from "@/components/AppHeader";
import { analisarSemana } from "@/lib/analise";
import { progressoMeta } from "@/lib/engine/meta";
import { splitDeHoje } from "@/lib/treino";
import { focoDoMestre, imagemPose, poseParaDominio } from "@/lib/personagens";
import CharacterImage from "@/components/CharacterImage";
import { trackersFeitos } from "@/lib/protocolo";
import { streakDetalhado } from "@/lib/engine/streak";
import { mensagemContextual } from "@/lib/voz";
import Scoreboard from "@/components/Scoreboard";
import BottomNav from "@/components/BottomNav";
import ContextualHero from "@/components/ContextualHero";
import { candidatosHero } from "@/lib/heroi";
import { dicaDoDia } from "@/lib/dicas";
import FogButton from "@/components/FogButton";
import DailySpin from "@/components/DailySpin";
import AtoHeader from "@/components/AtoHeader";
import BossBattle from "@/components/BossBattle";
import { atoAtual } from "@/lib/ato";
import { bossProgressoDaSemana } from "@/lib/data";
import { rosterDesbloqueado } from "@/lib/data";
import { carregarAtributosV2, seasonDoJogador } from "@/lib/data";
import SeasonBadge from "@/components/SeasonBadge";
import AtributosCard from "@/components/AtributosCard";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const personagem = await personagemDoDia(user.id);
  if (!personagem) redirect("/hub");

  const [attr, dia, comLog, nevoa, nHoje, spin, semana, nucleo, trackers, finalizado, meta, corpoRecente, sanha, bossProg, roster] =
    await Promise.all([
      garantirAtributos(user.id),
      diaDeHoje(user.id),
      diasComLogSet(user.id),
      diasNevoaSet(user.id),
      registrosHoje(user.id),
      spinDeHoje(user.id),
      logs7Dias(user.id).then(analisarSemana),
      familiasLogadasHoje(user.id),
      trackersHoje(user.id),
      diaFinalizado(user.id),
      garantirMeta(user.id),
      corpoRealRecente(user.id, 21),
      // v10.2: Sanha (avatar) carregado inteiro — usado no hero, no dojang duo
      // (TKD) e como fallback de todas as abas.
      avatarJogador(),
      // v11.3: boss da semana + roster pra achar o mestre-boss.
      bossProgressoDaSemana(user.id),
      rosterDesbloqueado(),
    ]);
  // v12: season + atributos v2 (5 eixos + build)
  const [season, atributosV2] = await Promise.all([
    seasonDoJogador(user.id),
    carregarAtributosV2(user.id),
  ]);
  const bossMestre = roster.find((p) => p.slug === bossProg.boss.mestre_slug) ?? null;
  const ato = atoAtual(hojeISO());
  const progresso = progressoMeta(meta, corpoRecente);
  const splitHoje = splitDeHoje();
  // v10: foco do dia derivado do domínio do mestre escolhido no hub.
  //   O split do Apêndice A vira contexto secundário (mostrado na linha de baixo).
  const foco = focoDoMestre(personagem);

  const quests = await avaliarQuests(user.id, {
    nucleo,
    trackersFeitos: trackersFeitos(trackers),
    aguaCount: trackers.agua_count,
    registrosHoje: nHoje,
  });

  const streak = streakDetalhado(hojeISO(), comLog, nevoa);
  const voz = mensagemContextual({
    personagem,
    streak,
    fogHoje: dia.fog_mode,
    hora: new Date().getHours(),
    registrosHoje: nHoje,
  });

  return (
    <main className="app-shell">
      {/* v10 direção D+A: mark do app + belt-bar TKD no topo. */}
      <AppHeader />

      {/* v12: Season/era atual do jogador. */}
      <SeasonBadge season={season} />

      {/* v11.3 RPG: Ato atual (narrativa do cutting) + Boss da semana */}
      <AtoHeader ato={ato} hojeISO={hojeISO()} />
      <BossBattle progresso={bossProg} mestre={bossMestre} />

      {/* Goal dashboard — o coração da home (TRAVA v9). Chama viva (streak)
          embutida no fim do card — v9.2 TRAVA 8 (gamificação da aderência). */}
      <GoalDashboard meta={meta} progresso={progresso} streak={streak} mestre={personagem} />

      {/* Presença: hero contextual do protagonista do dia. v10.2: pose escolhida
          pelo DOMÍNIO do mestre (treino / palco / kihap) — cai no corpo/rosto
          se o arquivo não existir. */}
      <ContextualHero
        candidatos={candidatosHero("home", personagem, sanha)}
        nome={personagem.nome}
        titulo={personagem.titulo}
        dica={dicaDoDia("home", hojeISO())}
        altura={220}
      />

      {/* Voz contextual / body-doubling — o protagonista fala. */}
      <div
        className="panel"
        style={{
          marginBottom: 16,
          borderLeft: "3px solid var(--neon)",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "1.4rem" }}>🗨️</div>
        <div>
          <div className="lbl">{personagem.nome}</div>
          <div>{voz}</div>
        </div>
      </div>

      <Scoreboard attr={attr} personagem={personagem} sanha={sanha} />

      {/* v12: 5-eixos atributo + build + shards */}
      <AtributosCard atributos={atributosV2} build={atributosV2.build} />

      {/* Streak vive no GoalDashboard como Chama Viva. Botões de lore antigos
          (Mundo VHYX / Lore do personagem) foram removidos na v10.1 — a
          personalização agora é a faixa canônica de cada mestre. */}

      {/* Foco do dia — UMA coisa (anti-paralisia). v10: o DOMÍNIO do mestre
          escolhido no hub direciona o dia (braços, core, pernas, dança ou
          taekwondo). O split do Apêndice A fica como contexto secundário. */}
      <Link
        href={foco.href}
        className="panel"
        style={{
          display: "flex",
          gap: 12,
          textDecoration: "none",
          marginTop: 12,
          borderColor: "var(--kihap)",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 10,
            overflow: "hidden",
            flexShrink: 0,
            background: "linear-gradient(160deg, var(--lilac), var(--surface))",
            border: "1px solid var(--hairline)",
          }}
        >
          <CharacterImage
            src={imagemPose(personagem.slug, poseParaDominio(personagem.dominio))}
            nome={personagem.nome}
            className="roster-face"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lbl">Foco de hoje · com {personagem.nome}</div>
        <div style={{ fontWeight: 800, marginTop: 4, fontSize: "1.05rem" }}>
          {foco.titulo}
        </div>
        <div className="subtle" style={{ marginTop: 2 }}>
          {foco.descricao}
        </div>
        <div
          className="subtle"
          style={{ marginTop: 8, fontSize: "0.72rem", opacity: 0.7 }}
        >
          contexto do dia · {splitHoje.dia} — {splitHoje.label} (Apêndice A)
        </div>
        </div>
      </Link>

      {/* v10.2: quando TKD é o foco, aparece o "Dojang" — mestre + Sanha lado a
          lado em pose de sparring. Presença dupla no dia de taekwondo. */}
      {personagem.dominio === "taekwondo" && sanha && (
        <div
          className="panel"
          style={{
            marginTop: 10,
            display: "grid",
            gap: 8,
            borderLeft: "3px solid var(--kihap)",
          }}
        >
          <div className="lbl">Dojang · sparring do dia</div>
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
                  src={imagemPose(personagem.slug, "sparring")}
                  nome={personagem.nome}
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
                {personagem.nome} · sabum
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

      {/* Protocolo diário — quick-log de tracking (núcleo + trackers leves). */}
      <ProtocoloCard nucleoInicial={[...nucleo]} trackersInicial={trackers} />

      {/* Quests / sidequests — camada VR secundária. */}
      <QuestsCard quests={quests} />

      <DailySpin
        recompensaInicial={
          spin ? { tipo: String(spin.tipo), rotulo: String(spin.rotulo) } : null
        }
      />

      {/* Analisador semanal (passivo) — sugere o foco da próxima semana. */}
      {semana.total > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="lbl">Analisador da semana</div>
          <div className="subtle" style={{ marginTop: 4 }}>
            {semana.sugestao}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <FogButton jaEhNevoa={dia.fog_mode} />
      </div>

      <FinalizarDiaButton finalizado={finalizado} />

      <ResetHistoricoButton />

      <BottomNav />
    </main>
  );
}
