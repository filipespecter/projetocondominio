import {
  useEffect,
  useState,
} from "react";

import noticeApi from "../../Services/noticeApi.js";

import {
  listarMinhasNotificacoes,
  marcarComoLida,
} from "../../Services/notificacaoService.js";

function AvisosMorador() {
  const [avisos, setAvisos] =
    useState([]);

  const [busca, setBusca] =
    useState("");

  const [
    filtroPrioridade,
    setFiltroPrioridade,
  ] = useState("Todas");

  const priorityFront = {
    URGENT: "Urgente",
    HIGH: "Alta",
    NORMAL: "Média",
    LOW: "Baixa",
  };

  async function carregarAvisos() {
    try {
      const [
        noticeData,
        notifications,
      ] = await Promise.all([
        noticeApi.list(
          "?publishedOnly=true"
        ),
        listarMinhasNotificacoes(),
      ]);

      const noticeNotifications =
        (notifications ?? [])
          .filter(
            (item) =>
              item.module ===
                "NOTICE" &&
              item.referenceId
          );

      const notificationByReference =
        new Map(
          noticeNotifications.map(
            (item) => [
              String(
                item.referenceId
              ),
              item,
            ]
          )
        );

      setAvisos(
        (noticeData ?? [])
          .map((item) => {
            const notification =
              notificationByReference
                .get(
                  String(item.id)
                );

            return {
              ...item,
              titulo:
                item.title ?? "",
              descricao:
                item.message ?? "",
              prioridade:
                priorityFront[
                  item.priority
                ] ??
                "Média",
              data:
                item.publishedAt ||
                item.createdAt
                  ? new Date(
                      item.publishedAt ??
                      item.createdAt
                    ).toLocaleString(
                      "pt-BR"
                    )
                  : "",
              lido:
                Boolean(
                  notification?.readAt
                ),
              notificationId:
                notification?.id ??
                null,
              origem:
                "Síndico",
              categoria:
                item.category ??
                "Aviso",
            };
          })
          .sort(
            (a, b) =>
              new Date(
                b.publishedAt ??
                b.createdAt ??
                0
              ) -
              new Date(
                a.publishedAt ??
                a.createdAt ??
                0
              )
          )
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar os avisos."
      );
    }
  }

  useEffect(() => {
    carregarAvisos();
  }, []);

  function normalizarPrioridade(
    prioridade
  ) {
    return (
      prioridade ??
      "Média"
    );
  }

  function obterPrioridade(
    prioridade
  ) {
    const value =
      normalizarPrioridade(
        prioridade
      );

    if (
      value === "Urgente"
    ) {
      return {
        label:
          "Urgente",
        background:
          "#fee2e2",
        color:
          "#991b1b",
        border:
          "#fecaca",
      };
    }

    if (
      value === "Alta"
    ) {
      return {
        label:
          "Alta",
        background:
          "#ffedd5",
        color:
          "#9a3412",
        border:
          "#fed7aa",
      };
    }

    if (
      value === "Baixa"
    ) {
      return {
        label:
          "Baixa",
        background:
          "#dcfce7",
        color:
          "#166534",
        border:
          "#bbf7d0",
      };
    }

    return {
      label:
        "Média",
      background:
        "#fef3c7",
      color:
        "#92400e",
      border:
        "#fde68a",
    };
  }

  async function marcarComoLido(
    item
  ) {
    if (
      !item.notificationId ||
      item.lido
    ) {
      return;
    }

    try {
      await marcarComoLida(
        item.notificationId
      );

      await carregarAvisos();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível marcar o aviso como lido."
      );
    }
  }

  const urgentes =
    avisos.filter(
      (item) =>
        item.prioridade ===
        "Urgente"
    ).length;

  const importantes =
    avisos.filter(
      (item) =>
        item.prioridade ===
        "Alta"
    ).length;

  const normais =
    avisos.filter(
      (item) =>
        [
          "Média",
          "Baixa",
        ].includes(
          item.prioridade
        )
    ).length;

  const avisosFiltrados =
    avisos.filter(
      (item) => {
        const texto =
          busca
            .trim()
            .toLowerCase();

        const corresponde =
          !texto ||
          item.titulo
            ?.toLowerCase()
            .includes(texto) ||
          item.descricao
            ?.toLowerCase()
            .includes(texto) ||
          item.categoria
            ?.toLowerCase()
            .includes(texto);

        const prioridadeMatch =
          filtroPrioridade ===
            "Todas" ||
          item.prioridade ===
            filtroPrioridade;

        return (
          corresponde &&
          prioridadeMatch
        );
      }
    );

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📢 Comunicação oficial
          </span>

          <h1 style={styles.title}>
            Avisos
          </h1>

          <p style={styles.subtitle}>
            Consulte comunicados publicados pela administração.
            Somente avisos destinados ao seu perfil ou apartamento
            aparecem nesta tela.
          </p>
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>Total de avisos</p>

          <h3 style={styles.heroNumber}>{avisos.length}</h3>

          <span style={styles.heroStatus}>
            comunicados disponíveis
          </span>
        </div>
      </section>

      <div style={styles.resumeGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>Total de avisos</p>

            <h2 style={styles.cardNumberLight}>{avisos.length}</h2>

            <span style={styles.cardHintLight}>
              comunicação do condomínio
            </span>
          </div>

          <div style={styles.cardIconLight}>📢</div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconRed}>🚨</div>

          <div>
            <p style={styles.resumeLabel}>Urgentes</p>

            <h2 style={styles.resumeNumberRed}>
              {urgentes}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconOrange}>⚠️</div>

          <div>
            <p style={styles.resumeLabel}>Alta prioridade</p>

            <h2 style={styles.resumeNumberOrange}>
              {importantes}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconGreen}>✅</div>

          <div>
            <p style={styles.resumeLabel}>Demais avisos</p>

            <h2 style={styles.resumeNumberGreen}>
              {normais}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.filterCard}>
        <div>
          <h2 style={styles.sectionTitle}>
            Comunicados
          </h2>

          <p style={styles.sectionSubtitle}>
            Consulte avisos enviados pelo síndico.
            Respostas de solicitações e demais eventos chegam
            também pela Central de Notificações.
          </p>
        </div>

        <div style={styles.filters}>
          <input
            placeholder="Buscar aviso..."
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            style={styles.search}
          />

          <select
            value={filtroPrioridade}
            onChange={(e) =>
              setFiltroPrioridade(
                e.target.value
              )
            }
            style={styles.filter}
          >
            <option>Todas</option>
            <option>Urgente</option>
            <option>Alta</option>
            <option>Média</option>
            <option>Baixa</option>
          </select>
        </div>
      </div>

      <div style={styles.listCard}>
        {avisosFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📭</div>

            <h3 style={styles.emptyTitle}>
              Nenhum aviso disponível
            </h3>

            <p style={styles.emptyText}>
              Não existem avisos publicados para você neste momento.
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {avisosFiltrados.map((item) => {
              const prioridade =
                obterPrioridade(
                  item.prioridade
                );

              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.noticeCard,
                    borderColor:
                      prioridade.border,
                  }}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.noticeIcon}>
                      📢
                    </div>

                    <span
                      style={{
                        ...styles.priorityBadge,
                        background:
                          prioridade.background,
                        color:
                          prioridade.color,
                      }}
                    >
                      {prioridade.label}
                    </span>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.categoryBadge}>
                      {item.categoria}
                    </span>

                    <span style={styles.originBadge}>
                      {item.origem}
                    </span>

                    <span
                      style={{
                        ...styles.readBadge,
                        ...(item.lido
                          ? styles.readBadgeDone
                          : {}),
                      }}
                    >
                      {item.lido
                        ? "Lido"
                        : "Novo"}
                    </span>
                  </div>

                  <h3 style={styles.noticeTitle}>
                    {item.titulo}
                  </h3>

                  <p style={styles.description}>
                    {item.descricao}
                  </p>

                  <div style={styles.meta}>
                    <span>Publicado em</span>
                    <strong>{item.data}</strong>
                  </div>

                  {!item.lido &&
                    item.notificationId && (
                    <button
                      style={styles.readButton}
                      onClick={() =>
                        marcarComoLido(
                          item
                        )
                      }
                    >
                      Marcar como lido
                    </button>
                  )}
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
    minWidth: 0,
    boxSizing: "border-box",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    minWidth: 0,
    flexWrap: "wrap",
    background:
      "linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
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
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  resumeGrid: {
    display: "grid",
    minWidth: 0,
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
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
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 16px 36px rgba(124,58,237,0.24), 0 0 28px rgba(168,85,247,0.12)"
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
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid #ede9fe"
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
    background: "#f3e8ff",
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
    color: "#7c3aed",
    fontSize: "34px"
  },

  listCard: {
    minWidth: 0,
    overflow: "hidden",
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
    color: "#4c1d95",
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
    width: "100%",
    minWidth: "180px",
    flex: "1 1 230px",
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    boxSizing: "border-box"
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

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  card: {
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
    gap: "18px",
    alignItems: "flex-start"
  },

  noticeIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "20px",
    background: "white",
    border: "1px solid #ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    flexShrink: 0
  },

  noticeContent: {
    flex: "1 1 260px",
    minWidth: 0
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
    background: "#faf5ff",
    color: "#6d28d9",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  originBadge: {
    background: "#ecfdf5",
    color: "#7c3aed",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  statusBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  newBadge: {
    background: "#fee2e2",
    color: "#991b1b",
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
  },

  responseBox: {
    marginTop: "14px",
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "14px",
    color: "#4c1d95"
  },

  readButton: {
    marginTop: "14px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "11px 14px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  }
};

export default AvisosMorador;