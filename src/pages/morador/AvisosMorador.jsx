import { useEffect, useState } from "react";

function AvisosMorador() {

  const [avisos, setAvisos] =
    useState([]);

  const [busca, setBusca] =
    useState("");

  const [filtroPrioridade, setFiltroPrioridade] =
    useState("Todos");

  useEffect(() => {

    carregarAvisos();

  }, []);

  function carregarAvisos() {

    const data =
      JSON.parse(
        localStorage.getItem("avisos")
      ) || [];

    setAvisos(data);

  }

  function normalizarPrioridade(prioridade) {

    return prioridade
      ? prioridade.toLowerCase()
      : "normal";

  }

  function obterPrioridade(prioridade) {

    const valor =
      normalizarPrioridade(prioridade);

    if (valor === "urgente") {
      return {
        texto: "Urgente",
        fundo: "#fee2e2",
        cor: "#991b1b",
        icone: "🚨"
      };
    }

    if (valor === "importante") {
      return {
        texto: "Importante",
        fundo: "#fef3c7",
        cor: "#92400e",
        icone: "⚠️"
      };
    }

    return {
      texto: "Normal",
      fundo: "#dcfce7",
      cor: "#166534",
      icone: "📢"
    };

  }

  const urgentes = avisos.filter(
    (a) =>
      normalizarPrioridade(a.prioridade) ===
      "urgente"
  );

  const importantes = avisos.filter(
    (a) =>
      normalizarPrioridade(a.prioridade) ===
      "importante"
  );

  const normais = avisos.filter(
    (a) =>
      normalizarPrioridade(a.prioridade) !==
        "urgente" &&
      normalizarPrioridade(a.prioridade) !==
        "importante"
  );

  const avisosFiltrados =
    avisos.filter((item) => {

      const texto =
        busca.toLowerCase();

      const correspondeBusca =
        item.titulo
          ?.toLowerCase()
          .includes(texto) ||
        item.descricao
          ?.toLowerCase()
          .includes(texto) ||
        item.prioridade
          ?.toLowerCase()
          .includes(texto) ||
        item.data
          ?.toLowerCase()
          .includes(texto);

      const prioridade =
        obterPrioridade(item.prioridade).texto;

      const correspondePrioridade =
        filtroPrioridade === "Todos" ||
        prioridade === filtroPrioridade;

      return (
        correspondeBusca &&
        correspondePrioridade
      );

    });

  return (

    <div style={styles.container}>

      {/* HERO */}

      <div style={styles.hero}>

        <div>

          <span style={styles.heroBadge}>
            📢 Comunicação oficial
          </span>

          <h1 style={styles.title}>
            Avisos do Condomínio
          </h1>

          <p style={styles.subtitle}>
            Acompanhe comunicados importantes, alertas,
            manutenções e informações publicadas pela administração.
          </p>

        </div>

        <div style={styles.heroPanel}>

          <p style={styles.heroLabel}>
            Total de avisos
          </p>

          <h3 style={styles.heroNumber}>
            {avisos.length}
          </h3>

          <span style={styles.heroStatus}>
            Comunicados ativos
          </span>

        </div>

      </div>

      {/* RESUMO */}

      <div style={styles.resumeGrid}>

        <div style={styles.cardPrimary}>

          <div>

            <p style={styles.cardLabelLight}>
              Total de avisos
            </p>

            <h2 style={styles.cardNumberLight}>
              {avisos.length}
            </h2>

            <span style={styles.cardHintLight}>
              comunicados publicados
            </span>

          </div>

          <div style={styles.cardIconLight}>
            📢
          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.cardIconYellow}>
            ⚠️
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Importantes
            </p>

            <h2 style={styles.resumeNumberYellow}>
              {importantes.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.cardIconRed}>
            🚨
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Urgentes
            </p>

            <h2 style={styles.resumeNumberRed}>
              {urgentes.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Normais
            </p>

            <h2 style={styles.resumeNumberGreen}>
              {normais.length}
            </h2>

          </div>

        </div>

      </div>

      {/* LISTA */}

      <div style={styles.listCard}>

        <div style={styles.listHeader}>

          <div>

            <h2 style={styles.sectionTitle}>
              Comunicados publicados
            </h2>

            <p style={styles.sectionSubtitle}>
              Consulte os avisos enviados pelo síndico para os moradores.
            </p>

          </div>

          <div style={styles.filters}>

            <input
              placeholder="Buscar aviso..."
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              style={styles.search}
            />

            <select
              value={filtroPrioridade}
              onChange={(e) =>
                setFiltroPrioridade(e.target.value)
              }
              style={styles.filter}
            >

              <option>Todos</option>
              <option>Normal</option>
              <option>Importante</option>
              <option>Urgente</option>

            </select>

          </div>

        </div>

        {avisosFiltrados.length === 0 ? (

          <div style={styles.empty}>

            <div style={styles.emptyIcon}>
              📭
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhum aviso encontrado
            </h3>

            <p style={styles.emptyText}>
              Não existem avisos cadastrados ou filtrados no momento.
            </p>

          </div>

        ) : (

          <div style={styles.list}>

            {avisosFiltrados.map((item) => {

              const prioridade =
                obterPrioridade(item.prioridade);

              return (

                <div
                  key={item.id}
                  style={styles.card}
                >

                  <div style={styles.cardTop}>

                    <div style={styles.noticeIcon}>
                      {prioridade.icone}
                    </div>

                    <div style={styles.noticeContent}>

                      <div style={styles.badges}>

                        <span
                          style={{
                            ...styles.priority,
                            background: prioridade.fundo,
                            color: prioridade.cor
                          }}
                        >
                          {prioridade.texto}
                        </span>

                        <span style={styles.dateBadge}>
                          📅 {item.data || "Sem data"}
                        </span>

                      </div>

                      <h2 style={styles.cardTitle}>
                        {item.titulo}
                      </h2>

                      <p style={styles.description}>
                        {item.descricao}
                      </p>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </div>

  );

}

const styles = {

  container: {
    width: "100%",
    fontFamily: "Arial",
    color: "#111827"
  },

  hero: {
    background:
      "linear-gradient(135deg,#0f172a,#1e3a8a,#2563eb)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow:
      "0 20px 45px rgba(37,99,235,0.25)"
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
    display: "inline-block",
    marginBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "36px",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "680px",
    lineHeight: "1.5"
  },

  heroPanel: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "24px",
    padding: "22px",
    minWidth: "230px",
    textAlign: "center",
    backdropFilter: "blur(12px)"
  },

  heroLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.68)",
    fontSize: "13px"
  },

  heroNumber: {
    margin: "8px 0 12px",
    color: "white",
    fontSize: "38px"
  },

  heroStatus: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 14px 35px rgba(37,99,235,0.2)"
  },

  cardLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px"
  },

  cardNumberLight: {
    margin: "10px 0 2px",
    color: "white",
    fontSize: "38px"
  },

  cardHintLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px"
  },

  cardIconLight: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px"
  },

  resumeCard: {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)",
    border: "1px solid #eef2f7"
  },

  cardIconYellow: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconRed: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  resumeLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  resumeNumberYellow: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  resumeNumberRed: {
    margin: "8px 0 0",
    color: "#dc2626",
    fontSize: "34px"
  },

  resumeNumberGreen: {
    margin: "8px 0 0",
    color: "#166534",
    fontSize: "34px"
  },

  listCard: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "22px"
  },

  sectionTitle: {
    margin: 0,
    color: "#1e3a8a",
    fontSize: "24px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  filters: {
    display: "flex",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f9fafb",
    minWidth: "230px"
  },

  filter: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f9fafb"
  },

  empty: {
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: "22px",
    padding: "45px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#6b7280"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  card: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "22px",
    boxShadow:
      "0 10px 25px rgba(15,23,42,0.04)"
  },

  cardTop: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start"
  },

  noticeIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "20px",
    background: "white",
    border: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    flexShrink: 0
  },

  noticeContent: {
    flex: 1
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  priority: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  dateBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cardTitle: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "22px"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: 0
  }

};

export default AvisosMorador;