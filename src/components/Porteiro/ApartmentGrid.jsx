import { useState, useEffect } from "react";
import PackageModal from "./PackageModal";

export default function ApartmentGrid({ onRefresh }) {
  const [selectedAp, setSelectedAp] = useState(null);
  const [encomendas, setEncomendas] = useState([]);
  const [esperadas, setEsperadas] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    carregarDados();

    const interval = setInterval(() => {
      carregarDados();
    }, 10000);

    window.addEventListener("storage", carregarDados);
    window.addEventListener(
      "infinitycondo:encomendas",
      carregarDados
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", carregarDados);
      window.removeEventListener(
        "infinitycondo:encomendas",
        carregarDados
      );
    };
  }, []);

  function lerStorage(chave) {
    try {
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : [];
    } catch {
      return [];
    }
  }

  function carregarDados() {
    setEncomendas(lerStorage("encomendas"));
    setEsperadas(lerStorage("encomendas_esperadas"));
    setMoradores(lerStorage("moradores"));
    setOcorrencias(lerStorage("ocorrencias"));
  }

  const apartamentosCadastrados = lerStorage("apartamentos");

  const apartamentos = [
    ...new Set(
      [
        ...apartamentosCadastrados.map((item) =>
          String(
            item.numero ||
            item.apartamento ||
            item.apto ||
            ""
          ).trim()
        ),
        ...moradores.map((m) =>
          String(m.apartamento || m.apto || "").trim()
        )
      ].filter(Boolean)
    )
  ].sort((a, b) =>
    String(a).localeCompare(String(b), "pt-BR", {
      numeric: true
    })
  );

  function obterMorador(ap) {
    const encontrado = moradores.find(
      (m) =>
        String(m.apartamento) === String(ap) ||
        String(m.apto) === String(ap)
    );

    return encontrado || null;
  }

  function contarPendentes(ap) {
    return encomendas.filter(
      (e) =>
        String(e.apartamento) === String(ap) &&
        ["recebido", "pendente", "aguardando", "atrasado"].includes(
          String(e.status || "").toLowerCase()
        )
    ).length;
  }

  function contarRetiradas(ap) {
    return encomendas.filter(
      (e) =>
        String(e.apartamento) === String(ap) &&
        ["retirada", "retirado", "entregue"].includes(
          String(e.status || "").toLowerCase()
        )
    ).length;
  }

  function contarEsperadas(ap) {
    return esperadas.filter(
      (e) => String(e.apartamento) === String(ap)
    ).length;
  }

  function contarOcorrencias(ap) {
    return ocorrencias.filter(
      (o) =>
        String(o.apartamento) === String(ap) &&
        o.status !== "Resolvida" &&
        o.status !== "Resolvido"
    ).length;
  }

  function definirStatus(ap) {
    const pendentes = contarPendentes(ap);
    const esperadasAp = contarEsperadas(ap);
    const ocorrenciasAp = contarOcorrencias(ap);

    if (ocorrenciasAp > 0) {
      return {
        texto: "Com ocorrência",
        cor: "#dc2626",
        fundo: "#fee2e2",
        borda: "#fecaca",
        destaque: "#dc2626"
      };
    }

    if (pendentes > 0) {
      return {
        texto: "Pendente",
        cor: "#92400e",
        fundo: "#fffbeb",
        borda: "#fde68a",
        destaque: "#f59e0b"
      };
    }

    if (esperadasAp > 0) {
      return {
        texto: "Entrega esperada",
        cor: "#1d4ed8",
        fundo: "#eff6ff",
        borda: "#bfdbfe",
        destaque: "#2563eb"
      };
    }

    return {
      texto: "Operação normal",
      cor: "#166534",
      fundo: "#f0fdf4",
      borda: "#bbf7d0",
      destaque: "#16a34a"
    };
  }

  const apartamentosFiltrados = apartamentos.filter((ap) => {
    const pendentes = contarPendentes(ap);
    const retiradas = contarRetiradas(ap);
    const esperadasAp = contarEsperadas(ap);
    const ocorrenciasAp = contarOcorrencias(ap);
    const morador = obterMorador(ap);
    const textoBusca = busca.toLowerCase();

    const matchBusca =
      ap.includes(textoBusca) ||
      morador?.nome?.toLowerCase().includes(textoBusca);

    if (filtro === "pendentes") return pendentes > 0 && matchBusca;
    if (filtro === "retiradas") return retiradas > 0 && matchBusca;
    if (filtro === "esperadas") return esperadasAp > 0 && matchBusca;
    if (filtro === "ocorrencias") return ocorrenciasAp > 0 && matchBusca;

    return matchBusca;
  });

  const totalPendentes = apartamentos.reduce(
    (total, ap) => total + contarPendentes(ap),
    0
  );

  const totalEsperadas = apartamentos.reduce(
    (total, ap) => total + contarEsperadas(ap),
    0
  );

  const totalOcorrencias = apartamentos.reduce(
    (total, ap) => total + contarOcorrencias(ap),
    0
  );

  return (
    <>
      <div style={styles.panel}>
        <div>
          <h3 style={styles.panelTitle}>Mapa operacional</h3>

          <p style={styles.panelSubtitle}>
            Visualize os apartamentos cadastrados pelo síndico por encomendas,
            entregas esperadas, moradores e ocorrências.
          </p>
        </div>

        <div style={styles.panelStats}>
          <div style={styles.panelStat}>
            <span style={styles.statIconYellow}>📦</span>

            <div>
              <p style={styles.statLabel}>Pendentes</p>
              <strong style={styles.statNumber}>{totalPendentes}</strong>
            </div>
          </div>

          <div style={styles.panelStat}>
            <span style={styles.statIconBlue}>📬</span>

            <div>
              <p style={styles.statLabel}>Esperadas</p>
              <strong style={styles.statNumber}>{totalEsperadas}</strong>
            </div>
          </div>

          <div style={styles.panelStat}>
            <span style={styles.statIconRed}>📘</span>

            <div>
              <p style={styles.statLabel}>Ocorrências</p>
              <strong style={styles.statNumber}>{totalOcorrencias}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.topBar}>
        <input
          placeholder="Buscar apartamento ou morador..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={styles.search}
        />

        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={styles.select}
        >
          <option value="todos">Todos os apartamentos</option>
          <option value="pendentes">Com encomendas pendentes</option>
          <option value="retiradas">Com retiradas</option>
          <option value="esperadas">Com entregas esperadas</option>
          <option value="ocorrencias">Com ocorrências</option>
        </select>
      </div>

      <div style={styles.grid}>
        {apartamentosFiltrados.map((ap) => {
          const pendentes = contarPendentes(ap);
          const retiradas = contarRetiradas(ap);
          const esperadasAp = contarEsperadas(ap);
          const ocorrenciasAp = contarOcorrencias(ap);
          const morador = obterMorador(ap);
          const status = definirStatus(ap);

          return (
            <div
              key={ap}
              style={{
                ...styles.card,
                border: `1px solid ${status.borda}`
              }}
              onClick={() => setSelectedAp(ap)}
            >
              <div
                style={{
                  ...styles.cardGlow,
                  background: status.destaque
                }}
              ></div>

              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.apLabel}>Apartamento</p>
                  <div style={styles.number}>{ap}</div>
                </div>

                <div
                  style={{
                    ...styles.statusBadge,
                    background: status.fundo,
                    color: status.cor
                  }}
                >
                  {status.texto}
                </div>
              </div>

              <div style={styles.moradorBox}>
                <span style={styles.moradorIcon}>👤</span>

                <div>
                  <p style={styles.moradorLabel}>Morador</p>
                  <strong style={styles.moradorNome}>
                    {morador?.nome || "Não vinculado"}
                  </strong>
                </div>
              </div>

              <div style={styles.metrics}>
                <div style={styles.metric}>
                  <span style={styles.metricIconYellow}>📦</span>

                  <div>
                    <p style={styles.metricLabel}>Pendentes</p>
                    <strong style={styles.metricNumber}>{pendentes}</strong>
                  </div>
                </div>

                <div style={styles.metric}>
                  <span style={styles.metricIconBlue}>📬</span>

                  <div>
                    <p style={styles.metricLabel}>Esperadas</p>
                    <strong style={styles.metricNumber}>{esperadasAp}</strong>
                  </div>
                </div>

                <div style={styles.metric}>
                  <span style={styles.metricIconGreen}>✅</span>

                  <div>
                    <p style={styles.metricLabel}>Retiradas</p>
                    <strong style={styles.metricNumber}>{retiradas}</strong>
                  </div>
                </div>

                <div style={styles.metric}>
                  <span style={styles.metricIconRed}>📘</span>

                  <div>
                    <p style={styles.metricLabel}>Ocorrências</p>
                    <strong style={styles.metricNumber}>{ocorrenciasAp}</strong>
                  </div>
                </div>
              </div>

              <div style={styles.footer}>
                <span style={styles.footerText}>Clique para gerenciar</span>
                <span style={styles.arrow}>→</span>
              </div>
            </div>
          );
        })}
      </div>

      {apartamentosFiltrados.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔎</div>

          <h3 style={styles.emptyTitle}>Nenhum apartamento encontrado</h3>

          <p style={styles.emptyText}>
            Cadastre apartamentos/moradores no painel do síndico ou ajuste a
            busca/filtro selecionado.
          </p>
        </div>
      )}

      {selectedAp && (
        <PackageModal
          apartamento={selectedAp}
          onClose={() => {
            setSelectedAp(null);
            carregarDados();

            if (onRefresh) {
              onRefresh();
            }
          }}
        />
      )}
    </>
  );
}

