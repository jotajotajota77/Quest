-- ============================================================
-- Quest — migration 0026: v12.5 mestres-boss conceituais.
-- ------------------------------------------------------------
-- Antes: os 5 mestres jogáveis (chan-ho/hujin/ji-seok/ryuki/sanhee)
-- também eram o pool de boss semanal. Mestre + aliado + chefe do mesmo
-- personagem embaralhava a narrativa.
--
-- Agora: 5 novos personagens FICTÍCIOS entram como boss-only. Não são
-- jogáveis (jogavel=false) — só aparecem no BossBattle como antagonista.
-- Sem arte por enquanto (asset_rosto/corpo NULL); CharacterImage cai
-- graciosamente na letra inicial via posesCascata.
--
-- Os 6 mestres jogáveis continuam jogáveis; deixaram apenas de aparecer
-- na rotação de boss (que agora usa só estes 5 novos).
-- ============================================================

insert into public.personagens
  (slug, nome, titulo, atributo_foco, comportamento_alvo, lore, ativo, ordem,
   desbloqueado, bonus, dominio, faixa_canonica, jogavel)
values
  ('sombra-do-cardio', 'Sombra do Cardio', 'A Que Cresce Nos Dias Parados',
    'stamina', 'nutri',
    'Vulto cinza que se alimenta de sofá. Não anda, não pisa, não sua — e a cada dia que você faz o mesmo, ela ganha corpo.',
    true, 101, true, null,
    'cardio', 'branca_10kup', false),

  ('escala-falsa', 'Escala Falsa', 'Ilusionista da Balança',
    'forca', 'nutri',
    'Sussurra números na sua orelha na terça-feira de manhã. O peso mente. A gordura ri escondida — ela adora te ver desistir.',
    true, 102, true, null,
    'nutri', 'branca_10kup', false),

  ('sabum-da-meia-noite', 'Sabum da Meia-Noite', 'O Mestre Que Não Deixa Dormir',
    'foco', 'treino',
    'Faixa preta rasgada, luz branca fria. Chama pra treinar às 23h e cobra a sessão da manhã. Rouba sono e recuperação.',
    true, 103, true, null,
    'taekwondo', 'preta_1dan', false),

  ('halter-fantasma', 'Halter Fantasma', 'A Barra Que Não Progrida',
    'forca', 'treino',
    'Anel de fumaça em forma de barbell. O peso fica leve mas nada acontece — sinal de que a técnica quebrou. Precisa ser confrontada.',
    true, 104, true, null,
    'bracos', 'amarela_9kup', false),

  ('ceia-do-prazer', 'Ceia do Prazer', 'A Mesa Que Sabota',
    'stamina', 'nutri',
    'Mesa barroca, taça, vinho, chocolate ao rés. Cada colher a mais é vitória dela. Deleita-se com o "só um pedaço".',
    true, 105, true, null,
    'nutri', 'branca_10kup', false)
on conflict (slug) do nothing;

-- Nota: nenhum destes personagens é `avatar_jogador`. Só entra no roster
-- (rosterDesbloqueado inclui todos com desbloqueado=true, e a lookup do
-- BossBattle usa personagens.slug pra achar avatar+cor). jogavel=false
-- garante que o hub NÃO permite selecioná-los como mestre do dia.
