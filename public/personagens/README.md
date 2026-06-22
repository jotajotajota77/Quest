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
