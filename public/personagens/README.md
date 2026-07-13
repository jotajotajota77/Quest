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

Mapa nome → slug (v9 — só Treino/Força e Nutri/Stamina; 2 personagens por
atributo, `donoDoAtributo` usa o de menor `ordem` como "dono" padrão):
- Zyan Polska (Iron Core / Força / Treino) → `zyan-polska`
- Dhavos Tavera (Beast Warden / Força / Treino) → `dhavos-tavera`
- Kai Ryuen (Cardio Knight / Stamina / Nutri) → `kai-ryuen`
- Luan Santos (Dance Magician / Stamina / Nutri, ênfase cardio) → `luan-santos`

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

## Slots bloqueados — removidos (v9)

A migration `0014_v9_cutting.sql` apaga os slots `slot-5`…`slot-9`: o sistema
agora é fechado (Treino + Nutrição, 4 personagens fixos), sem extensibilidade.
