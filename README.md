# Quest — V1 (RPG comportamental)

App pessoal, single-user, que instala o comportamento-alvo frágil **registrar
dieta/hidratação** num usuário com TDAH, usando **música como reforçador** e uma
**casca de RPG completa** (não é um logger pelado). O V1 prova **uma** hipótese: o
motor de reforço instala o comportamento. Só o **motor da dieta** está construído;
treino/leitura/dança são V2 — o código já nasce extensível para eles.

Stack: **Next.js (App Router) + Supabase (Postgres + Auth) + Spotify Web Playback
SDK**, deploy Vercel. TypeScript.

---

## As TRAVAs (restrições de arquitetura comportamental) e onde vivem

> Violar uma TRAVA quebra o propósito do app, não só o código.

| TRAVA | Onde está garantida |
|---|---|
| **O sistema lê, não interroga** — registrar é 1 toque; métricas passivas derivadas do timestamp | `logs_dieta` (só timestamp+tipo), view `vw_logs_dieta_latencia`, `engine/latency.ts`. Único input extra: a aba-espelho. |
| **Hub primeiro (estilo tela de luta)** — rosto → corpo → confirma, seleção 100% livre | `app/hub`, `components/CharacterSelect.tsx`. Pós-login sempre cai no `/hub`. |
| **Progressão ÚNICA do usuário** — personagens são lentes, nunca barras separadas | tabela `atributos` (1 linha/usuário), `eloDeXp`/`xpParaElo` em `engine/reinforcement.ts`. |
| **Bônus ADITIVO sobre base protegida** — `ganho = base_protegida + bonus_se_aplicável`; base roda sempre | `engine/reinforcement.ts` (`calcularGanho`), `engine/bonus.ts`. Escolher outro personagem não reduz a dieta. |
| **Reforço local nunca cai a zero** — hit-confirm sensorial independe de rede | `components/HitConfirm.tsx` (WebAudio sintetizado, zero asset), disparado no toque antes de qualquer fetch. |
| **Spotify com fallback** — faixa cheia é bônus por cima; falha → hit-confirm + fila | `lib/spotify/playback.ts` (retorna bool), `components/LogButton.tsx`, `api/spotify/mark-played`. |
| **Nova-no-sistema** por histórico interno, não data de lançamento | `lib/spotify/new-in-system.ts` + `historico_reforco`. |
| **Fading por desempenho, reversível** — latência+variabilidade, re-adensa se cai | `engine/fading.ts` (`decidirFading`), `engine/latency.ts`, tabela `schedule_state`. Nunca usa calendário. |
| **Atributo é placar, não medida de saúde** | Stamina sobe por registro; sem validador de resultado. |
| **Aba-espelho passiva e enterrada** | `app/espelho` só abre por clique; fora da home/hub; nada convoca. |
| **Ganchos desarmados** | `engine/gates.ts`: `CONVOCACAO_MIRROR_ATIVA=false`, `PORTEIRO_ROBUSTEZ_ATIVO=false`. Ativação ≈ 1 flag no V2. |

---

## O loop central (coração do V1)

1. Toque em **Registrar refeição / Água** (`components/LogButton.tsx`).
2. **Hit-confirm local dispara JÁ** (som+animação, sem rede) — piso do reforço.
3. `POST /api/log`: grava o log → calcula `base + bônus` → aplica à progressão
   única → reavalia o fading → decide se este registro toca música.
4. Se música: tenta a **faixa cheia** via Web Playback SDK. Sucesso →
   `faixa_cheia` (sai do nova-no-sistema). Falha → `fallback_local` (faixa segue
   inédita, na fila). O passo 2 já garantiu o reforço.

---

## Modelo de dados

Migration: `supabase/migrations/0001_init.sql`. Tabelas: `atributos`,
`personagens`, `selecao_diaria`, `logs_dieta`, `schedule_state`,
`historico_reforco`, `corpo_real`, `spotify_tokens`. View de latência derivada.
**RLS ligado em tudo** (own-row), `personagens` é roster com leitura para
autenticados. Seed: 1 personagem placeholder de Stamina (bônus aditivo +5).

---

## Setup

```bash
npm install
cp .env.example .env.local   # preencha Supabase + Spotify
```

1. **Supabase**: crie o projeto, rode a migration (`supabase db push` ou cole o
   SQL no editor), copie URL + anon key para `.env.local`. Auth por magic link.
2. **Spotify**: crie um app no dashboard, configure o Redirect URI
   (`<APP_URL>/api/spotify/callback`), copie client id/secret. Requer **Premium**
   para o Web Playback SDK.
3. `npm run dev` → abra, faça login, selecione o personagem no hub, registre.

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run typecheck  # tsc --noEmit
```

Deploy: Vercel (defina as mesmas env vars e o Redirect URI de produção).

---

## O que é V2 (não construído; ganchos prontos)

Treino/leitura/dança e seus atributos; bônus dos demais personagens; roster real +
arte/lore; coreografia-reforçador; jackpot de comeback; YouTube; **convocação da
aba-espelho** (gancho desarmado em `gates.ts`); **porteiro de robustez do fading**
(gancho desarmado em `gates.ts`). O código está aberto a essas extensões — a
engine de bônus e o fading já são genéricos; basta marcar `ativo` os personagens e
ligar as flags.
```
