-- ============================================================
-- Quest — migration 0030: SABER Fase 1 seed.
-- ------------------------------------------------------------
-- Fonte extraída das duas apostilas (glossários íntegros das duas +
-- conceitos-tronco AC que ambas assumem). DAG tronco → duas trilhas.
-- Um item camada 2 (explicar de memória) por conceito como starter.
-- Camadas 1 e 3 entram em seeds posteriores.
--
-- Estruturas idempotentes: on conflict do nothing / do update em campos-
-- chave. Rodar 2× é seguro.
-- ============================================================

-- ============================================================
-- I. CONCEITOS
-- ============================================================

-- --- Núcleo AC (tronco) — dominio 'metodo' ---
insert into public.saber_conceito
  (slug, titulo, apostila, dominio, unidade, tese, definicao, criterio)
values
  ('contingencia-3-termos', 'Contingência de três termos', 'qv_hap', 'metodo', '1.1',
   'Comportamento se explica pela relação entre antecedente, resposta e consequência ao longo do tempo — não pela topografia isolada.',
   'Antecedente sinaliza; resposta é emitida; consequência seleciona. As três partes só fazem sentido juntas.',
   'Consigo, diante de um comportamento, nomear o SD provável, a resposta e a consequência que a mantém?'),

  ('funcao-nao-topografia', 'Função ≠ topografia', 'qv_hap', 'metodo', '1.2',
   'A mesma forma pode ter funções diferentes, e a mesma função pode ter formas diferentes.',
   'Topografia é o que a resposta parece. Função é o que a resposta faz — qual consequência a mantém.',
   'Consigo dar 2 exemplos de mesma topografia com funções diferentes na mesma pessoa?'),

  ('reforco-negativo', 'Reforço negativo e esquiva', 'qv_hap', 'metodo', '1.3',
   'Reforço negativo aumenta uma resposta porque algo aversivo foi retirado, reduzido ou adiado — não é punição.',
   'Reforço (positivo ou negativo) sempre AUMENTA a resposta. Negativo se refere à REMOÇÃO/ALÍVIO. Esquiva é o caso em que a resposta antecede e cancela o aversivo.',
   'Consigo explicar por que o alívio pode reforçar a evitação sem punir a pessoa?'),

  ('operacao-motivadora', 'Operação motivadora vs. estímulo discriminativo', 'qv_hap', 'metodo', '1.4',
   'OM altera o VALOR de uma consequência; SD sinaliza a DISPONIBILIDADE de uma consequência.',
   'OM muda quanto o reforçador vale agora (dor, privação, saciação). SD muda a probabilidade de a resposta produzir a consequência dado o contexto.',
   'Diante de um cenário clínico, consigo apontar o que é OM e o que é SD sem confundir?'),

  ('regras-autorregras', 'Regras e autorregras', 'qv_hap', 'metodo', '1.5',
   'Comportamento pode ser governado por descrições verbais de contingências, não só por contato direto.',
   'Regra é enunciado que descreve uma contingência ("se X, então Y"). Autorregra é a regra que a própria pessoa formula sobre si.',
   'Consigo diferenciar comportamento moldado por contingência direta do que é seguimento de regra?'),

  ('comunidade-verbal', 'Comunidade verbal', 'qv_hap', 'metodo', '1.6',
   'Falar de si mesmo é resposta pública selecionada por outras pessoas — não introspecção privilegiada.',
   'A comunidade verbal ensina a pessoa a nomear seus próprios estados a partir de sinais públicos correlacionados. Sem ela, não haveria "sentimento" como categoria compartilhada.',
   'Consigo explicar por que "sentir X" também é comportamento social sem negar a experiência da pessoa?'),

  ('pratica-cultural', 'Prática cultural', 'qv_hap', 'metodo', null,
   'Padrão de comportamento transmitido e mantido em grupos e instituições.',
   'Comportamentos de vários indivíduos, coordenados por consequências agregadas do grupo, mantidos entre gerações.',
   'Consigo diferenciar uma prática cultural de um comportamento individual repetido?'),

  ('metacontingencia', 'Metacontingência', 'genero', 'metodo', '19',
   'Consequências agregadas selecionam PRÁTICAS culturais inteiras, não só respostas individuais.',
   'Unidade selecionada = prática (conjunto coordenado de comportamentos entrelaçados) + produto agregado; a contingência opera sobre a prática, não sobre pessoas isoladas.',
   'Consigo dar exemplo de mudança que só faz sentido no nível da prática cultural, não do indivíduo?'),

