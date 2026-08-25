# Adaptive Physique RPG — plano de evolução do QUEST

**Status:** planejamento antes de implementação (§118 da spec).
**Regra-mãe:** preservar tudo que existe. Nenhum reset, nenhuma perda de XP,
mastery, coleção, Saber, personagens ou faixa. Evolução aditiva.

---

## A. AUDIT — estado real do repositório

### A.1 Schema existente (37 tabelas, 30 migrations até 0030)

**Núcleo de reforçamento (não mexer):**
- `logs`, `logs_dieta`, `logs_danca`, `logs_tkd`, `logs_aquecimento`
  · `historico_reforco`
- `atributos` (forca/stamina/potencia/resistencia/mobilidade/tecnica/shards/xp)
- `progresso_dominio` (upper/lower/abs/danca/taekwondo/peito/ombros +
  genero/qv_hap/metodo/escrita)
- `mastery_musculo` (9 grupos existentes)
- `personagens` (7 jogáveis + 5 boss-conceito) · `selecao_diaria`

**RPG v12:**
- `boss_estado` (semana ISO + carry-over + drop_id)
- `colecao_item` (photocard/outfit/badge/titulo + favorito + visto)
- `season_ativa` / `season_historico`
- `conquistas_unlocked` — existe mas simples

**Treino atual:**
- `treino_exercicios` (nome + grupo_muscular + split + custom)
- `treino_series` (nome + peso + reps + is_pr)  ← **problema: só kg × reps**
- `treino_sessoes` (data + split + finalizada + xp_creditado)
- `exercicios` — biblioteca base

**Nutri / corpo:**
- `food_db` · `logs_dieta` (refeicao/hidratacao) · `logs_nutri` derivado
- `corpo_real` — provavelmente onde peso vive hoje
- `meta` — **hardcoded `data_alvo=2026-09-09`** ← problema

**Saber (preservar):** `saber_conceito`, `saber_prereq`, `saber_item`,
`saber_producao`, `saber_sessao`, `mastery_conceito`, `saber_revisao`,
`saber_fonte`.

**Outros:** `quests`, `daily_spin`, `protocolo_diario`, `dias`, `perfil`,
`spotify_tokens`, `schedule_state`.

### A.2 Código-cerne

- `src/lib/programa.ts` — **split 7-dias hardcoded** (A-G). Sem noção de
  template/programa/mesociclo.
- `src/lib/plano_alimentar.ts` — 7 modelos A-G hardcoded pra cutting único.
- `src/lib/engine/reinforcement.ts` — `calcularGanho(comportamento, mestre,
  peso)` = `20 × peso` base + `+25%` bônus aditivo. **Regra imutável.**
- `src/lib/engine/mastery.ts` — 9 grupos, XP por série via
  `xpDaSerie(nome, peso, reps)`. Assume WEIGHT_REPS pra tudo.
- `src/lib/engine/atributos_v2.ts` — 5 eixos. `resolverBuild` retorna string
  fixa. Precisa expandir pra builds §37.
- `src/lib/engine/faixa.ts`, `boss_persistente.ts`, `meta.ts`, `streak.ts`,
  `tier.ts`, `gates.ts`, `bonus.ts`, `fading.ts`, `latency.ts` — todos
  preservam-se.
- `src/lib/boss.ts` — 5 boss-conceito (Sombra do Cardio / Escala Falsa /
  Sabum da Meia-Noite / Halter Fantasma / Ceia do Prazer) com
  `ajuste` fixo em metas semanais.
- `src/lib/data.ts` — camada de I/O grande (1600+ linhas).

### A.3 Rotas atuais

`/home` · `/hub` · `/programa` · `/treino` · `/nutri` · `/taekwondo` ·
`/danca` · `/quests` · `/colecao` · `/saga` · `/saber` · `/saber/sessao` ·
`/espelho`. BottomNav com 9 itens.

