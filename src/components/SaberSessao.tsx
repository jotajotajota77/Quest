"use client";

// ============================================================
// SaberSessao (Fase 1) — 5 blocos do formato prescrito pela apostila
// de QV (Unidade 4/5): Leitura + Novo + Contraprova + Aplicação +
// Fecho. Camadas 2 e 3 são texto livre com autonota 0-3 contra a
// rubrica. Nunca múltipla escolha.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Conceito } from "@/lib/saber/tipos";
import type { ItemSessao } from "@/lib/saber/data";

interface Props {
  conceito: Conceito;
  roteiro: ItemSessao[];
}

type Passo = "leitura" | "novo" | "contraprova" | "aplicacao" | "fecho" | "final";

export default function SaberSessao({ conceito, roteiro }: Props) {
  const router = useRouter();
  const [passo, setPasso] = useState<Passo>("leitura");
  const [sessaoId, setSessaoId] = useState<number | null>(null);
  const [inicioTs] = useState<number>(Date.now());
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Respostas por bloco (item_id opcional — quando o bloco tem item)
  const [novoTexto, setNovoTexto] = useState("");
  const [novoNota, setNovoNota] = useState<number>(2);
  const [contraprovaTexto, setContraprovaTexto] = useState("");
  const [contraprovaNota, setContraprovaNota] = useState<number>(2);
  const [aplicacaoTexto, setAplicacaoTexto] = useState("");
  const [aplicacaoNota, setAplicacaoNota] = useState<number>(2);

  const [fechoMinutos, setFechoMinutos] = useState<number>(35);
  const [fechoEsforco, setFechoEsforco] = useState<number>(3);
  const [fechoFronteiras, setFechoFronteiras] = useState("");

  useEffect(() => {
    // Cria a sessão no back assim que a tela abre.
    (async () => {
      try {
        const res = await fetch("/api/saber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "iniciar_sessao", ordem: "didatica" }),
        });
        const j = await res.json();
        if (j.sessao_id) setSessaoId(j.sessao_id);
      } catch {
        /* sem sessao_id, ainda dá pra estudar — só não salva sessao no fecho */
      }
    })();
  }, []);

  async function salvarProducao(item_id: number | undefined, texto: string, autonota: number) {
    if (!item_id) return; // bloco sem item — ok, só passa
    setOcupado(true);
    try {
      const res = await fetch("/api/saber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registrar_producao",
          item_id,
          texto,
          autonota,
        }),
      });
      const j = await res.json();
      if (j.error) setMsg(`erro: ${j.error}`);
    } finally {
      setOcupado(false);
    }
  }

  async function finalizar(interrompida = false) {
    if (!sessaoId) {
      router.push("/saber");
      return;
    }
    setOcupado(true);
    try {
      const minutosCalc = Math.max(1, Math.round((Date.now() - inicioTs) / 60000));
      await fetch("/api/saber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalizar_sessao",
          sessao_id: sessaoId,
          minutos: fechoMinutos > 0 ? fechoMinutos : minutosCalc,
          esforco: fechoEsforco,
          fronteiras: fechoFronteiras,
          interrompida,
        }),
      });
      router.push("/saber");
    } finally {
      setOcupado(false);
    }
  }

  const iNovo = roteiro.find((r) => r.bloco === "novo");
  const iContra = roteiro.find((r) => r.bloco === "contraprova");
  const iAplic = roteiro.find((r) => r.bloco === "aplicacao");

  return (
    <div>
      <div style={{ padding: "12px 0 6px", borderBottom: "1px solid var(--hairline)", marginBottom: 16 }}>
        <div className="lbl" style={{ color: "var(--gold)", letterSpacing: "0.18em" }}>
          📚 SESSÃO · {passo.toUpperCase()}
        </div>
        <h1 className="title-fight" style={{ fontSize: "1.4rem", margin: "2px 0 2px", textTransform: "uppercase" }}>
          {conceito.titulo}
        </h1>
        <p className="subtle" style={{ margin: 0, fontSize: "0.82rem", fontStyle: "italic" }}>
          {conceito.tese}
        </p>
      </div>

      {/* Progresso */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["leitura", "novo", "contraprova", "aplicacao", "fecho"] as Passo[]).map((p) => (
          <div key={p} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: passo === p ? "var(--kihap)" :
              ["leitura", "novo", "contraprova", "aplicacao", "fecho"].indexOf(passo) >
              ["leitura", "novo", "contraprova", "aplicacao", "fecho"].indexOf(p) ? "var(--good)" : "var(--hairline)",
          }} />
        ))}
      </div>

      {passo === "leitura" && (
        <div className="panel" style={{ padding: 14, marginBottom: 12, borderLeft: "4px solid var(--calm)" }}>
          <div className="lbl">Leitura (~25 min)</div>
          <p style={{ margin: "8px 0", fontSize: "0.9rem" }}>
            <strong>Tese:</strong> {conceito.tese}
          </p>
          {conceito.definicao && (
            <p style={{ margin: "8px 0", fontSize: "0.86rem" }}>
              <strong>Definição:</strong> {conceito.definicao}
            </p>
          )}
          {conceito.armadilha && (
            <p style={{ margin: "8px 0", fontSize: "0.84rem", color: "var(--kihap)" }}>
              <strong>⚠ Armadilha:</strong> {conceito.armadilha}
            </p>
          )}
          {conceito.exemplo && (
            <p style={{ margin: "8px 0", fontSize: "0.84rem" }}>
              <strong>Exemplo:</strong> {conceito.exemplo}
            </p>
          )}
          {conceito.criterio && (
            <p style={{ margin: "8px 0", fontSize: "0.84rem", color: "var(--gold)" }}>
              <strong>Critério de mastery:</strong> {conceito.criterio}
            </p>
          )}
          <p className="subtle" style={{ margin: "12px 0 0", fontSize: "0.76rem" }}>
            Leia com atenção. No próximo bloco você vai fechar isto e escrever de memória.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setPasso("novo")}>
            → Novo (fechar e produzir)
          </button>
        </div>
      )}

      {passo === "novo" && (
        <BlocoTextoLivre
          titulo="Novo — explique de memória"
          enunciado={iNovo?.item?.enunciado ?? "Explique este conceito com suas palavras (sem consultar)."}
          rubrica={iNovo?.item?.rubrica}
          texto={novoTexto}
          setTexto={setNovoTexto}
          autonota={novoNota}
          setAutonota={setNovoNota}
          ocupado={ocupado}
          onContinuar={async () => {
            await salvarProducao(iNovo?.item?.id, novoTexto, novoNota);
            setPasso("contraprova");
          }}
        />
      )}

      {passo === "contraprova" && (
        <BlocoTextoLivre
          titulo="Contraprova — um exemplo e um contraexemplo"
          enunciado="Escreva 1 exemplo claro do conceito e 1 contraexemplo (algo que se parece MAS não é). Explique o critério que os separa."
          rubrica={iContra?.item?.rubrica ?? "Nota 3: exemplo genuíno + contraexemplo enganoso + critério de decisão explícito."}
          texto={contraprovaTexto}
          setTexto={setContraprovaTexto}
          autonota={contraprovaNota}
          setAutonota={setContraprovaNota}
          ocupado={ocupado}
          onContinuar={async () => {
            await salvarProducao(iContra?.item?.id, contraprovaTexto, contraprovaNota);
            setPasso("aplicacao");
          }}
        />
      )}

      {passo === "aplicacao" && (
        <BlocoTextoLivre
          titulo="Aplicação — caso novo sob uma lente"
          enunciado={iAplic?.item?.enunciado ?? "Aplique este conceito a um caso INÉDITO (não mencionado na apostila). Nomeie a lente que você está usando (marxismo, feminismo negro, queer, AC, biomédica, QV, comportamental-econômica, psicossocial)."}
          rubrica={iAplic?.item?.rubrica ?? "Nota 3: caso concreto + lente declarada + análise funcional/estrutural + risco da lente reconhecido."}
          texto={aplicacaoTexto}
          setTexto={setAplicacaoTexto}
          autonota={aplicacaoNota}
          setAutonota={setAplicacaoNota}
          ocupado={ocupado}
          onContinuar={async () => {
            await salvarProducao(iAplic?.item?.id, aplicacaoTexto, aplicacaoNota);
            setPasso("fecho");
          }}
        />
      )}

      {passo === "fecho" && (
        <div className="panel" style={{ padding: 14, marginBottom: 12, borderLeft: "4px solid var(--gold)" }}>
          <div className="lbl">Fecho — registrar sessão</div>
          <label style={{ display: "block", marginTop: 10, fontSize: "0.82rem" }}>
            Minutos de sessão
            <input
              type="number"
              min={1}
              max={240}
              value={fechoMinutos}
              onChange={(e) => setFechoMinutos(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: "block", marginTop: 10, fontSize: "0.82rem" }}>
            Esforço percebido (1 leve → 5 exaustivo)
            <input
              type="number"
              min={1}
              max={5}
              value={fechoEsforco}
              onChange={(e) => setFechoEsforco(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: "block", marginTop: 10, fontSize: "0.82rem" }}>
            Fronteiras — o que ficou sem entender
            <textarea
              value={fechoFronteiras}
              onChange={(e) => setFechoFronteiras(e.target.value)}
              rows={3}
              placeholder="Que dúvida especifica ficou? Que próximo conceito atacar?"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              disabled={ocupado}
              onClick={() => finalizar(false)}
            >
              ✓ Fechar sessão
            </button>
            <button
              className="btn"
              disabled={ocupado}
              onClick={() => finalizar(true)}
              style={{
                background: "transparent",
                border: "1px solid var(--hairline)",
                color: "var(--ink-dim)",
              }}
            >
              Interrompida
            </button>
          </div>
          {msg && <p className="subtle" style={{ marginTop: 8, color: "var(--kihap)", fontSize: "0.78rem" }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}

function BlocoTextoLivre({
  titulo, enunciado, rubrica, texto, setTexto, autonota, setAutonota, ocupado, onContinuar,
}: {
  titulo: string;
  enunciado: string;
  rubrica?: string | null;
  texto: string;
  setTexto: (s: string) => void;
  autonota: number;
  setAutonota: (n: number) => void;
  ocupado: boolean;
  onContinuar: () => Promise<void>;
}) {
  return (
    <div className="panel" style={{ padding: 14, marginBottom: 12, borderLeft: "4px solid var(--kihap)" }}>
      <div className="lbl">{titulo}</div>
      <p style={{ margin: "8px 0", fontSize: "0.88rem" }}>{enunciado}</p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={7}
        placeholder="Escreva de memória. Feche o material da leitura."
        style={{ ...inputStyle, resize: "vertical" }}
      />
      {rubrica && (
        <p className="subtle" style={{ margin: "8px 0 4px", fontSize: "0.74rem", color: "var(--gold)" }}>
          <strong>Rubrica:</strong> {rubrica}
        </p>
      )}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <span className="subtle" style={{ fontSize: "0.74rem" }}>Autonota:</span>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            className="chip"
            onClick={() => setAutonota(n)}
            style={{
              borderColor: autonota === n ? "var(--kihap)" : "var(--panel-border)",
              color: autonota === n ? "var(--kihap)" : "var(--ink)",
              fontWeight: 700,
            }}
          >
            {n} · {["não sei", "reconheço", "explico", "aplico"][n]}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button
          className="btn btn-primary"
          disabled={ocupado || texto.trim().length < 3}
          onClick={onContinuar}
        >
          → Continuar
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid var(--panel-border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  width: "100%",
  marginTop: 6,
  fontFamily: "var(--font-body)",
};
