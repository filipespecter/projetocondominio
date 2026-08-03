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
      sessionStorage.getItem("sessaoMorador") ||
      localStorage.getItem("usuarioMorador") ||
      sessionStorage.getItem("usuarioMorador");

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
      sessionStorage.getItem("sessaoMorador") ||
      localStorage.getItem("usuarioMorador") ||
      sessionStorage.getItem("usuarioMorador");

    let usuario = null;

    try {
      usuario = sessao ? JSON.parse(sessao) : null;
    } catch {
      usuario = null;
    }

    const apartamentoMorador =
      usuario?.apartamento ||
      usuario?.apto ||
      "";

    const apartamentoIdMorador = usuario?.apartamentoId || null;
    const condominioIdMorador = usuario?.condominioId || null;

    const avisos =
      JSON.parse(localStorage.getItem("avisos")) || [];

    const encomendas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const reservas =
      JSON.parse(localStorage.getItem("reservas")) || [];

    const ocorrencias =
      JSON.parse(localStorage.getItem("ocorrencias")) || [];

    const sugestoesMorador =
      JSON.parse(localStorage.getItem("sugestoesMorador")) || [];

    const sugestoesReclamacoes =
      JSON.parse(localStorage.getItem("sugestoes_reclamacoes")) || [];

    function pertenceAoCondominio(item) {
      if (!condominioIdMorador) return true;

      return (
        !item.condominioId ||
        String(item.condominioId) === String(condominioIdMorador)
      );
    }

    function pertenceAoApartamento(item) {
      return (
        String(item.apartamento || item.apto || "") ===
          String(apartamentoMorador) ||
        (
          apartamentoIdMorador &&
          String(item.apartamentoId || "") === String(apartamentoIdMorador)
        )
      );
    }

    const avisosMorador =
      avisos.filter((item) => {
        const avisoGeral =
          !item.apartamento &&
          !item.apartamentoId &&
          !item.moradorId;

        return (
          pertenceAoCondominio(item) &&
          (
            avisoGeral ||
            pertenceAoApartamento(item) ||
            String(item.moradorId || "") === String(usuario?.id || "")
          )
        );
      });

    const encomendasMorador =
      encomendas.filter((item) => {
        const status = String(item.status || "").toLowerCase();

        return (
          pertenceAoCondominio(item) &&
          pertenceAoApartamento(item) &&
          (
            status === "pendente" ||
            status === "recebido" ||
            status === "aguardando" ||
            status === "aguardando retirada" ||
            status === "atrasado"
          )
        );
      });

    const reservasMorador =
      reservas.filter(
        (item) =>
          pertenceAoCondominio(item) &&
          (
          item.moradorId === usuario?.id ||
          item.moradorNome === usuario?.nome ||
          item.morador === usuario?.nome ||
          pertenceAoApartamento(item)
          )
      );

    const solicitacoesMorador =
      [
        ...ocorrencias,
        ...sugestoesMorador,
        ...sugestoesReclamacoes
      ].filter(
        (item) =>
          pertenceAoCondominio(item) &&
          (
          item.origem === "morador" ||
          item.origemModulo === "Morador" ||
          item.moradorId === usuario?.id ||
          item.moradorUsuario === usuario?.usuario ||
          item.usuario === usuario?.usuario ||
          pertenceAoApartamento(item)
          )
      );

    const solicitacoesResolvidas =
      solicitacoesMorador.filter((item) =>
        ["resolvida", "resolvido"].includes(
          String(item.status || "").toLowerCase()
        )
      );

    setDados({
      avisos: avisosMorador.length,
      encomendas: encomendasMorador.length,
      reservas: reservasMorador.length,
      solicitacoes: solicitacoesMorador.length,
      resolvidas: solicitacoesResolvidas.length,
      moradorPrincipal: Boolean(usuario?.moradorPrincipal),
      perfilMorador: usuario?.perfilMorador || "dependente",
      tipoMorador: usuario?.tipoMorador || "Morador"
    });

    const novasAtividades = [];

    if (encomendasMorador.length > 0) {
      novasAtividades.push({
        id: "atividade-encomendas",
        icone: "📦",
        titulo: "Encomendas pendentes",
        texto: `Você possui ${encomendasMorador.length} encomenda(s) aguardando retirada.`
      });
    }

    if (avisosMorador.length > 0) {
      novasAtividades.push({
        id: "atividade-avisos",
        icone: "📢",
        titulo: "Avisos publicados",
        texto: `Existem ${avisosMorador.length} aviso(s) disponível(is) para leitura.`
      });
    }

    if (reservasMorador.length > 0) {
      novasAtividades.push({
        id: "atividade-reservas",
        icone: "📅",
        titulo: "Reservas registradas",
        texto: `Você possui ${reservasMorador.length} reserva(s) no sistema.`
      });
    }

    if (solicitacoesMorador.length > 0) {
      novasAtividades.push({
        id: "atividade-solicitacoes",
        icone: "💬",
        titulo: "Solicitações enviadas",
        texto: `Você possui ${solicitacoesMorador.length} sugestão(ões) ou reclamação(ões).`
      });
    }

    if (novasAtividades.length === 0) {
      novasAtividades.push({
        id: "atividade-boas-vindas",
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

            <span style={styles.apBadge}>
              {morador?.moradorPrincipal ? "Morador principal" : "Dependente"}
            </span>

            <span style={styles.apBadge}>
              {morador?.tipoMorador || "Morador"}
            </span>
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
          style={{
            ...styles.actionButton,
            ...(
              morador?.permissoesMorador?.podeReservar === false
                ? styles.actionDisabled
                : {}
            )
          }}
          onClick={() => {
            if (morador?.permissoesMorador?.podeReservar === false) {
              alert("Seu perfil está como dependente. A permissão de reserva pode ser liberada pelo condomínio.");
              return;
            }

            navigate("/dashboard/morador/reservas");
          }}
        >
          <span style={styles.actionIconBlue}>
            📅
          </span>

          <div>
            <strong>
              Fazer reserva
            </strong>

            <p>
              {morador?.permissoesMorador?.podeReservar === false
                ? "Disponível para morador principal"
                : "Áreas comuns disponíveis"}
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

          <div style={styles.infoBox}>
            <span style={styles.infoLabel}>
              Tipo de acesso
            </span>

            <strong>
              {morador?.moradorPrincipal ? "Morador principal" : "Dependente"}
            </strong>
          </div>

          <div style={styles.infoBox}>
            <span style={styles.infoLabel}>
              Tipo de morador
            </span>

            <strong>
              {morador?.tipoMorador || "-"}
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
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
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

  userLine: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ede9fe",
    fontSize: "14px",
    fontWeight: "600",
    flexWrap: "wrap"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#a855f7",
    boxShadow:
      "0 0 0 5px rgba(168,85,247,0.18)"
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
    width: "100%",
    maxWidth: "230px",
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
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  actions: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(250px,100%),1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  actionPrimary: {
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
    color: "white",
    border: "none",
    padding: "22px",
    borderRadius: "24px",
    cursor: "pointer",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
    boxShadow:
      "0 14px 35px rgba(124,58,237,0.18)"
  },

  actionButton: {
    background: "white",
    color: "#111827",
    border: "1px solid #ede9fe",
    padding: "22px",
    borderRadius: "24px",
    cursor: "pointer",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)"
  },

  actionDisabled: {
    opacity: 0.65,
    cursor: "not-allowed"
  },

  actionIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  actionIconBlue: {
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

  actionIconPurple: {
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

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(220px,100%),1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
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

  cardIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f3e8ff",
    display: "flex",
    flexWrap: "wrap",
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

  cardNumberGreen: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  cardNumberPurple: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))",
    gap: "24px"
  },

  history: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  statusPanel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  sectionHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  sectionTitle: {
    margin: 0,
    color: "#4c1d95",
    fontSize: "24px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "#faf5ff",
    color: "#6d28d9",
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
    background: "#fbfaff",
    border: "1px solid #ede9fe",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: "14px"
  },

  historyIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "15px",
    background: "#ede9fe",
    display: "flex",
    flexWrap: "wrap",
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
    background: "#fbfaff",
    border: "1px solid #ede9fe",
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
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "16px",
    padding: "14px",
    color: "#7c3aed",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "800"
  }
};

export default DashboardMorador;