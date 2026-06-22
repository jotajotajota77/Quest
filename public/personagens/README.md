# Assets dos personagens

A UI procura cada imagem nestes caminhos (referenciados no banco em
`personagens.asset_rosto` / `asset_corpo`):

```
public/personagens/zyan-polska/rosto.png
public/personagens/zyan-polska/corpo.png
public/personagens/kai-ryuen/rosto.png
public/personagens/kai-ryuen/corpo.png
public/personagens/luan-santos/rosto.png
public/personagens/luan-santos/corpo.png
public/personagens/dhavos-tavera/rosto.png
public/personagens/dhavos-tavera/corpo.png
```

Mapa nome → slug:
- Zyan Polska (Iron Core / Força / Treino) → `zyan-polska`
- Kai Ryuen (Cardio Knight / Stamina / Nutri) → `kai-ryuen`
- Luan Santos (Dance Magician / Destreza / Dança) → `luan-santos`
- Dhavos Tavera (Beast Warden / Sabedoria / Leitura) → `dhavos-tavera`

`rosto.png` = retrato (mostrado no grid do hub). `corpo.png` = corpo inteiro
(revelado ao clicar). PNG com transparência, corpo recortado, é o ideal.

Enquanto o arquivo não existir, a UI cai num placeholder com a inicial do nome —
sem quebrar. Basta soltar os PNGs aqui e commitar.

## Imagens contextuais (v4)

Além de `rosto.png` e `corpo.png`, cada personagem pode ter imagens de ação /
atributo por contexto, em `public/personagens/<slug>/`:

```
acao-treino.png   acao-nutri.png   acao-leitura.png   acao-danca.png
atributo.png      (genérica, fallback)
```

Ou, se hospedar no Supabase Storage, preencha o jsonb `personagens.assets_contexto`:
`{ "treino": "<url>", "nutri": "...", "leitura": "...", "danca": "...", "atributo": "..." }`.

Regra de exibição (com fallback gracioso, nunca quebra layout): protagonista do
dia no contexto da aba → atributo/genérica do protagonista → dono do atributo no
contexto → placeholder neutro (silhueta). Enquanto faltarem, aparece a silhueta.

## Slots bloqueados (v4)

`slot-5`…`slot-9` nascem **bloqueados** (silhueta + cadeado no hub, não
selecionáveis), com atributo/comportamento/bônus `null`. Para criar um: preencha
`nome, titulo, atributo_foco, comportamento_alvo, bonus, asset_rosto, asset_corpo,
assets_contexto, bio` e marque `desbloqueado = true`. A engine de bônus aceita
qualquer mapeamento personagem→comportamento (inclusive vários no mesmo atributo).
