// Aba Nutri — 1-toque (piso) + motor de instalação + tela rica (design
// replicado) + coach gated. O 1-toque fica no topo (BehaviorTab); a tela de
// alimentos/macros é o caminho detalhado OPCIONAL.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { coachNutriAtivo, nutriHoje, resumoMacrosNutri } from "@/lib/data";
import BehaviorTab from "@/components/BehaviorTab";
import NutriDashboard from "@/components/NutriDashboard";

export default async function NutriPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [ativo, refeicoes] = await Promise.all([
    coachNutriAtivo(user.id),
    nutriHoje(user.id),
  ]);
  const resumo = ativo ? await resumoMacrosNutri(user.id) : null;

  return (
    <BehaviorTab familia="nutri" coachAtivo={ativo} ocultarHistorico>
      {ativo && resumo && resumo.nComMacros > 0 && (
        <div className="panel" style={{ marginTop: 18, borderColor: "var(--gold)" }}>
          <div className="lbl">Coach da Nutri</div>
          <div className="subtle" style={{ marginTop: 4 }}>
            Últimos 7 dias: média <strong>{resumo.mediaKcal} kcal</strong> ·{" "}
            <strong>{resumo.mediaProteina} g</strong> proteína.
          </div>
        </div>
      )}
      <NutriDashboard refeicoes={refeicoes} />
    </BehaviorTab>
  );
}