-- --- Glossário QV/HAP (18 termos) — dominio 'qv_hap' ---
  ('adesao', 'Adesão', 'qv_hap', 'qv_hap', 'glossário',
   'Adesão é conjunto de comportamentos de seguir o plano de cuidado — não traço moral.',
   'Conjunto de comportamentos relacionados a seguir um plano de cuidado; não é um traço moral.',
   'Consigo analisar não-adesão como classe de respostas mantidas por contingências reais em vez de "falta de vontade"?'),

  ('custo-oportunidade', 'Custo de oportunidade', 'qv_hap', 'qv_hap', 'glossário',
   'Custo de oportunidade é o valor da melhor alternativa abandonada ao escolher.',
   'Valor da melhor alternativa abandonada quando uma escolha é feita.',
   'Consigo identificar o custo de oportunidade oculto em uma decisão do paciente?'),

  ('custo-resposta', 'Custo de resposta', 'qv_hap', 'qv_hap', 'glossário',
   'Custo de resposta é o esforço, tempo ou requisito exigido para emitir uma resposta.',
   'Esforço, tempo ou outro requisito necessário para emitir uma resposta.',
   'Consigo estimar como uma doença crônica eleva o custo de resposta de atividades antes triviais?'),

  ('demanda', 'Demanda', 'qv_hap', 'qv_hap', '2.3',
   'Demanda é a quantidade de reforçador procurada em função do preço.',
   'Quantidade de um reforçador procurada ou consumida em diferentes preços.',
   'Consigo desenhar uma curva de demanda hipotética pro comportamento estudado?'),

  ('desconto-temporal', 'Desconto temporal', 'qv_hap', 'qv_hap', '2.7',
   'Consequência atrasada perde controle sobre a resposta atual — desconto temporal.',
   'Redução do controle exercido por uma consequência conforme aumenta seu atraso.',
   'Consigo explicar escolhas subótimas do paciente sem apelar a "impulsividade" moral?'),

  ('elasticidade', 'Elasticidade', 'qv_hap', 'qv_hap', '2.3',
   'Elasticidade é a sensibilidade do consumo à mudança de preço.',
   'Sensibilidade do consumo às mudanças de preço.',
   'Consigo dizer se uma classe de reforçadores é elástica ou inelástica pra esse paciente?'),

  ('estimulo-discriminativo', 'Estímulo discriminativo (SD)', 'qv_hap', 'qv_hap', 'glossário',
   'SD sinaliza que a resposta tem probabilidade de produzir determinada consequência.',
   'Condição que sinaliza que uma resposta tem probabilidade de produzir determinada consequência.',
   'Consigo separar SD (sinal) de OM (valor) em um caso?'),

  ('funcao', 'Função', 'qv_hap', 'qv_hap', 'glossário',
   'Função é a relação entre comportamento e ambiente — não a forma visível.',
   'Relação entre comportamento e variáveis ambientais; não é a forma visível da resposta.',
   'Consigo, diante de um relato, formular uma hipótese funcional em vez de descritiva?'),

  ('granularidade', 'Granularidade', 'qv_hap', 'qv_hap', '4.1',
   'Granularidade é o nível de detalhe com que uma medida distingue construtos.',
   'Nível de detalhe com que uma medida distingue construtos ou componentes.',
   'Consigo justificar a granularidade escolhida do meu instrumento?'),

  ('mcid', 'MCID (mudança clinicamente importante)', 'qv_hap', 'qv_hap', '4.6',
   'MCID é a menor mudança interpretada como clinicamente importante — não é estatística sozinha.',
   'Menor mudança interpretada como clinicamente importante em contexto definido.',
   'Consigo diferenciar significância estatística de MCID em uma discussão de resultados?'),

  ('operacao-motivadora-glossario', 'Operação motivadora (OM)', 'qv_hap', 'qv_hap', 'glossário',
   'OM é evento que altera o VALOR da consequência e evoca respostas relacionadas.',
   'Evento que altera o valor de uma consequência e evoca ou abole respostas relacionadas.',
   'Consigo apontar como uma OM pode mudar o valor de reforçadores sociais na HAP?'),

  ('prom', 'PROM', 'qv_hap', 'qv_hap', '4.1',
   'PROM é medida de desfecho relatada diretamente pelo paciente.',
   'Medida de resultado relatada diretamente pelo paciente.',
   'Consigo justificar por que um PROM específico é preferível a um genérico neste artigo?'),

  ('qvrs', 'QVRS', 'qv_hap', 'qv_hap', '4.2',
   'QVRS é o recorte de qualidade de vida ligado a saúde, doença e tratamento.',
   'Recorte da qualidade de vida relacionado à saúde, doença e tratamento.',
   'Consigo diferenciar QV geral de QVRS em um mesmo caso?'),

  ('reforcador', 'Reforçador', 'qv_hap', 'qv_hap', 'glossário',
   'Reforçador é consequência que aumenta ou mantém uma classe de respostas em condições definidas.',
   'Consequência que aumenta ou mantém uma classe de respostas em condições definidas.',
   'Consigo verificar empiricamente que algo funciona como reforçador (e não apenas assumir)?'),

  ('reforco-negativo-glossario', 'Reforço negativo (glossário)', 'qv_hap', 'qv_hap', 'glossário',
   'Reforço negativo aumenta resposta pela retirada/redução/adiamento de aversivo — não é punição.',
   'Aumento de resposta produzido pela retirada, redução ou adiamento de estímulo aversivo.',
   'Consigo explicar reforço negativo sem confundir com punição para um estudante iniciante?'),

  ('responsividade', 'Responsividade', 'qv_hap', 'qv_hap', 'glossário',
   'Responsividade é a capacidade do instrumento de detectar mudança ao longo do tempo.',
   'Capacidade de um instrumento detectar mudança ao longo do tempo.',
   'Consigo escolher um PROM responsivo pro desfecho e populações do meu artigo?'),

  ('substituto', 'Substituto', 'qv_hap', 'qv_hap', '2.5',
   'Substituto é alternativa cujo consumo aumenta quando o preço/indisponibilidade do outro sobe.',
   'Alternativa cujo consumo aumenta quando o preço ou a indisponibilidade de outro reforçador aumenta.',
   'Consigo diferenciar substituto de equivalente perfeito num caso clínico?'),

  ('validade-conteudo', 'Validade de conteúdo', 'qv_hap', 'qv_hap', '4.5',
   'Validade de conteúdo é o grau em que itens são relevantes, abrangentes e compreensíveis para construto e população.',
   'Grau em que itens são relevantes, abrangentes e compreensíveis para construto e população.',
   'Consigo avaliar validade de conteúdo de um PROM sem confundir com validade de construto?'),

  ('perda-contingencias', 'Perda de contingências', 'qv_hap', 'qv_hap', '3.1',
   'Doença crônica pode fazer o reforçador sumir, a resposta ficar cara, a ligação enfraquecer ou o contexto deixar de sinalizar oportunidades.',
   'Erosão da relação resposta→consequência: por desaparecimento do reforçador, aumento do custo, quebra da ligação ou perda de SDs.',
   'Consigo mapear qual dessas 4 rotas está operando num caso?'),

  ('qv-qvrs-domínio-item', 'Domínio ≠ instrumento ≠ item', 'qv_hap', 'qv_hap', '4.3',
   'Domínio é conceito; instrumento é ferramenta; item é pergunta. Confundi-los é receita pra medir errado.',
   'Domínio: dimensão teórica (ex: função física). Instrumento: escala inteira (ex: SF-36). Item: pergunta individual do instrumento.',
   'Consigo, num artigo, apontar quando o autor tratou item como se fosse domínio?'),