### A.4 Gaps críticos vs. spec

| Spec pede | Estado atual |
|---|---|
| §5 fases persistentes (CUT/MAINT/BUILD/...) | Não existe. Meta.data_alvo hardcoded 09/09/2026. |
| §7 peso + média móvel 7/14 dias | Peso registrado só em `corpo_real`. Sem média móvel exposta. |
| §8 cintura semanal | Não existe. |
| §9 fotos de progresso frente/lado/costas | Não existe. |
| §12 tipos de exercício (WEIGHT_REPS, BW, TIME, ...) | `treino_series` só suporta kg × reps. Prancha vira "PR de +5 kg" fake. |
| §17 readiness score | Não existe. |
| §31 momentum (últimos 7-14 dias) | Streak existe; momentum não. |
| §32 quests com níveis (daily/weekly/arc/season) | Tabela `quests` existe mas simples. |
| §40-41 daily/weekly check-in estruturado | Não existe formalmente. |
| §47 templates de treino (5/6-day, TKD Compatible, Travel) | Programa.ts é único e hardcoded. |
| §51 home reorganizada com progressive disclosure | Home atual tem 15+ blocos empilhados. |
| §64 achievements persistentes | `conquistas_unlocked` existe mas simples. |
| §85 BottomNav com 5 grupos (Home/Train/Fuel/Fight/Progress) | 9 itens flat. |
| §86 /progress, /checkin, /phase, /recovery | Nenhuma existe. |

---

## B. MIGRATION PLAN

Todas as migrations: **RLS + índice por user_id + policies select/insert/
update/delete + idempotência via `on conflict do nothing`**. Numeradas
sequencialmente a partir de **0031**.

### B.1 Migrations por PR

