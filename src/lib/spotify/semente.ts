// ============================================================
// Semente de música (modo NORTEAR) — ponto de partida curado pro reforçador da
// Nutri. NÃO é a lista final: o motor real é o Search ao vivo filtrado por
// POPULARIDADE (recorte emergente) nesses gêneros + artistas de referência.
// Perfil: novo/menos conhecido (médio/emergente), nada de mega-mainstream.
// Editável à vontade.
// ============================================================

// Gêneros-semente (termos de busca). O recorte "emergente" vem do filtro de
// popularidade, não do gênero em si.
export const GENEROS_SEMENTE = [
  "k-pop",
  "city pop",
  "indie pop",
  "alternative pop",
  "r&b",
  "pop",
  "indie",
  "indie folk",
  "bedroom pop",
  "dream pop",
];

// Artistas de referência (médio/emergente). O app expande via Search/Top Tracks
// — não fica preso a estes nomes.
export const ARTISTAS_SEMENTE = [
  // K-pop (girl groups underrated/médio-porte)
  "IVE", "GFRIEND", "woo!ah!", "Rocket Punch", "ILLIT", "STAYC", "Weeekly",
  "Kep1er", "fromis_9", "OH MY GIRL", "NMIXX", "WJSN", "Billlie", "Purple Kiss",
  "Cignature", "Cherry Bullet", "CSR", "LIGHTSUM", "Apink", "Lovelyz", "Young Posse",
  // City pop (revival + clássicos menos conhecidos)
  "Ginger Root", "Phum Viphurit", "Pearl & The Oysters", "Yot Club",
  "Kaoru Akimoto", "Hitomi Tohyama", "Meiko Nakahara", "Kingo Hamada",
  // Indie pop
  "Men I Trust", "Dayglow", "Peach Pit", "Faye Webster", "The Marías", "Crumb",
  "Spacey Jane", "Briston Maroney",
  // Alternative pop
  "Magdalena Bay", "Remi Wolf", "Holly Humberstone", "Suki Waterhouse",
  "Maude Latour", "Del Water Gap", "Tessa Violet",
  // R&B
  "Lucky Daye", "UMI", "Ravyn Lenae", "Pink Sweat$", "Mahalia", "Coco Jones",
  "FLO", "Amber Mark", "Snoh Aalegra",
  // Pop
  "Role Model", "Maisie Peters", "Gracie Abrams", "Lizzy McAlpine",
  "Hemlocke Springs", "Em Beihold", "Stephen Sanchez", "mxmtoon",
  "Alexander 23", "Lyn Lapid",
];

// Banda de popularidade do recorte emergente (campo `popularity` 0–100 do
// Spotify): corta megahit (>ALTA) e faixa morta (<BAIXA).
export const POP_MIN = 20;
export const POP_MAX = 65;