-- --- Glossário Gênero (15 termos) — dominio 'genero' ---
  ('agencia-situada', 'Agência situada', 'genero', 'genero', 'glossário',
   'Agência situada é agir dentro das possibilidades históricas e materiais reais.',
   'Capacidade de agir e alterar condições dentro de possibilidades históricas e materiais reais.',
   'Consigo falar em agência sem cair em livre-arbítrio mágico nem em determinismo total?'),

  ('cisgeneridade', 'Cisgeneridade', 'genero', 'genero', 'glossário',
   'Cisgeneridade é a condição de quem se identifica com o gênero associado ao sexo atribuído ao nascer.',
   'Condição de quem se identifica com o gênero associado ao sexo atribuído ao nascer.',
   'Consigo usar o termo sem tratar como padrão não-marcado?'),

  ('construcao-social', 'Construção social', 'genero', 'genero', 'glossário',
   'Construção social é a produção histórica de categorias, critérios e consequências por práticas coletivas.',
   'Produção histórica de categorias, critérios, significados e consequências por práticas coletivas.',
   'Consigo explicar "socialmente construído" sem que isso vire "não é real"?'),

  ('divisao-sexual-trabalho', 'Divisão sexual do trabalho', 'genero', 'genero', 'glossário',
   'Divisão sexual do trabalho é a distribuição desigual de tarefas produtivas e reprodutivas conforme gênero.',
   'Distribuição socialmente desigual de tarefas produtivas e reprodutivas conforme gênero.',
   'Consigo mapear essa divisão em um caso clínico sem reduzi-lo a "escolha pessoal"?'),

  ('expressao-genero', 'Expressão de gênero', 'genero', 'genero', 'glossário',
   'Expressão de gênero é forma pública de apresentação culturalmente associada a gênero.',
   'Formas públicas de apresentação associadas culturalmente a gênero.',
   'Consigo diferenciar expressão de identidade e de orientação?'),

  ('heterocisnormatividade', 'Heterocisnormatividade', 'genero', 'genero', '16',
   'Heterocisnormatividade é o conjunto de práticas que tratam heterossexualidade e cisgeneridade como padrão esperado e não marcado.',
   'Práticas que tratam heterossexualidade e cisgeneridade como padrão esperado, não-marcado, contra o qual outras posições precisam se justificar.',
   'Consigo identificar heterocisnormatividade operando em uma rotina clínica ou institucional?'),

  ('identidade-genero', 'Identidade de gênero', 'genero', 'genero', 'glossário',
   'Identidade de gênero é o modo como a pessoa se reconhece e se nomeia em relação ao gênero.',
   'Modo como a pessoa se reconhece e se nomeia em relação ao gênero.',
   'Consigo respeitar identidade sem confundir com expressão ou orientação?'),

  ('interseccionalidade', 'Interseccionalidade', 'genero', 'genero', '10',
   'Interseccionalidade é análise de como racismo, capitalismo e sexismo se articulam produzindo posições específicas — não checklist identitário.',
   'Análise de como estruturas como racismo, capitalismo e sexismo se articulam produzindo posições específicas.',
   'Consigo aplicar interseccionalidade como análise de contingências combinadas em vez de somatória de identidades?'),

  ('intersexo', 'Intersexo', 'genero', 'genero', 'glossário',
   'Intersexo é termo guarda-chuva para variações inatas em características sexuais fora dos padrões típicos.',
   'Termo guarda-chuva para variações inatas em características sexuais que não correspondem a definições típicas de corpos femininos ou masculinos.',
   'Consigo usar o termo respeitando que "sexo" já é multidimensional?'),

  ('orientacao-sexual', 'Orientação sexual', 'genero', 'genero', 'glossário',
   'Orientação sexual são padrões de atração, vínculo e identificação — não comportamento único.',
   'Padrões de atração, vínculo, identificação e, em alguns usos, comportamento sexual.',
   'Consigo diferenciar orientação de comportamento sexual isolado num caso?'),

  ('performatividade', 'Performatividade', 'genero', 'genero', '11',
   'Performatividade é o processo pelo qual normas reiteradas produzem a aparência de identidade natural — não é performance voluntária.',
   'Processo pelo qual normas reiteradas produzem a aparência de uma identidade natural e anterior aos atos.',
   'Consigo explicar performatividade sem reduzir a "escolha"?'),

  ('reproducao-social', 'Reprodução social', 'genero', 'genero', '3.1',
   'Reprodução social é o trabalho e as instituições que mantêm e renovam a vida e a força de trabalho.',
   'Trabalho e instituições que mantêm e renovam a vida e a força de trabalho cotidiana e geracionalmente.',
   'Consigo mostrar como cuidado, casa e afeto são também trabalho no capitalismo?'),

  ('sexo-atribuido', 'Sexo atribuído ao nascer', 'genero', 'genero', 'glossário',
   'Sexo atribuído ao nascer é a classificação registrada no nascimento, geralmente baseada em aparência genital.',
   'Classificação registrada no nascimento, geralmente baseada na aparência genital.',
   'Consigo usar o termo sem naturalizá-lo como sinônimo de "sexo biológico"?'),

  ('transgeneridade', 'Transgeneridade', 'genero', 'genero', 'glossário',
   'Transgeneridade é a condição de quem não se identifica, total ou exclusivamente, com o gênero associado ao sexo atribuído ao nascer.',
   'Condição de quem não se identifica, total ou exclusivamente, com o gênero associado ao sexo atribuído ao nascer.',
   'Consigo usar o termo sem patologizar nem exigir "transição completa"?'),

  ('sete-dimensoes-sexo-genero', 'Sete dimensões de sexo/gênero', 'genero', 'genero', '1.1',
   'Sexo/gênero é multidimensional: 7 dimensões distintas que não devem ser confundidas.',
   'Cromossomos, gônadas, hormônios, genitália, características secundárias, identidade, expressão — dimensões separáveis empiricamente.',
   'Consigo listar as 7 dimensões e apontar erros de confundi-las?')