| # | Migration | Adiciona | Modifica | PR |
|---|---|---|---|---|
| 0031 | `phases` | `physique_phase` (id, user_id, type, started_at, ended_at, status, calorie_target, protein_target, target_rate, target_weight_optional, target_waist_optional, target_bf_optional, goal_description, decision_notes) + enum `phase_type` (cut/maintenance/build/specialization/mini_cut/recovery/travel/custom) + `phase_transition` (log de propostas + aceites) | `meta.data_alvo` fica opcional, preservado pra fase ativa | PR 1 |
| 0032 | `measurements` | `body_measurement` (id, user_id, taken_at, kind ∈ {weight, waist, chest, arm, thigh, hip, neck, bf_pct}, value_numeric, unit, method, note) + índice (user_id, kind, taken_at desc). Migração de `corpo_real.peso` → `body_measurement(kind='weight')` preservando datas | Deixa `corpo_real` intacto por 1 ciclo (backward-compat) | PR 1 |
| 0033 | `checkins` | `daily_checkin` (id, user_id, data, peso_kg?, sono_h, sono_qual, fome, energia, dor, stress?, treino_previsto, tkd_previsto, danca_prevista, humor ∈ {otimo,normal,cansado,destruido}, criado_em). `weekly_checkin` (id, user_id, semana_iso, peso_medio_kg?, cintura_cm?, cintura_delta_cm?, treino_sessoes, prs_bater, proteina_pct, calorias_pct, sono_h_medio, fome_media, tkd_sessoes, danca_sessoes, foto_ids[], verdict ∈ {keep_course, small_adjustment, recovery, phase_review}, justificativa, aceito_em?) | — | PR 1 |
| 0034 | `progress_photos` | `progress_photo` (id, user_id, taken_at, angle ∈ {front,side,back,relaxed,flexed}, storage_path, note?, phase_id?, weight_kg?, waist_cm?) | Requer Storage bucket `progress-photos` privado | PR 1 |
| 0035 | `exercise_metric_types` | ALTER `treino_series` add `metric_type text default 'weight_reps'`, `seconds int?`, `assist_kg numeric?`, `bodyweight_used_kg numeric?`, `distance_m int?`, `intensity smallint?`, `rir smallint?`, `rpe smallint?`. Backfill: linhas antigas ficam `metric_type='weight_reps'`. Novo enum via check constraint. | Preserva todo XP anterior. `is_pr` continua. | PR 2 |
| 0036 | `exercise_definitions` | `exercise_definition` (slug pk, nome_pt, nome_en?, metric_type default, muscle_primary text[], muscle_secondary jsonb[{group, weight}], variacao_de slug?, criado_em). Seed a partir dos exercícios de `treino_exercicios` + biblioteca. Cataloga BW/BW_ASSISTED/BW_WEIGHTED. | — | PR 2 |
| 0037 | `training_templates` | `training_template` (slug pk, nome, dias_por_semana, focos jsonb, publico bool), `training_day` (id, template_slug, ordem, nome, foco), `training_day_exercise` (id, day_id, exercise_slug, series, reps, rir, descanso, ordem). Seed com: 5-day V-Taper, 6-day V-Taper, TKD Compatible, Travel, Deload. | Programa.ts atual vira o template `legacy_7day_a_g` preservado | PR 3 |
| 0038 | `programs` | `training_program` (id, user_id, template_slug, iniciado_em, ativo, ajustes jsonb) — instância personalizada. | — | PR 3 |
| 0039 | `personal_records` | `personal_record` (id, user_id, exercise_slug, metric_type, tipo ∈ {carga, reps, volume, tempo, distancia}, valor numeric, batido_em, session_id?, deposed_by_id? nullable). Backfill: extrair PRs de `treino_series.is_pr` já existente. | — | PR 3 |
| 0040 | `physique_priorities` | `physique_priority` (user_id, muscle_group text, tier ∈ {s,a,b,c}, ordem, atualizado_em). Seed default: S=lat/side_delts, A=upper_chest/back_thickness/rear_delt, B=chest_geral/core, C=biceps/triceps/legs. Editável. | Expande `mastery_musculo.grupo` com: `upper_chest`, `back_width`, `back_thickness`, `shoulders_side`, `shoulders_rear`. Mapeia XP legado: `chest → chest + upper_chest` (dividido 0.7/0.3 pro histórico), `back → back_width + back_thickness` (0.5/0.5), `shoulders → shoulders_side + shoulders_rear` (0.7/0.3). | PR 8 |
| 0041 | `physique_engine` | `physique_engine_decision` (id, user_id, criado_em, phase_id, decision ∈ {keep, small_adjustment, recovery, phase_review, alerta}, signals jsonb, reason text, confidence numeric, aceito ∈ {pendente, aceito, adiado, ignorado, expirado}). `nutrition_target` (id, user_id, phase_id, iniciado_em, kcal, kcal_range_min, kcal_range_max, protein_g, protein_range jsonb, carb_g, fat_g_min, ativo). | Substitui hardcode 1800 kcal | PR 4 + PR 5 |
| 0042 | `readiness` | `readiness_snapshot` (id, user_id, data, score smallint, componentes jsonb {sono, fadiga, dor, fome, performance, semana_load}, veredicto text). Recalculado no daily check-in. | — | PR 6 |
| 0043 | `momentum` | `momentum_snapshot` (id, user_id, data, janela_dias, score numeric, componentes jsonb, adherence_pct). Diário. | — | PR 7 |
| 0044 | `quests_v2` | `quest_definition` (slug pk, tier ∈ {daily,weekly,arc,season}, nome, descricao, criterio jsonb, reforcador jsonb, contexto_gatilho jsonb). `quest_instance` (id, user_id, slug, tier, gerada_em, vence_em, estado ∈ {ativa, completa, expirada, abandonada}, progresso jsonb, ligada_phase_id?). Migração da tabela `quests` atual pra `quest_instance` preservando linhas. | Tabela `quests` mantida como view legada por 1 ciclo. | PR 7 |
| 0045 | `achievements_v2` | `achievement_def` (slug pk, categoria, nome, descricao, criterio jsonb, raridade, cosmetic_slug?). `user_achievement` (user_id, slug, unlocked_em, contexto jsonb). Migração de `conquistas_unlocked` sem perda. | — | PR 11 |
| 0046 | `travel_mode` | `travel_period` (id, user_id, iniciado_em, termina_em, reentry_ate, config jsonb {proteina_min, logs_simplificados, quests_reduzidas}). | — | PR 10 |
| 0047 | `bonds` | `personagem_bond` (user_id, personagem_slug, xp, nivel, atualizado_em). Incremento por logging + sessões do domínio do mestre. Bond desbloqueia cosmetics/frases, **nunca eficácia**. | — | PR 11 |