const styles = {
  panel: {
    minWidth: 0,
    background: "linear-gradient(135deg,#ffffff,#f8fafc)",
    border: "1px solid #eef2f7",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "20px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px"
  },

  panelTitle: {
    margin: 0,
    color: "#14532d",
    fontSize: "22px"
  },

  panelSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  panelStats: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },

  panelStat: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    minWidth: "130px"
  },

  statIconYellow: {
    width: "38px",
    height: "38px",
    borderRadius: "14px",
    background: "#fef3c7",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  statIconBlue: {
    width: "38px",
    height: "38px",
    borderRadius: "14px",
    background: "#dbeafe",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  statIconRed: {
    width: "38px",
    height: "38px",
    borderRadius: "14px",
    background: "#fee2e2",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "12px"
  },

  statNumber: {
    display: "block",
    marginTop: "4px",
    color: "#111827",
    fontSize: "20px"
  },

  topBar: {
    minWidth: 0,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "22px"
  },

  search: {
    flex: 1,
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb",
    boxSizing: "border-box"
  },

  select: {
    width: "260px",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb",
    boxSizing: "border-box"
  },

  grid: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
    gap: "18px"
  },

  card: {
    minWidth: 0,
    position: "relative",
    overflow: "hidden",
    background: "white",
    borderRadius: "24px",
    padding: "20px",
    cursor: "pointer",
    transition: "0.2s",
    boxShadow: "0 12px 35px rgba(15,23,42,0.07)",
    minHeight: "250px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },

  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "5px"
  },

  cardHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px"
  },

  apLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.6px"
  },

  number: {
    marginTop: "5px",
    fontSize: "31px",
    fontWeight: "900",
    color: "#111827",
    letterSpacing: "-0.5px"
  },

  statusBadge: {
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  moradorBox: {
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "11px",
    marginBottom: "16px"
  },

  moradorIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "14px",
    background: "#dcfce7",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  moradorLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "12px"
  },

  moradorNome: {
    display: "block",
    marginTop: "3px",
    color: "#111827",
    fontSize: "14px"
  },

  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
    gap: "10px"
  },

  metric: {
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "16px",
    padding: "11px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "9px"
  },

  metricIconYellow: {
    width: "32px",
    height: "32px",
    borderRadius: "12px",
    background: "#fef3c7",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  metricIconBlue: {
    width: "32px",
    height: "32px",
    borderRadius: "12px",
    background: "#dbeafe",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  metricIconGreen: {
    width: "32px",
    height: "32px",
    borderRadius: "12px",
    background: "#dcfce7",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  metricIconRed: {
    width: "32px",
    height: "32px",
    borderRadius: "12px",
    background: "#fee2e2",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  metricLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "11px"
  },

  metricNumber: {
    display: "block",
    color: "#111827",
    fontSize: "16px",
    marginTop: "2px"
  },

  footer: {
    marginTop: "16px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#14532d",
    fontWeight: "900",
    fontSize: "13px"
  },

  footerText: {
    color: "#14532d"
  },

  arrow: {
    width: "30px",
    height: "30px",
    borderRadius: "12px",
    background: "#dcfce7",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },

  empty: {
    marginTop: "22px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: "22px",
    padding: "40px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#6b7280"
  }
};