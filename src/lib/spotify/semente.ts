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

// ============================================================
// Faixas-semente (Apêndice B) — pares "Artista — Faixa" pra resolução direta
// via Search (`track:"<faixa>" artist:"<artista>"`). Ponto de partida, não a
// lista final: se uma faixa não resolver (título levemente errado etc.), o
// Search simplesmente não acha ela — sem quebrar nada, o motor tenta outra.
// ============================================================
export interface FaixaSemente {
  artista: string;
  faixa: string;
}

export const FAIXAS_SEMENTE: FaixaSemente[] = [
  // K-pop (girl groups underrated / médio-porte)
  { artista: "IVE", faixa: "Eleven" }, { artista: "IVE", faixa: "Love Dive" },
  { artista: "IVE", faixa: "After Like" }, { artista: "IVE", faixa: "I AM" },
  { artista: "IVE", faixa: "Kitsch" }, { artista: "IVE", faixa: "Baddie" },
  { artista: "IVE", faixa: "Either Way" }, { artista: "IVE", faixa: "HEYA" },
  { artista: "IVE", faixa: "Accendio" },
  { artista: "GFRIEND", faixa: "Rough" }, { artista: "GFRIEND", faixa: "Time for the Moon Night" },
  { artista: "GFRIEND", faixa: "Navillera" }, { artista: "GFRIEND", faixa: "Mago" },
  { artista: "GFRIEND", faixa: "Apple" }, { artista: "GFRIEND", faixa: "Me Gustas Tu" },
  { artista: "GFRIEND", faixa: "Glass Bead" }, { artista: "GFRIEND", faixa: "Fingertip" },
  { artista: "GFRIEND", faixa: "Sunrise" },
  { artista: "woo!ah!", faixa: "Bad Girl" }, { artista: "woo!ah!", faixa: "Purple" },
  { artista: "woo!ah!", faixa: "Catch the Stars" }, { artista: "woo!ah!", faixa: "Danger" },
  { artista: "woo!ah!", faixa: "Rollercoaster" }, { artista: "woo!ah!", faixa: "Blush" },
  { artista: "woo!ah!", faixa: "Pom Pom Pom" }, { artista: "woo!ah!", faixa: "I Don't Miss U" },
  { artista: "Rocket Punch", faixa: "Bim Bam Bum" }, { artista: "Rocket Punch", faixa: "Bouncy" },
  { artista: "Rocket Punch", faixa: "Ring Ring" }, { artista: "Rocket Punch", faixa: "Juicy" },
  { artista: "Rocket Punch", faixa: "Chiquita" },
  { artista: "ILLIT", faixa: "Magnetic" }, { artista: "ILLIT", faixa: "Lucky Girl Syndrome" },
  { artista: "ILLIT", faixa: "Cherish (My Love)" }, { artista: "ILLIT", faixa: "Tick-Tack" },
  { artista: "STAYC", faixa: "ASAP" }, { artista: "STAYC", faixa: "So Bad" },
  { artista: "STAYC", faixa: "Stereotype" }, { artista: "STAYC", faixa: "Run2U" },
  { artista: "STAYC", faixa: "Teddy Bear" }, { artista: "STAYC", faixa: "Bubble" },
  { artista: "Weeekly", faixa: "After School" }, { artista: "Weeekly", faixa: "Tag Me" },
  { artista: "Weeekly", faixa: "Holiday Party" },
  { artista: "Kep1er", faixa: "WA DA DA" }, { artista: "Kep1er", faixa: "Up!" },
  { artista: "Kep1er", faixa: "Giddy" },
  { artista: "fromis_9", faixa: "Love Bomb" }, { artista: "fromis_9", faixa: "DM" },
  { artista: "fromis_9", faixa: "Stay This Way" }, { artista: "fromis_9", faixa: "Talk & Talk" },
  { artista: "OH MY GIRL", faixa: "Dolphin" }, { artista: "OH MY GIRL", faixa: "Nonstop" },
  { artista: "OH MY GIRL", faixa: "Secret Garden" }, { artista: "OH MY GIRL", faixa: "Closer" },
  { artista: "OH MY GIRL", faixa: "Dun Dun Dance" },
  { artista: "NMIXX", faixa: "O.O" }, { artista: "NMIXX", faixa: "DICE" },
  { artista: "NMIXX", faixa: "Love Me Like This" }, { artista: "NMIXX", faixa: "DASH" },
  { artista: "WJSN", faixa: "As You Wish" }, { artista: "WJSN", faixa: "Boogie Up" },
  { artista: "WJSN", faixa: "Save Me, Save You" }, { artista: "WJSN", faixa: "Unnatural" },
  { artista: "Billlie", faixa: "GingaMingaYo" }, { artista: "Billlie", faixa: "RING ma Bell" },
  { artista: "Billlie", faixa: "Trampoline" },
  { artista: "Purple Kiss", faixa: "Ponzona" }, { artista: "Purple Kiss", faixa: "memeM" },
  { artista: "Purple Kiss", faixa: "Zombie" },
  { artista: "Cignature", faixa: "Nun Nu Nan Na" }, { artista: "Cignature", faixa: "ASSA" },
  { artista: "Cignature", faixa: "Boyfriend" }, { artista: "Cignature", faixa: "Smooth Sailing" },
  { artista: "Cherry Bullet", faixa: "Q&A" }, { artista: "Cherry Bullet", faixa: "Hands Up" },
  { artista: "CSR", faixa: "Pop? Pop!" }, { artista: "CSR", faixa: "Eighteen (Signal)" },
  { artista: "LIGHTSUM", faixa: "Vanilla" }, { artista: "LIGHTSUM", faixa: "Vivace" },
  { artista: "Apink", faixa: "%% (Eung Eung)" }, { artista: "Apink", faixa: "Dumhdurum" },
  { artista: "Apink", faixa: "Mr. Chu" },
  { artista: "Lovelyz", faixa: "Destiny" }, { artista: "Lovelyz", faixa: "Ah-Choo" },
  { artista: "Young Posse", faixa: "MACARONI CHEESE" },

  // City pop (revival moderno + clássicos menos conhecidos)
  { artista: "Ginger Root", faixa: "Loretta" }, { artista: "Ginger Root", faixa: "Holy Hell" },
  { artista: "Ginger Root", faixa: "Karaoke" }, { artista: "Ginger Root", faixa: "No Problems" },
  { artista: "Ginger Root", faixa: "Better Than Monday" }, { artista: "Ginger Root", faixa: "There Was a Time" },
  { artista: "Phum Viphurit", faixa: "Lover Boy" }, { artista: "Phum Viphurit", faixa: "Hello, Anyone?" },
  { artista: "Pearl & The Oysters", faixa: "Read the Room" }, { artista: "Pearl & The Oysters", faixa: "Treasure Planet" },
  { artista: "Yot Club", faixa: "YKWIM?" },
  { artista: "Kaoru Akimoto", faixa: "Dress Down" },
  { artista: "Hitomi Tohyama", faixa: "Exotic Yokogao" },
  { artista: "Meiko Nakahara", faixa: "Fantasy" },
  { artista: "Kingo Hamada", faixa: "Machi no Diary" },

  // Indie pop (médio/emergente)
  { artista: "Men I Trust", faixa: "Show Me How" }, { artista: "Men I Trust", faixa: "Numb" },
  { artista: "Men I Trust", faixa: "Tailwhip" }, { artista: "Men I Trust", faixa: "Lauren" },
  { artista: "Men I Trust", faixa: "Pierre" },
  { artista: "Dayglow", faixa: "Can I Call You Tonight?" }, { artista: "Dayglow", faixa: "Close to You" },
  { artista: "Dayglow", faixa: "Hot Rod" }, { artista: "Dayglow", faixa: "Medicine" },
  { artista: "Peach Pit", faixa: "Tommy's Party" }, { artista: "Peach Pit", faixa: "Alrighty Aphrodite" },
  { artista: "Peach Pit", faixa: "Black Licorice" },
  { artista: "Faye Webster", faixa: "Kingston" }, { artista: "Faye Webster", faixa: "Right Side of My Neck" },
  { artista: "Faye Webster", faixa: "She Won't Go Away" }, { artista: "Faye Webster", faixa: "Better Distractions" },
  { artista: "The Marías", faixa: "Hush" }, { artista: "The Marías", faixa: "Cariño" },
  { artista: "The Marías", faixa: "Only in My Dreams" },
  { artista: "Crumb", faixa: "Locket" },
  { artista: "Spacey Jane", faixa: "Booster Seat" },
  { artista: "Briston Maroney", faixa: "Freakin' Out on the Interstate" },

  // Alternative pop (médio/emergente)
  { artista: "Magdalena Bay", faixa: "Killshot" }, { artista: "Magdalena Bay", faixa: "You Lose!" },
  { artista: "Magdalena Bay", faixa: "Image" }, { artista: "Magdalena Bay", faixa: "Chaeri" },
  { artista: "Remi Wolf", faixa: "Photo ID" }, { artista: "Remi Wolf", faixa: "Liz" },
  { artista: "Remi Wolf", faixa: "Hello Hello" },
  { artista: "Holly Humberstone", faixa: "Scarlett" }, { artista: "Holly Humberstone", faixa: "Falling Asleep at the Wheel" },
  { artista: "Holly Humberstone", faixa: "The Walls Are Way Too Thin" },
  { artista: "Suki Waterhouse", faixa: "Good Looking" }, { artista: "Suki Waterhouse", faixa: "Moves" },
  { artista: "Maude Latour", faixa: "Walk Backwards" }, { artista: "Maude Latour", faixa: "Headphones" },
  { artista: "Del Water Gap", faixa: "Ode to a Conversation Stuck in Your Throat" }, { artista: "Del Water Gap", faixa: "High Tops" },
  { artista: "Tessa Violet", faixa: "Crush" }, { artista: "Tessa Violet", faixa: "Bad Ideas" },

  // R&B (médio/emergente)
  { artista: "Lucky Daye", faixa: "Over" }, { artista: "Lucky Daye", faixa: "Roll Some Mo" },
  { artista: "Lucky Daye", faixa: "Karma" },
  { artista: "UMI", faixa: "Remember Me" }, { artista: "UMI", faixa: "love affair" },
  { artista: "UMI", faixa: "wherever u r" },
  { artista: "Ravyn Lenae", faixa: "Sticky" }, { artista: "Ravyn Lenae", faixa: "Love Me Not" },
  { artista: "Ravyn Lenae", faixa: "Sucker for You" },
  { artista: "Pink Sweat$", faixa: "At My Worst" }, { artista: "Pink Sweat$", faixa: "Honesty" },
  { artista: "Mahalia", faixa: "Sober" }, { artista: "Mahalia", faixa: "What You Did" },
  { artista: "Coco Jones", faixa: "ICU" },
  { artista: "Flo", faixa: "Cardboard Box" },
  { artista: "Amber Mark", faixa: "Worth It" },
  { artista: "Snoh Aalegra", faixa: "I Want You Around" },

  // Pop (médio/emergente)
  { artista: "Role Model", faixa: "Sally, When the Wine Runs Out" }, { artista: "Role Model", faixa: "neverletyougo" },
  { artista: "Maisie Peters", faixa: "Blonde" }, { artista: "Maisie Peters", faixa: "Cate's Brother" },
  { artista: "Maisie Peters", faixa: "Lost the Breakup" }, { artista: "Maisie Peters", faixa: "Body Better" },
  { artista: "Gracie Abrams", faixa: "Risk" }, { artista: "Gracie Abrams", faixa: "I miss you, I'm sorry" },
  { artista: "Gracie Abrams", faixa: "Close to You" },
  { artista: "Lizzy McAlpine", faixa: "ceilings" }, { artista: "Lizzy McAlpine", faixa: "erase me" },
  { artista: "Hemlocke Springs", faixa: "girlfriend" }, { artista: "Hemlocke Springs", faixa: "sever the blight" },
  { artista: "Em Beihold", faixa: "Numb Little Bug" },
  { artista: "Stephen Sanchez", faixa: "Until I Found You" }, { artista: "Stephen Sanchez", faixa: "Evangeline" },
  { artista: "mxmtoon", faixa: "prom dress" },
  { artista: "Alexander 23", faixa: "IDK You Yet" },
  { artista: "Lyn Lapid", faixa: "Producer Man" },
];