**Total: 17 migrations aditivas. Nenhuma destrutiva.**

### B.2 Migração de dados legados

- **Peso** de `corpo_real.peso` → `body_measurement` (kind='weight', taken_at=corpo_real.data). Mantém `corpo_real` funcional por 1 ciclo.
- **PRs** de `treino_series.is_pr=true` → `personal_record` (tipo='carga' + valor=peso).
- **Mastery** dos 9 grupos existentes preservada. Novos grupos (`upper_chest`, `back_width`, `back_thickness`, `shoulders_side`, `shoulders_rear`) começam em 0 mas ganham XP de séries futuras via `distribuicaoDoExercicio` estendida.
- **Fase inicial**: seed insere 1 linha em `physique_phase` com `type='cut'`, `started_at='2026-08-10'`, `calorie_target=1900`, `protein_target=135`, herdando o cutting em curso.

---

## C. DOMAIN MODEL — novas entidades e relações

```
                           user (auth.users)
                                │
     ┌──────────────────────────┼────────────────────────────┐
     │                          │                            │
physique_phase           body_measurement            daily_checkin
     │                          │                            │
     │ (1..N)                   │                            └─→ readiness_snapshot
     │                          │
     └── nutrition_target       └─→ weekly_checkin ──→ progress_photo
     │                                    │
     │                                    └─→ physique_engine_decision
     │
     └── training_program ─→ training_day ─→ training_day_exercise
              │                                       │
              └─→ (roda o dia)                        └─→ exercise_definition
                          │                                       │
                          └─→ treino_series (+metric_type)  ──────┘
                                       │
                                       └─→ personal_record

  personagem_bond ← (personagem × comportamento) — cosmético
  quest_instance ← (quest_definition × phase + contexto)
  momentum_snapshot ← agregado diário de tudo acima
```

**Preservado sem tocar:** `atributos`, `progresso_dominio`, `mastery_musculo`
(expandido), `boss_estado`, `colecao_item`, `season_ativa`, `saber_*`.

---

## D. PHYSIQUE ENGINE — regras determinísticas

Todas as decisões retornam `{decision, confidence, signals[], reason}`.
Sem IA. Testável.

### D.1 Peso — nunca reagir a 1 dia (§7)

```
media7d = média das últimas 7 medições de kind='weight' (ignorar gaps de 1 dia)
media14d = média das últimas 14
tendencia_semanal_pct = (media7d - media7d_semana_passada) / media7d_semana_passada × 100
```

**UI mostra:** `hoje_kg` (secundário, dim) + `media7d_kg` (primário, kihap
color). "Seu peso subiu 0.8 kg hoje, mas sua média continua caindo."

### D.2 Cintura (§8)

3 medidas por check-in semanal → média. Delta vs. semana anterior.

### D.3 Readiness (§17)

```
readiness = clamp(
  0.25 × sono_score
  + 0.20 × (10 - fome)/10
  + 0.15 × (10 - dor)/10
  + 0.15 × performance_recente_pct
  + 0.10 × (1 - carga_semana_pct)
  + 0.15 × (10 - fadiga_subjetiva)/10
) × 100
```
Faixas: `≥ 70 READY`, `50-69 CAUTION`, `< 50 RECOVERY ADVISED`. **Nunca**
transforma em ordem médica — só sugestão.

