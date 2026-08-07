import { createContext, useCallback, useContext, useRef, useState } from "react";

const AlertaContext = createContext(null);

// Ícones simples via emoji, sem depender de libs externas —
// mantém o estilo do resto do projeto (que já usa react-icons/fa
// em outros lugares, mas aqui um símbolo grande fica mais legível
// dentro do círculo colorido do modal).
const ICONES = {
  erro: "✕",
  sucesso: "✓",
  aviso: "!",
  pergunta: "?"
};

const CORES = {
  erro: { de: "#dc2626", para: "#ef4444" },
  sucesso: { de: "#16a34a", para: "#22c55e" },
  aviso: { de: "#d97706", para: "#f59e0b" },
  pergunta: { de: "#6d28d9", para: "#a855f7" }
};

export function AlertaProvider({ children }) {
  const [estado, setEstado] = useState(null);
  // guarda a função de resolução da Promise enquanto o modal de
  // confirmação está aberto, pra poder responder no clique do botão
  const resolverRef = useRef(null);

  const fechar = useCallback((resultado) => {
    if (resolverRef.current) {
      resolverRef.current(resultado);
      resolverRef.current = null;
    }
    setEstado(null);
  }, []);

  // substitui window.alert(mensagem)
  const mostrarAlerta = useCallback((mensagem, tipo = "erro") => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setEstado({ modo: "alerta", mensagem, tipo });
    });
  }, []);

  // substitui window.confirm(mensagem) — use com await
  const confirmarAcao = useCallback((mensagem, tipo = "pergunta") => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setEstado({ modo: "confirmar", mensagem, tipo });
    });
  }, []);

  return (
    <AlertaContext.Provider value={{ mostrarAlerta, confirmarAcao }}>
      {children}

      {estado && (
        <ModalAlerta
          estado={estado}
          aoFechar={fechar}
        />
      )}
    </AlertaContext.Provider>
  );
}

function ModalAlerta({ estado, aoFechar }) {
  const cor = CORES[estado.tipo] || CORES.erro;
  const icone = ICONES[estado.tipo] || ICONES.erro;

  return (
    <div style={estilos.overlay} className="scroll-sindico">
      <div style={estilos.modal}>
        <div
          style={{
            ...estilos.iconCircle,
            background: `linear-gradient(135deg,${cor.de},${cor.para})`
          }}
        >
          {icone}
        </div>

        <p style={estilos.mensagem}>{estado.mensagem}</p>

        {estado.modo === "confirmar" ? (
          <div style={estilos.acoes}>
            <button
              type="button"
              style={estilos.botaoCancelar}
              onClick={() => aoFechar(false)}
            >
              Cancelar
            </button>

            <button
              type="button"
              style={{
                ...estilos.botaoConfirmar,
                background: `linear-gradient(135deg,${cor.de},${cor.para})`
              }}
              onClick={() => aoFechar(true)}
            >
              Confirmar
            </button>
          </div>
        ) : (
          <button
            type="button"
            style={{
              ...estilos.botaoConfirmar,
              width: "100%",
              background: `linear-gradient(135deg,${cor.de},${cor.para})`
            }}
            onClick={() => aoFechar(true)}
          >
            Entendi
          </button>
        )}
      </div>
    </div>
  );
}

export function useAlerta() {
  const ctx = useContext(AlertaContext);

  if (!ctx) {
    throw new Error("useAlerta precisa estar dentro de <AlertaProvider>");
  }

  return ctx;
}

const estilos = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,11,32,0.55)",
    backdropFilter: "blur(6px)",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px",
    overflowY: "auto",
    boxSizing: "border-box"
  },

  modal: {
    width: "min(420px, 92vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ede9fe",
    borderRadius: "28px",
    padding: "30px",
    textAlign: "center",
    boxShadow:
      "0 40px 90px rgba(46,16,101,0.30), 0 0 0 1px rgba(255,255,255,0.6) inset",
    boxSizing: "border-box"
  },

  iconCircle: {
    width: "62px",
    height: "62px",
    borderRadius: "20px",
    margin: "0 auto 18px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "28px",
    fontWeight: "900",
    boxShadow: "0 16px 34px rgba(0,0,0,0.18)"
  },

  mensagem: {
    margin: "0 0 24px",
    color: "#1f2937",
    fontSize: "15px",
    lineHeight: "1.6",
    fontWeight: "700"
  },

  acoes: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px"
  },

  botaoCancelar: {
    flex: 1,
    minWidth: "110px",
    background: "#ffffff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    padding: "13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "14px"
  },

  botaoConfirmar: {
    flex: 1,
    minWidth: "110px",
    color: "white",
    border: "none",
    padding: "13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "14px",
    boxShadow: "0 14px 28px rgba(0,0,0,0.20)"
  }
};