on conflict (slug) do update set
  titulo = excluded.titulo,
  tese = excluded.tese,
  definicao = excluded.definicao,
  criterio = excluded.criterio;

-- ============================================================
-- II. DAG — ARESTAS DO TRONCO → DUAS TRILHAS
-- ============================================================
-- Ordem interna do tronco AC (1 → 6): cada conceito requer o anterior.
insert into public.saber_prereq (conceito, requer, forca) values
  ('funcao-nao-topografia', 'contingencia-3-termos', 'duro'),
  ('reforco-negativo', 'contingencia-3-termos', 'duro'),
  ('operacao-motivadora', 'reforco-negativo', 'duro'),
  ('operacao-motivadora', 'funcao-nao-topografia', 'macio'),
  ('regras-autorregras', 'contingencia-3-termos', 'duro'),
  ('comunidade-verbal', 'regras-autorregras', 'macio'),
  ('pratica-cultural', 'comunidade-verbal', 'duro'),
  ('metacontingencia', 'pratica-cultural', 'duro'),

-- Trilha A — Gênero depende do tronco AC completo
  ('sete-dimensoes-sexo-genero', 'contingencia-3-termos', 'macio'),
  ('construcao-social', 'pratica-cultural', 'duro'),
  ('divisao-sexual-trabalho', 'construcao-social', 'duro'),
  ('reproducao-social', 'divisao-sexual-trabalho', 'duro'),
  ('identidade-genero', 'comunidade-verbal', 'duro'),
  ('expressao-genero', 'identidade-genero', 'macio'),
  ('cisgeneridade', 'identidade-genero', 'duro'),
  ('transgeneridade', 'identidade-genero', 'duro'),
  ('sexo-atribuido', 'sete-dimensoes-sexo-genero', 'duro'),
  ('intersexo', 'sete-dimensoes-sexo-genero', 'macio'),
  ('orientacao-sexual', 'sete-dimensoes-sexo-genero', 'macio'),
  ('heterocisnormatividade', 'metacontingencia', 'duro'),
  ('heterocisnormatividade', 'regras-autorregras', 'duro'),
  ('interseccionalidade', 'metacontingencia', 'duro'),
  ('performatividade', 'construcao-social', 'duro'),
  ('agencia-situada', 'operacao-motivadora', 'macio'),