### D.4 Momentum (§31)

Janela 14 dias. Componentes ponderados:
```
momentum = 
  0.30 × treino_planejado_pct
  + 0.25 × proteina_pct
  + 0.15 × sono_pct
  + 0.15 × checkin_pct
  + 0.10 × recovery_respeitado_pct
  + 0.05 × atividade_relevante_pct
```
**Não inclui peso perdido** (§27, §60). Uma falha isolada não zera.

### D.5 Decisão de fase — CUT (§42)

```
input: media7d_atual, media7d_semana_passada, cintura_delta_cm,
       performance_delta_pct, sono_h_medio, aderencia_pct, dias_na_fase

signals:
  s_perda_pct = (media7d_passada - media7d_atual) / media7d_passada
  s_cintura = cintura_delta_cm
  s_perf = performance_delta_pct
  s_sono = sono_h_medio
  s_aderencia = aderencia_pct

regras (em ordem, primeiro match ganha):

1. RECOVERY_CHECK (§72)
   se s_sono < 5.5 e s_perf < -8 e (fome>=8 média)
   → RECOVERY, "sinais preocupantes: sono baixo + performance caindo + fome alta"

2. RECOVERY (§42)
   se s_perda_pct > 1.2 e s_perf < -5
   → "perda rápida + performance caindo. Não reduza calorias."

3. KEEP_COURSE (§42)
   se 0.35 ≤ s_perda_pct ≤ 0.85 e s_perf >= -3
   → "progresso dentro do esperado"

4. SMALL_ADJUSTMENT (§42)
   se dias_na_fase >= 14 e s_perda_pct < 0.15 e s_aderencia > 85%
   → "14 dias sem tendência de queda com alta aderência. Considere -100 a -150 kcal."

5. PHASE_REVIEW (§44)
   se dias_na_fase >= 42 e (bf_estimado ≤ target OR cintura_delta_total >= 4)
   → "considerar transição pra Maintenance"

6. WATCH
   default → "sinais mistos. Continue observando."
```

**Sem loop infinito de redução:** piso configurável em
`physique_phase.calorie_target_min` (default = TMB × 1.1).

### D.6 Decisão de fase — BUILD (§43)

```
1. SMALL_CUT_SUPERAVIT se cintura_delta > 0.5 e peso_delta < 0.15 kg/sem
2. INCREASE_SUPERAVIT se peso_delta < 0.10 kg/sem e performance parada
3. KEEP_COURSE se 0.15 ≤ peso_delta ≤ 0.30 kg/sem e cintura estável
4. RECOMP_SIGNAL (§101) se peso ~estável + cintura -0.2cm + performance +3%
```

### D.7 Idempotência do XP (§76-77)

Todo evento (série, sessão, check-in) que gera XP tem `event_id` único.
Reenviar não credita 2×. Regra existente do PR3 estendida.

### D.8 Guardrails de segurança (§72)

Se qualquer combinação:
- s_perf < -10 por 2 semanas
- fome ≥ 8/10 média por 7 dias
- 3+ tonturas registradas em 14 dias
- peso caindo > 1.5% média/semana

→ Engine **nunca** propõe cortar mais / mais cardio / mais treino.
UI exibe `RECOVERY CHECK` + sugere pausar cutting + avaliação profissional.

---

## E. UX MAP

### E.1 BottomNav novo (§85) — 5 grupos

```
[Home] [Train ⇩] [Fuel ⇩] [Fight ⇩] [Progress ⇩]
```
Cada tab (exceto Home) abre um sheet com abas internas:

