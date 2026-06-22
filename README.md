# Quest — RPG comportamental (app completo)

App de hábitos gamificado estilo RPG, single-user. **Quatro comportamentos**
rastreados, cada um com seu atributo, sua aba e seu personagem; os quatro
atributos alimentam um **Elo único**. Stack: **Next.js (App Router) + Supabase
(Postgres + Auth + RLS) + Spotify Web Playback SDK**, deploy Vercel, TypeScript.

| Aba | Comportamento | Atributo | Personagem (protagonista → +25%) |
|---|---|---|---|
| Treino | treino de força | Força | Zyan Polska · Iron Core |
| Nutri | refeição + água | Stamina | Kai Ryuen · Cardio Knight |
| Leitura | leitura | Sabedoria | Dhavos Tavera · Beast Warden |
| Dança | dança/coreografia | Destreza | Luan Santos · Dance Magician |

---

## A viga do projeto: assimetria de reforço (TRAVA 2)

Completo ≠ uniforme. Cada comportamento recebe o que a função dele exige. Não há
motor único — a assimetria vive em `src/lib/comportamentos.ts` (`FAMILIAS`).

- **Camada universal (todos):** log 1-toque + hit-confirm sensorial **local**
  (som/animação, sem rede) + atributo/XP → Elo.
- **Motor de instalação (só Nutri):** Spotify-CRF nova-no-sistema + **fading**
  reversível por desempenho + **porteiro de robustez armado**.
- **Treino / Leitura:** só camada universal (não desperdiça reforço / não
  pareia música com leitura).
- **Dança:** universal + Spotify como **trilha** da atividade (não esmaecível).

## Espinha do loop diário (v2)

A versão anterior tinha muita feature e pouco loop. A v2 prioriza a **espinha**:

- **Tier ladder** (`engine/tier.ts`) — 10 bases × 4 divisões (E-IV → SSR+-I),
  XP total → rank com progresso na home (substitui o "elo" vago).
- **Voz contextual** (`lib/voz.ts`) — o protagonista do dia fala na home;
  muda por streak / tempo fora / hora; **retorno sem julgamento** após ausência.
- **Modo névoa** (`components/FogButton`, `api/fog`, tabela `dias`) — "⊘ Não
  consigo hoje": preserva o streak, muda a voz, e é **neutro ao fading**
  (dias de névoa saem da janela de latência e da prova de robustez).
- **Streak emocional** (`engine/streak.ts`) — névoa não quebra.
- **Daily spin** (`components/DailySpin`, `api/spin`, tabela `daily_spin`) —
  reforço de razão variável autocontido, 1×/dia.
- **Foco do dia** — uma coisa (anti-paralisia): a âncora é a Nutri.
- **Schema forward-compat** — `logs` com macros nullable (coach futuro);
  tabelas `treino_*` prontas para o módulo de treino rico (próxima leva).

## TRAVAs e onde vivem

| TRAVA | Onde |
|---|---|
| Sistema lê, não interroga (1-toque, métricas passivas) | `logs` (timestamp), view `vw_logs_latencia`, `engine/latency.ts` |
| Assimetria de reforço | `lib/comportamentos.ts`, `app/api/log/route.ts` |
| Elo único + bônus aditivo +25% | `engine/reinforcement.ts`, `engine/bonus.ts` (todos os 4 vivos) |
| Hub estilo luta (rosto→corpo→confirma), 4 livres | `app/hub`, `components/CharacterSelect.tsx` |
| Spotify + fallback + fading (só Nutri) | `spotify/*`, `engine/fading.ts` |
| Porteiro de robustez **armado** (lê outras abas) | `engine/gates.ts` + `data.ts::sinalRobustez` |
| Aba-espelho passiva e enterrada | `app/espelho` (convocação DESARMADA em `gates.ts`) |

## Porteiro de robustez (TRAVA 5, armado)

Antes de **rarear** (down-shift) o esquema da dieta, exige prova de que a dieta
sobreviveu a um **dia ruim natural** — lido das perturbações das outras abas
(`data.ts::sinalRobustez`, janela de 21 dias). Re-adensar nunca é travado.

## Assets dos personagens

Caminhos esperados em `public/personagens/<slug>/{rosto,corpo}.png` (ver
`public/personagens/README.md`). Enquanto faltarem, a UI cai num placeholder de
inicial sem quebrar. Slugs: `zyan-polska`, `kai-ryuen`, `luan-santos`,
`dhavos-tavera`.

---

## Setup

```bash
npm install
cp .env.example .env.local   # Supabase + Spotify
npm run dev                  # http://localhost:3000
```

1. **Supabase:** rode `supabase/migrations/0001_init.sql` e depois
   `0002_app_completo.sql` no SQL Editor. Auth por e-mail+senha (desligue
   "Confirm email" em Authentication → Providers → Email).
2. **Spotify (opcional, só Nutri/Dança):** app no dashboard + Redirect URI
   `<APP_URL>/api/spotify/callback`. Requer Premium para o Web Playback SDK.

```bash
npm run build      # produção
npm run typecheck  # tsc --noEmit
```

## Afinamento futuro (estrutura pronta, motor desligado)

Reforçador próprio da Leitura (engine de schedule já é por-comportamento),
efeitos temáticos dos bônus além do +25%, curva de maestria da Dança, e a
convocação da aba-espelho (gancho desarmado).