-- Trilha B — QV/HAP depende do tronco AC completo
  ('funcao', 'funcao-nao-topografia', 'duro'),
  ('estimulo-discriminativo', 'contingencia-3-termos', 'duro'),
  ('reforcador', 'contingencia-3-termos', 'duro'),
  ('reforco-negativo-glossario', 'reforco-negativo', 'duro'),
  ('operacao-motivadora-glossario', 'operacao-motivadora', 'duro'),
  ('custo-resposta', 'reforcador', 'duro'),
  ('demanda', 'reforcador', 'duro'),
  ('elasticidade', 'demanda', 'duro'),
  ('custo-oportunidade', 'demanda', 'macio'),
  ('substituto', 'demanda', 'duro'),
  ('desconto-temporal', 'reforcador', 'duro'),
  ('perda-contingencias', 'reforcador', 'duro'),
  ('perda-contingencias', 'operacao-motivadora', 'duro'),
  ('adesao', 'perda-contingencias', 'duro'),
  ('qvrs', 'perda-contingencias', 'macio'),
  ('prom', 'qvrs', 'duro'),
  ('qv-qvrs-domínio-item', 'qvrs', 'duro'),
  ('granularidade', 'qv-qvrs-domínio-item', 'macio'),
  ('validade-conteudo', 'prom', 'duro'),
  ('responsividade', 'prom', 'duro'),
  ('mcid', 'responsividade', 'duro')
