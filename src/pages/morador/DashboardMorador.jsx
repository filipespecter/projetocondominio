import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DashboardMorador() {
  const navigate = useNavigate();

  const [morador, setMorador] = useState(null);

  const [dados, setDados] = useState({
    avisos: 0,
    encomendas: 0,
    reservas: 0,
    solicitacoes: 0,
    resolvidas: 0
  });

  const [atividades, setAtividades] = useState([]);

  useEffect(() => {
    carregarSessao();
    carregarDashboard();
  }, []);

  function carregarSessao() {
    const sessao =
      localStorage.getItem("sessaoMorador") ||
      sessionStorage.getItem("sessaoMorador");

    try {
      const usuario = sessao ? JSON.parse(sessao) : null;
      setMorador(usuario);
    } catch {
      setMorador(null);
    }
  }

  function carregarDashboard() {
    const sessao =
      localStorage.getItem("sessaoMorador") ||
      sessionStorage.getItem("sessaoMorador");

    let usuario = null;

    try {
      usuario = sessao ? JSON.parse(sessao) : null;
    } catch {
      usuario = null;
    }

    const apartamentoMorador =
      usuario?.apartamento || "";

    const avisos =
      JSON.parse(localStorage.getItem("avisos")) || [];

    const encomendas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const reservas =
      JSON.parse(localStorage.getItem("reservas")) || [];

    const ocorrencias =
      JSON.parse(localStorage.getItem("ocorrencias")) || [];

    const encomendasMorador =
      encomendas.filter(
        (item) =>
          String(item.apartamento) ===
            String(apartamentoMorador) &&
          item.status === "pendente"
      );

    const reservasMorador =
      reservas.filter(
        (item) =>
          item.moradorId === usuario?.id ||
          item.moradorNome === usuario?.nome ||
          String(item.apartamento) ===
            String(apartamentoMorador)
      );

    const solicitacoesMorador =
      ocorrencias.filter(
        (item) =>
          item.origem === "morador" &&
          (
            item.moradorId === usuario?.id ||
            item.moradorUsuario === usuario?.usuario ||
            String(item.apartamento) ===
              String(apartamentoMorador)
          )
      );

    const solicitacoesResolvidas =
      solicitacoesMorador.filter(
        (item) =>
          item.status === "Resolvida" ||
          item.status === "Resolvido"
      );

    setDados({
      avisos: avisos.length,
      encomendas: encomendasMorador.length,
      reservas: reservasMorador.length,
      solicitacoes: solicitacoesMorador.length,
      resolvidas: solicitacoesResolvidas.length
    });

    const novasAtividades = [];

    if (encomendasMorador.length > 0) {
      novasAtividades.push({
        id: 1,
        icone: "📦",
        titulo: "Encomendas pendentes",
        texto: `Você possui ${encomendasMorador.length} encomenda(s) aguardando retirada.`
      });
    }

    if (avisos.length > 0) {
      novasAtividades.push({
        id: 2,
        icone: "📢",
        titulo: "Avisos publicados",
        texto: `Existem ${avisos.length} aviso(s) disponível(is) para leitura.`
      });
    }

    if (reservasMorador.length > 0) {
      novasAtividades.push({
        id: 3,
        icone: "📅",
        titulo: "Reservas registradas",
        texto: `Você possui ${reservasMorador.length} reserva(s) no sistema.`
      });
    }

    if (solicitacoesMorador.length > 0) {
      novasAtividades.push({
        id: 4,
        icone: "💬",
        titulo: "Solicitações enviadas",
        texto: `Você possui ${solicitacoesMorador.length} sugestão(ões) ou reclamação(ões).`
      });
    }

    if (novasAtividades.length === 0) {
      novasAtividades.push({
        id: 5,
        icone: "🏢",
        titulo: "Bem-vindo ao portal",
        texto: "Nenhuma atividade recente encontrada no momento."
      });
    }

    setAtividades(novasAtividades);
  }

  return (
    <div style={styles.container}>
      {/* HERO */}

      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            🏠 Portal do morador
          </span>

          <h1 style={styles.title}>
            Olá, {morador?.nome || "Morador"} 👋
          </h1>

          <p style={styles.subtitle}>
            Acompanhe avisos, encomendas, reservas e solicitações
            do seu condomínio em um só lugar.
          </p>

          <div style={styles.userLine}>
            <span style={styles.statusDot}></span>

            <span>
              Apartamento{" "}
              <strong>
                {morador?.apartamento || "-"}
              </strong>
            </span>

            {morador?.bloco && (
              <span style={styles.apBadge}>
                Bloco {morador.bloco}
              </span>
            )}
          </div>
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Minha unidade
          </p>

          <h3 style={styles.heroNumber}>
            {morador?.apartamento || "-"}
          </h3>

          <span style={styles.heroStatus}>
            Acesso ativo
          </span>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}

      <div style={styles.actions}>
        <button
          style={styles.actionPrimary}
          onClick={() =>
            navigate("/dashboard/morador/encomendas")
          }
        >
          <span style={styles.actionIcon}>
            📦
          </span>

          <div>
            <strong>
              Minhas encomendas
            </strong>

            <p>
              Ver pendências e histórico
            </p>
          </div>
        </button>

        <button
          style={styles.actionButton}
          onClick={() =>
            navigate("/dashboard/morador/reservas")
          }
        >
          <span style={styles.actionIconBlue}>
            📅
          </span>

          <div>
            <strong>
              Fazer reserva
            </strong>

            <p>
              Áreas comuns disponíveis
            </p>
          </div>
        </button>

        <button
          style={styles.actionButton}
          onClick={() =>
            navigate("/dashboard/morador/sugestoes")
          }
        >
          <span style={styles.actionIconPurple}>
            💬
          </span>

          <div>
            <strong>
              Sugestões / Reclamações
            </strong>

            <p>
              Enviar solicitação ao síndico
            </p>
          </div>
        </button>
      </div>

      {/* CARDS */}

      <div style={styles.cards}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Encomendas pendentes
            </p>

            <h1 style={styles.cardNumberLight}>
              {dados.encomendas}
            </h1>

            <span style={styles.cardHintLight}>
              aguardando retirada
            </span>
          </div>

          <div style={styles.cardIconLight}>
            📦
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBlue}>
            📢
          </div>

          <div>
            <p style={styles.cardLabel}>
              Avisos do condomínio
            </p>

            <h1 style={styles.cardNumberBlue}>
              {dados.avisos}
            </h1>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconGreen}>
            📅
          </div>

          <div>
            <p style={styles.cardLabel}>
              Reservas realizadas
            </p>

            <h1 style={styles.cardNumberGreen}>
              {dados.reservas}
            </h1>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconPurple}>
            💬
          </div>

          <div>
            <p style={styles.cardLabel}>
              Solicitações
            </p>

            <h1 style={styles.cardNumberPurple}>
              {dados.solicitacoes}
            </h1>
          </div>
        </div>
      </div>

      {/* GRID INFERIOR */}

      <div style={styles.bottomGrid}>
        <div style={styles.history}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Atividades recentes
              </h2>

              <p style={styles.sectionSubtitle}>
                Resumo dos principais eventos vinculados ao seu apartamento.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              Atualizado
            </span>
          </div>

          <div style={styles.activityList}>
            {atividades.map((item) => (
              <div
                key={item.id}
                style={styles.historyItem}
              >
                <div style={styles.historyIcon}>
                  {item.icone}
                </div>

                <div>
                  <h3 style={styles.historyItemTitle}>
                    {item.titulo}
                  </h3>

                  <p style={styles.historyText}>
                    {item.texto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.statusPanel}>
          <h2 style={styles.sectionTitle}>
            Status do morador
          </h2>

          <p style={styles.sectionSubtitle}>
            Informações rápidas da sua conta residencial.
          </p>

          <div style={styles.infoBox}>
            <span style={styles.infoLabel}>
              Nome
            </span>

            <strong>
              {morador?.nome || "-"}
            </strong>
          </div>

          <div style={styles.infoBox}>
            <span style={styles.infoLabel}>
              Apartamento
            </span>

            <strong>
              {morador?.apartamento || "-"}
            </strong>
          </div>

          <div style={styles.infoBox}>
            <span style={styles.infoLabel}>
              Telefone
            </span>

            <strong>
              {morador?.telefone || "-"}
            </strong>
          </div>

          <div style={styles.resolvedBox}>
            <span>
              ✅ Solicitações resolvidas
            </span>

            <strong>
              {dados.resolvidas}
            </strong>
          </div>
        </div>
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

  userLine: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#dbeafe",
    fontSize: "14px",
    fontWeight: "600",
    flexWrap: "wrap"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#38bdf8",
    boxShadow:
      "0 0 0 5px rgba(56,189,248,0.16)"
  },

  apBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "7px 11px",
    borderRadius: "999px",
    color: "white",
    fontWeight: "800",
    fontSize: "12px"
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

  actions: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  actionPrimary: {
    background:
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
    color: "white",
    border: "none",
    padding: "22px",
    borderRadius: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
    boxShadow:
      "0 14px 35px rgba(37,99,235,0.20)"
  },

  actionButton: {
    background: "white",
    color: "#111827",
    border: "1px solid #eef2f7",
    padding: "22px",
    borderRadius: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)"
  },

  actionIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  actionIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  actionIconPurple: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cards: {
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

  card: {
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

  cardIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dbeafe",
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

  cardIconPurple: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#ede9fe",
    display: "flex",
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
    color: "#2563eb",
    fontSize: "34px"
  },

  cardNumberGreen: {
    margin: "8px 0 0",
    color: "#166534",
    fontSize: "34px"
  },

  cardNumberPurple: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px"
  },

  history: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  statusPanel: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
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

  sectionBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  historyItem: {
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px"
  },

  historyIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "15px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0
  },

  historyItemTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "16px"
  },

  historyText: {
    margin: "6px 0 0",
    color: "#6b7280",
    lineHeight: "1.5",
    fontSize: "14px"
  },

  infoBox: {
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "16px",
    padding: "14px",
    marginTop: "14px"
  },

  infoLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "6px"
  },

  resolvedBox: {
    marginTop: "16px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "14px",
    color: "#166534",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "800"
  }
};

export default DashboardMorador;