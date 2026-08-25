// ============================================================
// Adaptive Physique RPG — POST /api/checkin (PR1).
// ------------------------------------------------------------
// Um endpoint, dois modos:
//   - action: 'daily'  → upsert em daily_checkin (peso opcional).
//   - action: 'weekly' → upsert em weekly_checkin (3 medidas cintura).
//
// XP: PR1 NÃO dá XP por check-in. Só grava. XP entra no PR2 (§27 diz que
// XP não pode vir de "perder peso" ou "comer menos"; check-in é neutro).
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  salvarCheckinDiario,
  salvarCheckinSemanal,
  garantirFaseAtiva,
} from "@/lib/physique/data";
import type {
  DailyCheckinInput,
  Humor,
  WeeklyCheckinInput,
} from "@/lib/physique/tipos";

const HUMORES: Humor[] = ["otimo", "normal", "cansado", "destruido"];

interface DailyBody {
  action: "daily";
  data?: string;
  peso_kg?: number | null;
  sono_h?: number | null;
  sono_qualidade?: number | null;
  fome?: number | null;
  energia?: number | null;
  dor?: number | null;
  stress?: number | null;
  treino_previsto?: boolean;
  tkd_previsto?: boolean;
  danca_prevista?: boolean;
  humor?: string | null;
  nota?: string | null;
}

interface WeeklyBody {
  action: "weekly";
  semana_iso?: string;
  cintura_medida_1?: number | null;
  cintura_medida_2?: number | null;
  cintura_medida_3?: number | null;
  proteina_pct?: number | null;
  calorias_pct?: number | null;
  fome_media?: number | null;
  sono_h_medio?: number | null;
  tkd_sessoes?: number | null;
  danca_sessoes?: number | null;
  foto_ids?: number[];
}

type Body = DailyBody | WeeklyBody;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const raw = (await request.json().catch(() => null)) as Body | null;
  if (!raw || (raw.action !== "daily" && raw.action !== "weekly")) {
    return NextResponse.json({ error: "action inválido" }, { status: 400 });
  }

  // Garante que a fase ativa existe antes de gravar qualquer coisa.
  await garantirFaseAtiva(user.id);

  if (raw.action === "daily") {
    const entrada: DailyCheckinInput = {
      data: raw.data,
      peso_kg: normalizarNumero(raw.peso_kg),
      sono_h: normalizarNumero(raw.sono_h, 0, 24),
      sono_qualidade: normalizarInt(raw.sono_qualidade, 1, 5),
      fome: normalizarInt(raw.fome, 0, 10),
      energia: normalizarInt(raw.energia, 0, 10),
      dor: normalizarInt(raw.dor, 0, 10),
      stress: normalizarInt(raw.stress, 0, 10),
      treino_previsto: raw.treino_previsto === true,
      tkd_previsto: raw.tkd_previsto === true,
      danca_prevista: raw.danca_prevista === true,
      humor: HUMORES.includes(raw.humor as Humor) ? (raw.humor as Humor) : null,
      nota: raw.nota ?? null,
    };
    const row = await salvarCheckinDiario(user.id, entrada);
    return NextResponse.json({ ok: true, checkin: row });
  }

  const entrada: WeeklyCheckinInput = {
    semana_iso: raw.semana_iso,
    cintura_medida_1: normalizarNumero(raw.cintura_medida_1, 40, 180),
    cintura_medida_2: normalizarNumero(raw.cintura_medida_2, 40, 180),
    cintura_medida_3: normalizarNumero(raw.cintura_medida_3, 40, 180),
    proteina_pct: normalizarInt(raw.proteina_pct, 0, 200),
    calorias_pct: normalizarInt(raw.calorias_pct, 0, 200),
    fome_media: normalizarNumero(raw.fome_media, 0, 10),
    sono_h_medio: normalizarNumero(raw.sono_h_medio, 0, 24),
    tkd_sessoes: normalizarInt(raw.tkd_sessoes, 0, 14),
    danca_sessoes: normalizarInt(raw.danca_sessoes, 0, 14),
    foto_ids: Array.isArray(raw.foto_ids) ? raw.foto_ids.filter((n) => Number.isFinite(n)) : [],
  };
  const row = await salvarCheckinSemanal(user.id, entrada);
  return NextResponse.json({ ok: true, checkin: row });
}

function normalizarNumero(n: unknown, min?: number, max?: number): number | null {
  if (n === null || n === undefined || n === "") return null;
  const v = typeof n === "string" ? Number(n) : (n as number);
  if (!Number.isFinite(v)) return null;
  if (typeof min === "number" && v < min) return null;
  if (typeof max === "number" && v > max) return null;
  return v;
}

function normalizarInt(n: unknown, min: number, max: number): number | null {
  const v = normalizarNumero(n, min, max);
  return v == null ? null : Math.round(v);
}
