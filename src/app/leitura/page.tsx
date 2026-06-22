// Aba Leitura — camada universal + motor de leitura (afinamento): cada N
// leituras DESBLOQUEIA um fragmento do mundo VHYX. Reforço por IDENTIDADE,
// sem música (que competiria com ler). Passivo: derivado da contagem de logs.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarFamilia } from "@/lib/data";
import BehaviorTab from "@/components/BehaviorTab";

// Fragmentos desbloqueáveis pela leitura (identidade, não engine diária).
const FRAGMENTOS = [
  "2087 — dezesseis anos após o Colapso. A ordem voltou sobre vigilância total.",
  "CADEIA promete 'restaurar' quem desvia. Cada célula caça os que ainda respondem.",
  "Operadores VHYX não lutam com armas — lutam com constância.",
  "Dhavos, o Beast Warden: 'Quem cuida, dura.' A leitura é o vínculo que percebe em rede.",
  "Nos Subúrbios Lentos, ler é resistir: cada página é um território que o sistema não mapeia.",
];
const LEITURAS_POR_FRAGMENTO = 3;

export default async function LeituraPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const total = await contarFamilia(user.id, ["leitura"]);
  const desbloqueados = Math.min(
    FRAGMENTOS.length,
    Math.floor(total / LEITURAS_POR_FRAGMENTO),
  );
  const faltam = LEITURAS_POR_FRAGMENTO - (total % LEITURAS_POR_FRAGMENTO);

  return (
    <BehaviorTab familia="leitura">
      <div className="panel" style={{ marginTop: 18, borderColor: "var(--neon-2)" }}>
        <div className="lbl">
          Fragmentos do mundo · {desbloqueados}/{FRAGMENTOS.length}
        </div>
        {desbloqueados === 0 ? (
          <p className="subtle" style={{ margin: "6px 0 0" }}>
            Leia e registre {LEITURAS_POR_FRAGMENTO}× para desbloquear o 1º
            fragmento.
          </p>
        ) : (
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {FRAGMENTOS.slice(0, desbloqueados).map((f) => (
              <li key={f} className="subtle" style={{ marginBottom: 6 }}>
                {f}
              </li>
            ))}
          </ul>
        )}
        {desbloqueados < FRAGMENTOS.length && (
          <p className="subtle" style={{ margin: "8px 0 0", fontSize: "0.72rem" }}>
            Próximo fragmento em {faltam} leitura(s).
          </p>
        )}
      </div>
    </BehaviorTab>
  );
}
