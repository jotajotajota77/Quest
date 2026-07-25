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
import { focoDoMestre } from "@/lib/personagens";
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

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const personagem = await personagemDoDia(user.id);
  if (!personagem) redirect("/hub");

  const [attr, dia, comLog, nevoa, nHoje, spin, semana, nucleo, trackers, finalizado, meta, corpoRecente] =
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
    ]);
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

      {/* Goal dashboard — o coração da home (TRAVA v9). Chama viva (streak)
          embutida no fim do card — v9.2 TRAVA 8 (gamificação da aderência). */}
      <GoalDashboard meta={meta} progresso={progresso} streak={streak} />

      {/* Presença: hero contextual do protagonista do dia. */}
      <ContextualHero
        candidatos={candidatosHero("home", personagem, null)}
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

      <Scoreboard attr={attr} personagem={personagem} />

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
          display: "block",
          textDecoration: "none",
          marginTop: 12,
          borderColor: "var(--kihap)",
        }}
      >
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
      </Link>

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
