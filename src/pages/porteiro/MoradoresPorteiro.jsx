import { useEffect, useState } from "react";

function MoradoresPorteiro() {

  const [moradores, setMoradores] =
    useState([]);

  const [busca, setBusca] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState("Todos");

  useEffect(() => {

    carregarMoradores();

  }, []);

  function carregarMoradores() {

    const data =
      JSON.parse(
        localStorage.getItem("moradores")
      ) || [];

    setMoradores(data);

  }

  function obterStatus(status) {

    const ativo =
      status === "ativo" ||
      status === "Ativo" ||
      !status;

    if (ativo) {

      return {
        texto: "Ativo",
        fundo: "#f3e8ff",
        cor: "#7c3aed",
        icone: "●"
      };

    }

    return {
      texto: "Inativo",
      fundo: "#fee2e2",
      cor: "#dc2626",
      icone: "●"
    };

  }

  const moradoresFiltrados =
    moradores.filter((item) => {

      const texto =
        busca.toLowerCase();

      const correspondeBusca =
        item.nome
          ?.toLowerCase()
          .includes(texto) ||
        item.apartamento
          ?.toString()
          .toLowerCase()
          .includes(texto) ||
        item.apto
          ?.toString()
          .toLowerCase()
          .includes(texto) ||
        item.bloco
          ?.toLowerCase()
          .includes(texto) ||
        item.telefone
          ?.toLowerCase()
          .includes(texto) ||
        item.email
          ?.toLowerCase()
          .includes(texto) ||
        item.tipoMorador
          ?.toLowerCase()
          .includes(texto) ||
        item.perfilMorador
          ?.toLowerCase()
          .includes(texto);

      const statusAtual =
        obterStatus(item.status).texto;

      const correspondeStatus =
        filtroStatus === "Todos" ||
        statusAtual === filtroStatus;

      return (
        correspondeBusca &&
        correspondeStatus
      );

    });

  const totalAtivos =
    moradores.filter(
      (m) =>
        obterStatus(m.status).texto === "Ativo"
    ).length;

  const totalInativos =
    moradores.filter(
      (m) =>
        obterStatus(m.status).texto === "Inativo"
    ).length;

  const moradoresPrincipais =
    moradores.filter((m) => m.moradorPrincipal).length;

  const dependentes =
    moradores.filter((m) => !m.moradorPrincipal).length;

  const apartamentosVinculados =
    new Set(
      moradores
        .map((m) =>
          m.apartamento || m.apto
        )
        .filter(Boolean)
    ).size;

  return (

    <div style={styles.container}>

      {/* HERO */}

      <div style={styles.hero}>

        <div>

          <span style={styles.heroBadge}>
            👥 Consulta operacional
          </span>

          <h1 style={styles.title}>
            Moradores
          </h1>

          <p style={styles.subtitle}>
            Consulte os moradores cadastrados pelo síndico,
            visualize apartamentos, contatos e status de forma rápida.
          </p>

        </div>

        <div style={styles.heroPanel}>

          <p style={styles.heroLabel}>
            Base cadastrada
          </p>

          <h3 style={styles.heroNumber}>
            {moradores.length}
          </h3>

          <span style={styles.heroStatus}>
            Moradores no sistema
          </span>

        </div>

      </div>

      {/* CARDS */}

      <div style={styles.cards}>

        <div style={styles.cardPrimary}>

          <div>

            <p style={styles.cardLabelLight}>
              Moradores ativos
            </p>

            <h2 style={styles.cardNumberLight}>
              {totalAtivos}
            </h2>

            <span style={styles.cardHintLight}>
              liberados no condomínio
            </span>

          </div>

          <div style={styles.cardIconLight}>
            👥
          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIconBlue}>
            🏢
          </div>

          <div>

            <p style={styles.cardLabel}>
              Apartamentos vinculados
            </p>

            <h2 style={styles.cardNumberBlue}>
              {apartamentosVinculados}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIconRed}>
            🚫
          </div>

          <div>

            <p style={styles.cardLabel}>
              Inativos
            </p>

            <h2 style={styles.cardNumberRed}>
              {totalInativos}
            </h2>

          </div>

        </div>

      </div>

      {/* CONSULTA */}

      <div style={styles.listCard}>

        <div style={styles.listHeader}>

          <div>

            <h2 style={styles.sectionTitle}>
              Consulta de moradores
            </h2>

            <p style={styles.sectionSubtitle}>
              O porteiro apenas consulta. Cadastros e alterações são feitos pelo síndico.
            </p>

          </div>

          <div style={styles.filters}>

            <input
              placeholder="Buscar por nome, apto, bloco ou telefone..."
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              style={styles.search}
            />

            <select
              value={filtroStatus}
              onChange={(e) =>
                setFiltroStatus(e.target.value)
              }
              style={styles.filter}
            >

              <option>Todos</option>
              <option>Ativo</option>
              <option>Inativo</option>

            </select>

          </div>

        </div>

        {moradoresFiltrados.length === 0 ? (

          <div style={styles.empty}>

            <div style={styles.emptyIcon}>
              🔎
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhum morador encontrado
            </h3>

            <p style={styles.emptyText}>
              Verifique os filtros ou confirme se o síndico já cadastrou moradores.
            </p>

          </div>

        ) : (

          <div style={styles.grid}>

            {moradoresFiltrados.map((item) => {

              const status =
                obterStatus(item.status);

              const apartamento =
                item.apartamento ||
                item.apto ||
                "-";

              return (

                <div
                  key={item.id}
                  style={styles.cardMorador}
                >

                  <div style={styles.cardTop}>

                    <div style={styles.avatar}>
                      {item.nome
                        ? item.nome.charAt(0).toUpperCase()
                        : "M"}
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background: status.fundo,
                        color: status.cor
                      }}
                    >
                      {status.icone} {status.texto}
                    </span>

                  </div>

                  <h3 style={styles.nome}>
                    {item.nome || "Morador"}
                  </h3>

                  <div style={styles.infoGrid}>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Apartamento
                      </span>

                      <strong>
                        {apartamento}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Bloco
                      </span>

                      <strong>
                        {item.bloco || "-"}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Telefone
                      </span>

                      <strong>
                        {item.telefone || "-"}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Tipo
                      </span>

                      <strong>
                        {item.tipoMorador || "Morador"}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Perfil
                      </span>

                      <strong>
                        {item.moradorPrincipal ? "Principal" : "Dependente"}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        E-mail
                      </span>

                      <strong>
                        {item.email || "-"}
                      </strong>
                    </div>

                  </div>

                  <div style={styles.noticeBox}>
                    <strong>
                      Acesso somente consulta
                    </strong>

                    <p>
                      Alterações cadastrais devem ser feitas no painel do síndico.
                    </p>
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
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#4c1d95,#6d28d9,#7c3aed)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow:
      "0 22px 55px rgba(124,58,237,0.24), 0 0 38px rgba(168,85,247,0.12)",
    border: "1px solid rgba(255,255,255,0.18)"
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
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(220px,100%),1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 14px 35px rgba(124,58,237,0.18)"
  },

  card: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid #ede9fe"
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
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px"
  },

  cardIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#ede9fe",
    display: "flex",
    flexWrap: "wrap",
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
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  cardNumberBlue: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  cardNumberRed: {
    margin: "8px 0 0",
    color: "#dc2626",
    fontSize: "34px"
  },

  listCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  listHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "22px"
  },

  sectionTitle: {
    margin: 0,
    color: "#6d28d9",
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
    flexWrap: "wrap",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    minWidth: "300px"
  },

  filter: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed #c4b5fd",
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

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(310px,100%),1fr))",
    gap: "18px"
  },

  cardMorador: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "22px",
    boxShadow:
      "0 10px 25px rgba(15,23,42,0.04)"
  },

  cardTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },

  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900"
  },

  statusBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  nome: {
    margin: "0 0 16px",
    color: "#111827",
    fontSize: "22px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
    gap: "10px",
    marginBottom: "16px"
  },

  infoItem: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    border: "1px solid #ede9fe",
    borderRadius: "16px",
    padding: "12px"
  },

  infoLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "5px"
  },

  noticeBox: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "16px",
    padding: "14px",
    color: "#7c3aed",
    fontSize: "13px"
  },

  noticeBoxP: {
    margin: 0
  }

};

export default MoradoresPorteiro;