- **Train** → Treino · Templates · Programa · Histórico · Mastery
- **Fuel** → Nutri · Refeições · Água · Suplementação
- **Fight** → TKD · Dança · Saga (boss + ato) · Coleção
- **Progress** → Peso · Cintura · Fotos · V-Taper · Fases · Momentum · Saber

**Preserva acesso rápido** (§85): swipe do Home direto pra Train/Fuel.
**Trocar/Hub/Espelho** viram sub-rotas com deep-link.

### E.2 Rotas novas

| Rota | Função |
|---|---|
| `/checkin` | Daily (§40) — <60s. Segmented controls. Peso opcional. |
| `/checkin/weekly` | Weekly (§41). 3 medidas de cintura + verdict engine. |
| `/phase` | Fase atual + timeline (§70) + transições propostas. |
| `/recovery` | Sono · fadiga · readiness score do dia. |
| `/progress` | Peso média-móvel + cintura + fotos + V-Taper. |
| `/progress/vtaper` | Skill tree (§39). Wings · Frame · Armor · Core · Foundation. |
| `/progress/photos` | Comparador ANTES × AGORA (§9). |
| `/train/template` | Trocar template (5-day / 6-day / TKD Compat / Travel / Deload). |

### E.3 Home reformada (§51-52)

Progressive disclosure. Uma pergunta: **o que fazer hoje?** Resposta em <3s.

```
QUEST · CUT · Day 18                        [Momentum 87%]
────────────────────────────────────────────────────────
[Hero personagem do dia] — SD contextual (§104)
"Back day. Wings loading."
────────────────────────────────────────────────────────
TODAY
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Training     │ │ Nutrition    │ │ Recovery     │
│ Pull · B     │ │ 1900 · 135P  │ │ Sleep 6h30   │
│ ▶            │ │ Log meal     │ │ Checkin      │
└──────────────┘ └──────────────┘ └──────────────┘
────────────────────────────────────────────────────────
PHYSIQUE STATUS
 Weight 68.4 · media7d 67.9 (↓ 0.44%)
 Waist 78.1 (↓ 0.6 cm sem)
 Performance ▲ · V-Taper Wings LV 3
────────────────────────────────────────────────────────
QUESTS (3-5) · BOSS (1) · COLLECTION (season card)
```

Bloco condicional: se readiness < 50 → **primeira quest sugerida = recovery**.

### E.4 Botões selecionáveis (§53)

Padrão pra tudo:
- **RIR**: `4 3 2 1 0` chips
- **Intensidade**: `Leve · Moderada · Alta`
- **Fome/Energia/Dor**: slider 0-10 com emoji flutuando
- **Peso/Reps**: stepper `-2.5 / +2.5` e `-1 / +1`
- **Humor**: 🙂 😐 😴 😵 tap
- **Rest timer**: `60 · 90 · 120 · 180` chips + skip

### E.5 Registro de série rápido (§54-56)

Depois da set 1, set 2 pré-preenche mesmo peso × reps. Botões +/- de
peso e reps. Salvar em 1 toque. Rest timer opcional inicia automaticamente.

Ao abrir exercício: mostrar últimas 3 sessões + target sugerido.

---

## F. IMPLEMENTATION ORDER — 12 PRs

Cada PR: reset branch → código → migrations → testes → typecheck → build →
draft PR → screenshots → riscos → commit descritivo. **Nunca 15 sistemas
num PR só.**

### PR 1 · Data Foundation (§74)
Migrations 0031-0034. `physique_phase`, `body_measurement`, `daily_checkin`,
`weekly_checkin`, `progress_photo`. Migração de `corpo_real.peso` → `body_measurement`.
Seed com fase CUT ativa herdando o cutting em curso.
- **UI**: rota `/checkin` (daily minimal, <60s) + `/checkin/weekly` esqueleto.
- **Testes**: média móvel 7/14 dias, cintura delta, migração legada.
- **Riscos**: schema mais amplo; recomendo rodar migração em dev primeiro.
- **Aceite**: check-in diário grava; peso migrado histórico visível na média.