on conflict (conceito, requer) do nothing;

-- ============================================================
-- III. ITEMS — 1 camada 2 (explicação) por conceito.
-- ============================================================
-- A idéia é que a Fase 1 tenha um item por conceito pra você já poder
-- fechar o ciclo da sessão (Novo + Contraprova + Aplicação). Camadas 1
-- e 3 completas entram em seed posterior.
insert into public.saber_item (conceito, camada, enunciado, rubrica) values
  ('contingencia-3-termos', 2, 'Explique a contingência de 3 termos com um exemplo próprio.', '3 pontos: SD claro + resposta observável + consequência que explica manutenção.'),
  ('funcao-nao-topografia', 2, 'Dê 2 respostas idênticas em topografia mas diferentes em função no mesmo caso.', 'Nota 3: identifica a consequência distinta que mantém cada uma.'),
  ('reforco-negativo', 2, 'Explique por que reforço negativo NÃO é punição.', 'Nota 3: distingue "aumento da resposta" (reforço) de "diminuição" (punição) + cita a remoção do aversivo.'),
  ('operacao-motivadora', 2, 'Dê um exemplo em HAP em que uma OM altera o valor de um reforçador social.', 'Nota 3: separa "valor" (OM) de "disponibilidade" (SD).'),
  ('regras-autorregras', 2, 'Distinga um comportamento modelado por contingência direta de um controlado por regra.', 'Nota 3: aponta o enunciado da regra e o histórico de reforçamento por seguir/quebrar regras.'),
  ('comunidade-verbal', 2, 'Explique por que "sentir vergonha" também é comportamento social sem negar a experiência.', 'Nota 3: menciona os sinais públicos que a comunidade correlaciona ao rótulo interno.'),
  ('pratica-cultural', 2, 'Dê um exemplo de prática cultural que difere de comportamento individual apenas repetido.', 'Nota 3: cita o produto agregado e a manutenção transgeracional.'),
  ('metacontingencia', 2, 'Explique metacontingência sem cair em individualismo metodológico.', 'Nota 3: unidade selecionada = prática coordenada + produto agregado.'),

  ('adesao', 2, 'Reformule uma queixa de "paciente não adere" em termos funcionais.', 'Nota 3: aponta contingências reais que mantêm as respostas de não-adesão.'),
  ('custo-oportunidade', 2, 'Identifique o custo de oportunidade oculto em uma decisão clínica típica.', 'Nota 3: nomeia a alternativa abandonada e o valor dela pra pessoa.'),
  ('custo-resposta', 2, 'Estime como HAP eleva o custo de resposta de "encontrar amigos".', 'Nota 3: lista requisitos novos (transporte, O2, pausas) e como cada um pesa.'),
  ('demanda', 2, 'Desenhe (em texto) uma curva de demanda para "sair pra dançar" antes e depois da HAP.', 'Nota 3: menciona eixo preço × quantidade e ponto de ruptura.'),
  ('desconto-temporal', 2, 'Explique uma escolha "subótima" do paciente sem recorrer a impulsividade moral.', 'Nota 3: mostra como consequência atrasada perde controle sobre resposta atual.'),
  ('elasticidade', 2, 'Dê um reforçador elástico e um inelástico pro paciente da HAP.', 'Nota 3: justifica por que um cede fácil ao preço e o outro não.'),
  ('estimulo-discriminativo', 2, 'Explique a diferença entre SD e OM em um mesmo caso.', 'Nota 3: separa "sinaliza disponibilidade" de "altera valor".'),
  ('funcao', 2, 'Diante de um relato clínico, formule uma hipótese funcional (não descritiva).', 'Nota 3: identifica classe de respostas + consequência mantenedora.'),
  ('granularidade', 2, 'Justifique a granularidade escolhida do seu instrumento no artigo.', 'Nota 3: relaciona granularidade a objetivo de pesquisa + carga de resposta.'),
  ('mcid', 2, 'Explique a diferença entre significância estatística e MCID.', 'Nota 3: exemplo em que p<0.05 mas mudança clinicamente irrelevante.'),
  ('operacao-motivadora-glossario', 2, 'Explique OM com um caso da HAP em que ela muda o valor de um reforçador social.', 'Nota 3: mostra alteração de valor + evocação/abolição de respostas.'),
  ('prom', 2, 'Justifique escolher um PROM específico em vez de um genérico no seu artigo.', 'Nota 3: relaciona ao construto e à população.'),
  ('qvrs', 2, 'Diferencie QV geral de QVRS num mesmo caso.', 'Nota 3: mostra que QV cobre vida como um todo, QVRS recorta impacto da saúde.'),
  ('reforcador', 2, 'Explique por que "algo bom" não é sinônimo de reforçador.', 'Nota 3: cita critério empírico (aumenta a resposta?).'),
  ('reforco-negativo-glossario', 2, 'Ensine a diferença entre reforço negativo e punição pra um estudante iniciante.', 'Nota 3: aponta o AUMENTO da resposta + a REMOÇÃO do aversivo.'),
  ('responsividade', 2, 'Escolha um PROM responsivo pro desfecho do seu artigo e justifique.', 'Nota 3: cita evidência de responsividade em população similar.'),
  ('substituto', 2, 'Diferencie substituto de equivalente perfeito num caso clínico.', 'Nota 3: mostra o que se perde na substituição.'),
  ('validade-conteudo', 2, 'Como você avaliaria validade de conteúdo do instrumento X no seu artigo?', 'Nota 3: menciona relevância + abrangência + compreensibilidade em população-alvo.'),
  ('perda-contingencias', 2, 'Mapeie qual das 4 rotas de perda de contingências opera num caso da HAP.', 'Nota 3: nomeia a rota (desaparecimento / custo / ligação / SD) com evidência do relato.'),
  ('qv-qvrs-domínio-item', 2, 'Aponte, num artigo, quando o autor tratou item como se fosse domínio.', 'Nota 3: cita exemplo concreto + consequência interpretativa.'),

  ('agencia-situada', 2, 'Fale em agência sem cair em livre-arbítrio mágico nem em determinismo.', 'Nota 3: descreve possibilidades reais dado o contexto material.'),
  ('cisgeneridade', 2, 'Use "cisgeneridade" sem tratá-la como padrão não-marcado.', 'Nota 3: torna a norma visível em vez de pressuposta.'),
  ('construcao-social', 2, 'Explique "socialmente construído" sem que isso vire "não é real".', 'Nota 3: mostra que consequências reais decorrem da categorização social.'),
  ('divisao-sexual-trabalho', 2, 'Mapeie a divisão sexual do trabalho num caso clínico.', 'Nota 3: identifica tarefas produtivas/reprodutivas e o custo desigual.'),
  ('expressao-genero', 2, 'Diferencie expressão, identidade e orientação num mesmo caso.', 'Nota 3: separa as 3 categorias sem colapsar uma na outra.'),
  ('heterocisnormatividade', 2, 'Identifique heterocisnormatividade operando numa rotina institucional.', 'Nota 3: exemplo concreto + o que a rotina pressupõe sem dizer.'),
  ('identidade-genero', 2, 'Respeite a identidade da pessoa sem confundir com expressão ou orientação.', 'Nota 3: nomeia como a pessoa se reconhece + separa das outras dimensões.'),
  ('interseccionalidade', 2, 'Aplique interseccionalidade como análise de contingências combinadas.', 'Nota 3: mostra como duas ou mais estruturas se articulam produzindo posição específica.'),
  ('intersexo', 2, 'Use "intersexo" respeitando que "sexo" já é multidimensional.', 'Nota 3: cita as dimensões que dão pra estar em desalinho.'),
  ('orientacao-sexual', 2, 'Diferencie orientação sexual de comportamento sexual isolado.', 'Nota 3: mostra que orientação é padrão, não instância.'),
  ('performatividade', 2, 'Explique performatividade sem reduzi-la a "escolha".', 'Nota 3: normas reiteradas produzem aparência de identidade natural.'),
  ('reproducao-social', 2, 'Mostre como cuidado e afeto são também trabalho no capitalismo.', 'Nota 3: cita o trabalho invisível que mantém a força de trabalho.'),
  ('sexo-atribuido', 2, 'Use "sexo atribuído ao nascer" sem naturalizá-lo como "sexo biológico".', 'Nota 3: distingue registro social de conjunto de dimensões corporais.'),
  ('transgeneridade', 2, 'Use "transgeneridade" sem patologizar nem exigir "transição completa".', 'Nota 3: aceita variação de trajetórias e formas de existir trans.'),
  ('sete-dimensoes-sexo-genero', 2, 'Liste as 7 dimensões de sexo/gênero e aponte um erro comum de confundi-las.', 'Nota 3: nomeia as 7 + dá um exemplo de confusão comum.')
