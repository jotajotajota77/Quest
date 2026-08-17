// ============================================================
// /saber/sessao — sessão de estudo Fase 1. Wrapper server component
// que carrega o conceito + items e passa pro <SaberSessao/> client.
// ============================================================
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { carregarConceitos, montarRoteiroSessao } from "@/lib/saber/data";
import SaberSessao from "@/components/SaberSessao";

export default async function SaberSessaoPage({
  searchParams,
}: {
  searchParams: { slug?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug = searchParams.slug ?? null;
  if (!slug) redirect("/saber");

  const conceitos = await carregarConceitos();
  const conceito = conceitos.find((c) => c.slug === slug);
  if (!conceito) redirect("/saber");

  const roteiro = await montarRoteiroSessao(conceito);

  return (
    <main className="app-shell" style={{ paddingBottom: 120 }}>
      <SaberSessao conceito={conceito} roteiro={roteiro} />
      <BottomNav />
    </main>
  );
}