### PR 2 · Exercise Metric Types (§12-13)
Migrations 0035-0036. `metric_type` em `treino_series` +
`exercise_definition`. Enum: WEIGHT_REPS / BW_REPS / BW_ASSISTED /
BW_WEIGHTED / TIME / DISTANCE / DURATION / INTERVAL / CUSTOM.
- **UI**: `/treino` respeita tipo. Prancha vira `45s → 55s`, barra
  assistida vira `BW - 25 × 8`.
- **Progressão**: PR engine leva tipo em conta (§57).
- **Riscos**: backfill deve preservar todo `is_pr` existente.
- **Aceite**: registrar prancha sem "PR de +5 kg"; puxada continua
  intacta.

### PR 3 · Training Logging v2 + PR Engine (§14, §54-57)
Migrations 0037-0039. `training_template`, `training_day`, `training_program`,
`personal_record`. Programa.ts vira template `legacy_7day_a_g`.
- **UI**: registro rápido com set-N pré-preenchido; rest timer;
  histórico últimas 3 sessões por exercício.
- **PR engine**: identifica carga/reps/volume/tempo/distância separadamente.
- **Aceite**: registrar 6 séries em <2min; PR de puxada não colide com
  PR de prancha.

### PR 4 · Physique Engine — CUT (§42, §88)
Migration 0041 (parcial: `physique_engine_decision`, `nutrition_target`).
Engine determinístico com regras de D.5.
- **UI**: `/phase` mostra decisão do dia com `{signals, reason, confidence}`.
  Botões: `Continuar` · `Ver análise` · `Adiar`.
- **Testes**: 20+ cenários (weekly stall, rapid drop, plateau,
  recovery sinal, phase review).
- **Aceite**: engine nunca sugere <piso; guardrails §72 funcionam.

### PR 5 · Nutrition Adaptive (§20-24, §96-97)
Migration 0041 (nutrition_target concluído). Zonas em vez de metas rígidas.
- **UI**: `/nutri` mostra kcal target + range (1850-2000) + proteína
  range. Refeição livre / evento social sem culpa. Travel mode aciona
  proteína piso + logging simplificado.
- **Aceite**: cadastrar refeição livre não faz nenhuma sugestão
  compensatória (§22).

### PR 6 · Recovery + Readiness (§17, §24)
Migration 0042. `readiness_snapshot` diário. Sleep quest com shaping (§28).
- **UI**: `/recovery` com score + componentes + evolução. Home destaca
  se score < 50.
- **Aceite**: 3 noites de sono < 5h → recovery advised na home.

### PR 7 · Momentum + Quests v2 (§31-33, §32)
Migrations 0043-0044. `momentum_snapshot` diário. `quest_definition` +
`quest_instance` com tiers daily/weekly/arc/season.
- **UI**: Momentum como primeiro card do dashboard. Quests filtradas
  por contexto (readiness ruim → recovery quests, treino leve, sleep).
- **Migração**: preserva `quests` atual como view legada.
- **Aceite**: falhar 2 dias reduz momentum mas não zera streak; retornar
  aciona `WELCOME BACK QUEST` (§26).

### PR 8 · V-Taper Skill Tree (§10, §16, §39, §100)
Migration 0040. `physique_priority` + expansão `mastery_musculo` (novos
grupos). Mapeamento XP legado.
- **UI**: `/progress/vtaper` com skill tree. Cada nó: mastery + volume
  + progresso recente. Tier S/A/B/C editável.
- **Aceite**: XP anterior migrado sem perda; novos grupos ganham XP
  automaticamente de séries futuras via `distribuicaoDoExercicio`
  estendida.

### PR 9 · Phase UI + Timeline (§44, §51, §70-71)
UI-only na maior parte. Timeline vertical de fases. Proposta de transição
via engine.
- **UI**: `/phase` com timeline + histórico + botão de transição.
  Year Review card (§71) com comparador.