on conflict do nothing;

-- ============================================================
-- IV. FONTES — 5 correções + algumas íntegras.
-- ============================================================
insert into public.saber_fonte (citacao, doi, ano, estado, nota) values
  ('Morris, C. et al. The Treatment of LGBTQ+ Individuals in Behavior-Analytic Publications. Behavior Analysis in Practice, 14(4), 1179–1190, 2021.',
   '10.1007/s40617-020-00546-4', 2021, 'ok',
   'Apostila trazia 15, 127–139, 2022, DOI 10.1007/s40617-021-00589-3 (404). Corrigido via Crossref.'),

  ('Baires, N. A.; Koch, D. S. The Future Is Female (and Behavior Analysis). Behavior Analysis in Practice, 13, 253–262, 2020.',
   '10.1007/s40617-019-00394-x', 2020, 'ok',
   'DOI da apostila (10.1007/s40617-019-00364-9) não existe. Corrigido via Crossref.'),

  ('American Psychological Association. Guidelines for Psychological Practice with Sexual Minority Persons. American Psychologist, 77(8), 953–962, 2022.',
   '10.1037/amp0000939', 2022, 'ok',
   'Apostila trazia 77(5), 652–677 e DOI do executive summary. Corrigido para o guideline real.'),

  ('McKenna, S. P., Doughty, N., Meads, D. M. et al. The Cambridge Pulmonary Hypertension Outcome Review (CAMPHOR). Quality of Life Research, 15, 103–115, 2006.',
   null, 2006, 'ok',
   'CAMPHOR não tinha referência nenhuma na apostila apesar de sustentar a lacuna central do artigo. Adicionado.'),

  ('DeFelice, K. A.; Diller, J. W. Intersectional Feminism and Behavior Analysis. Behavior Analysis in Practice, 12, 831–838, 2019.',
   '10.1007/s40617-019-00341-w', 2019, 'ok',
   'Conferido: apostila estava correta.')
on conflict do nothing;
