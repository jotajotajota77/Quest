// ============================================================
// DAG utilities (v12.9). Puro, sem I/O.
// ------------------------------------------------------------
// Um grafo, três sorts:
//   1. didatica    — topológica sobre arestas 'duro' + gate por mastery
//   2. cronologica — por ano_origem crescente; SÓ oferece conceitos já
//                    abertos pela didática (leia Engels só depois de ter
//                    "prática cultural")
//   3. projeto     — agrupado por gancho (seção do artigo); ignora o
//                    DAG e avisa o que está faltando
// ============================================================
import type {
  Aresta,
  Conceito,
  MasteryConceito,
  OrdemEstudo,
} from "./tipos";
import { NIVEL_ABRE_DEPENDENTE } from "./tipos";

/** Nivel do conceito no snapshot de mastery. 0 se ainda não tocou. */
export function nivelDoConceito(
  masteries: MasteryConceito[],
  slug: string,
): 0 | 1 | 2 | 3 {
  const m = masteries.find((x) => x.conceito === slug);
  return (m?.nivel ?? 0) as 0 | 1 | 2 | 3;
}

/**
 * Um conceito está ABERTO quando todos seus prereqs 'duro' estão com
 * nivel ≥ NIVEL_ABRE_DEPENDENTE.
 */
export function conceitoAberto(
  slug: string,
  arestas: Aresta[],
  masteries: MasteryConceito[],
): boolean {
  const duros = arestas.filter((a) => a.conceito === slug && a.forca === "duro");
  return duros.every((a) => nivelDoConceito(masteries, a.requer) >= NIVEL_ABRE_DEPENDENTE);
}

/**
 * Ordenação topológica (Kahn) usando SÓ arestas 'duro'. Determinística
 * por titulo pra desempatar. Ciclos disparam Error — mas a seed foi
 * construída sem ciclos.
 */
export function ordenacaoTopologica(
  conceitos: Conceito[],
  arestas: Aresta[],
): Conceito[] {
  const arestasDuro = arestas.filter((a) => a.forca === "duro");
  const grau = new Map<string, number>();
  const adjacencia = new Map<string, string[]>(); // requer → [conceitos que dependem]
  for (const c of conceitos) grau.set(c.slug, 0);
  for (const a of arestasDuro) {
    if (!grau.has(a.conceito) || !grau.has(a.requer)) continue;
    grau.set(a.conceito, (grau.get(a.conceito) ?? 0) + 1);
    const list = adjacencia.get(a.requer) ?? [];
    list.push(a.conceito);
    adjacencia.set(a.requer, list);
  }
  const fila: string[] = [];
  for (const [slug, g] of grau) if (g === 0) fila.push(slug);
  fila.sort();
  const out: Conceito[] = [];
  while (fila.length > 0) {
    const slug = fila.shift()!;
    const c = conceitos.find((x) => x.slug === slug);
    if (c) out.push(c);
    for (const dep of adjacencia.get(slug) ?? []) {
      const novo = (grau.get(dep) ?? 1) - 1;
      grau.set(dep, novo);
      if (novo === 0) {
        // insere ordenado
        const idx = fila.findIndex((s) => s.localeCompare(dep) > 0);
        if (idx < 0) fila.push(dep);
        else fila.splice(idx, 0, dep);
      }
    }
  }
  if (out.length !== conceitos.length) {
    throw new Error(`Ciclo no DAG: ${conceitos.length - out.length} conceitos não ordenados.`);
  }
  return out;
}

/**
 * Ordem DIDÁTICA: ordena topologicamente e retorna PRIMEIRO os abertos
 * (por mastery), então os bloqueados. Assim o próximo conceito a estudar
 * é sempre o topo do array filtrado por aberto.
 */
export function ordemDidatica(
  conceitos: Conceito[],
  arestas: Aresta[],
  masteries: MasteryConceito[],
): Array<Conceito & { aberto: boolean; nivel: 0 | 1 | 2 | 3 }> {
  const topo = ordenacaoTopologica(conceitos, arestas);
  return topo.map((c) => ({
    ...c,
    aberto: conceitoAberto(c.slug, arestas, masteries),
    nivel: nivelDoConceito(masteries, c.slug),
  }));
}

/**
 * Ordem CRONOLÓGICA: por ano_origem crescente. FILTRA pra retornar SÓ
 * conceitos já abertos pela didática — nunca é a primeira passada.
 * Retorno inclui todos (pra visualização) mas marca aberto.
 */
export function ordemCronologica(
  conceitos: Conceito[],
  arestas: Aresta[],
  masteries: MasteryConceito[],
): Array<Conceito & { aberto: boolean }> {
  return conceitos
    .filter((c) => c.ano_origem != null)
    .map((c) => ({ ...c, aberto: conceitoAberto(c.slug, arestas, masteries) }))
    .sort((a, b) => (a.ano_origem ?? 0) - (b.ano_origem ?? 0));
}

/**
 * Ordem POR PROJETO: agrupa por gancho (seção do artigo). Ignora o DAG,
 * mas retorna a flag `aberto` pra a UI avisar o que ainda depende de
 * pré-requisito.
 */
export function ordemProjeto(
  conceitos: Conceito[],
  arestas: Aresta[],
  masteries: MasteryConceito[],
): Array<{ gancho: string; conceitos: Array<Conceito & { aberto: boolean }> }> {
  const porGancho = new Map<string, Array<Conceito & { aberto: boolean }>>();
  for (const c of conceitos) {
    if (!c.gancho) continue;
    const key = c.gancho;
    const arr = porGancho.get(key) ?? [];
    arr.push({ ...c, aberto: conceitoAberto(c.slug, arestas, masteries) });
    porGancho.set(key, arr);
  }
  return Array.from(porGancho.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([gancho, cs]) => ({ gancho, conceitos: cs }));
}

/** Facade pra escolher ordem dinamicamente. */
export function aplicarOrdem(
  ordem: OrdemEstudo,
  conceitos: Conceito[],
  arestas: Aresta[],
  masteries: MasteryConceito[],
): Conceito[] {
  switch (ordem) {
    case "didatica":
      return ordemDidatica(conceitos, arestas, masteries)
        .filter((c) => c.aberto)
        .map(({ aberto: _a, nivel: _n, ...c }) => c);
    case "cronologica":
      return ordemCronologica(conceitos, arestas, masteries)
        .filter((c) => c.aberto)
        .map(({ aberto: _a, ...c }) => c);
    case "projeto":
      return ordemProjeto(conceitos, arestas, masteries)
        .flatMap((g) => g.conceitos.filter((c) => c.aberto))
        .map(({ aberto: _a, ...c }) => c);
  }
}