- **Aceite**: transição CUT→MAINT gera novo `physique_phase` com
  `calorie_target` sugerido pelo engine.

### PR 10 · Travel Mode + Recovery Mode (§23, §50, §95)
Migration 0046. `travel_period`.
- **UI**: botão `TRAVEL MODE` na home. Ativa quests reduzidas, proteína
  piso, logging simplificado. Reentry phase 3-5 dias com aviso de peso
  ruidoso.
- **Deload** também vira quest reforçadora (§50): "Strategic Recovery".
- **Aceite**: viagem de 5 dias não quebra momentum.

### PR 11 · RPG Economy Integration (§64-65, §36)
Migrations 0045, 0047. `achievement_def` + `user_achievement` + `personagem_bond`.
Achievements listados no §64: FIRST BLOOD / WINGS I-II / OVERLOAD /
CONSISTENCY / RETURNER / RECOVERY IS TRAINING / CUT COMPLETE etc.
Bond dá cosmetics/frases, nunca eficácia.
- **UI**: `/hub` mostra bond level. Achievements card na home.
- **Não gamifica magreza** (§65).
- **Aceite**: bater PR desbloqueia OVERLOAD; nada dispara por perder peso.

### PR 12 · Dashboard Redesign + BottomNav 5 Grupos (§51-52, §85, §93)
Nova home progressive disclosure. BottomNav consolidado. Heatmap
tipo GitHub (§93). Weekly recap (§94).
- **UI**: home responde §52 em <3s. Weekly recap estilo game recap
  ao final da semana.
- **Aceite**: usuário vê "o que fazer hoje" imediatamente ao abrir.

---

## O QUE **NÃO** MUDAR

- Base protegida = 20 XP + bônus +25% aditivo (§36, `reinforcement.ts`).
- Regra "zero é o piso" — bônus nunca subtrai.
- Módulo Saber intacto (§84). Compartilha XP apenas respeitando: **ler = 0 XP** (§25, §84).
- Personagens (7 jogáveis + 5 boss-conceito) preservados. Novos mestres só se necessidade narrativa forte (§35). Se preciso especializar dorsais, **expandir personagem existente** em vez de criar.
- Coleção, seasons, boss persistente, mastery_musculo funcionam como estão. Apenas expandidos.
- Faixa por domínio, elo, atributos v2, HitConfirm — todos preservados.
- Discrição total (§2, §69): nunca revelar inspiração. Interno = "Project V" / "V-Taper Project".

---

## RISCOS ARQUITETURAIS

1. **Migração de `corpo_real.peso`** — precisa manter compat por 1 ciclo antes de deprecar.
2. **`mastery_musculo` expandido** — mapear XP legado (chest → chest + upper_chest 0.7/0.3) sem sobrecontabilizar. Testar migração idempotente.
3. **Programa.ts hardcoded** — vira template legado; usuários com plano ativo devem receber conversão automática pra `training_program`.
4. **Home nova** — mudança grande. Feature flag até PR 12 estabilizar.
5. **BottomNav 5 vs. 9** — muda muscle memory. Manter deep-links das rotas antigas por 30 dias.

---

## RECOMENDAÇÃO

Começar por **PR 1 · Data Foundation**. Sem ele, nada mais faz sentido
(fases, check-ins e medidas são a base de dados que os PRs 4-12
consomem). Escopo: 4 migrations + rota `/checkin` mínima + testes de
média móvel.

Depois de PR 1 mergeado, PR 2 (metric types) desbloqueia PR 3 (training v2).
PR 4 (engine) e PR 5 (nutri adaptive) podem rodar em paralelo depois de 1-3.

**Confirma que quer começar por PR 1?** Se sim, eu inicio o corte de código.
Se preferir outra ordem (ex.: começar por Home + BottomNav pra ver visual
antes), me avisa.
