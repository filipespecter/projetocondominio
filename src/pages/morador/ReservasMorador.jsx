import { confirmDialog } from "../../components/GlobalDialogs.jsx";
import {
  useEffect,
  useState,
} from "react";

import {
  me as getAuthenticatedUser,
} from "../../Services/authApi.js";

import reservationApi from "../../Services/reservationApi.js";
import commonAreaApi from "../../Services/commonAreaApi.js";

function ReservasMorador() {
  const [morador, setMorador] =
    useState(null);

  const [reservas, setReservas] =
    useState([]);

  const [areasComuns, setAreasComuns] =
    useState([]);

  const [area, setArea] =
    useState("");

  const [data, setData] =
    useState("");

  const [horario, setHorario] =
    useState("");

  const [horarioFim, setHorarioFim] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState("Todos");

  const statusFront = {
    PENDING:
      "pendente",
    APPROVED:
      "aprovada",
    REJECTED:
      "recusada",
    CANCELED:
      "cancelada",
    COMPLETED:
      "concluida",
  };

  function mapReservation(item) {
    return {
      ...item,
      area:
        item.commonArea?.name ??
        "",
      areaId:
        item.commonAreaId,
      apartamento:
        item.apartment?.number ??
        "",
      data:
        String(
          item.reservationDate ??
          ""
        ).slice(0, 10),
      horario:
        item.startTime ??
        "",
      horarioFim:
        item.endTime ??
        "",
      observacao:
        item.notes ??
        item.purpose ??
        "",
      status:
        statusFront[
          item.status
        ] ??
        "pendente",
      criadoEm:
        item.createdAt
          ? new Date(
              item.createdAt
            ).toLocaleString(
              "pt-BR"
            )
          : "",
    };
  }

  function mapArea(item) {
    return {
      ...item,
      nome:
        item.name ?? "",
      status:
        item.active === false
          ? "Manutenção"
          : "Disponível",
    };
  }

  async function carregar() {
    try {
      const [
        user,
        reservationData,
        areaData,
      ] = await Promise.all([
        getAuthenticatedUser(),
        reservationApi.my(),
        commonAreaApi.list(
          "?active=true&reservationRequired=true"
        ),
      ]);

      setMorador({
        ...user,
        nome:
          user?.name ??
          "Morador",
        apartamento:
          user?.resident
            ?.apartment
            ?.number ??
          user?.apartment
            ?.number ??
          "",
        podeReservar:
          user?.resident
            ?.canReserve !==
          false,
      });

      setReservas(
        (reservationData ?? [])
          .map(
            mapReservation
          )
      );

      setAreasComuns(
        (areaData ?? [])
          .map(mapArea)
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar as reservas."
      );
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function possuiPermissaoReserva() {
    return (
      morador?.podeReservar !==
      false
    );
  }

  function limparFormulario() {
    setArea("");
    setData("");
    setHorario("");
    setHorarioFim("");
    setObservacao("");
  }

  async function solicitarReserva() {
    const areaSelecionada =
      areasComuns.find(
        (item) =>
          item.nome ===
          area
      );

    if (
      !areaSelecionada?.id ||
      !data ||
      !horario ||
      !horarioFim
    ) {
      alert(
        "Preencha área, data, horário inicial e horário final."
      );
      return;
    }

    if (
      !possuiPermissaoReserva()
    ) {
      alert(
        "Seu perfil não possui permissão para realizar reservas."
      );
      return;
    }

    try {
      await reservationApi
        .create({
          commonAreaId:
            areaSelecionada.id,
          reservationDate:
            data,
          startTime:
            horario,
          endTime:
            horarioFim,
          guestsCount:
            null,
          purpose:
            observacao?.trim() ||
            null,
          notes:
            observacao?.trim() ||
            null,
        });

      limparFormulario();
      await carregar();

      alert(
        "Reserva enviada para análise da administração."
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível solicitar a reserva."
      );
    }
  }

  async function cancelarReserva(id) {
    if (
      !await confirmDialog(
        "Deseja cancelar esta reserva?"
      )
    ) {
      return;
    }

    try {
      await reservationApi
        .cancel(id);

      await carregar();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível cancelar a reserva."
      );
    }
  }

  const opcoesAreas =
    areasComuns.filter(
      (item) =>
        item.status ===
        "Disponível"
    );

  const minhasReservas =
    reservas.filter(
      (item) => {
        const texto =
          busca
            .trim()
            .toLowerCase();

        const corresponde =
          !texto ||
          item.area
            ?.toLowerCase()
            .includes(texto) ||
          item.observacao
            ?.toLowerCase()
            .includes(texto) ||
          item.data
            ?.includes(texto);

        const statusLabel =
          obterStatus(
            item.status
          ).texto;

        const statusMatch =
          filtroStatus ===
            "Todos" ||
          statusLabel ===
            filtroStatus;

        return (
          corresponde &&
          statusMatch
        );
      }
    );

  const pendentes =
    reservas.filter(
      (r) =>
        r.status ===
        "pendente"
    ).length;

  const aprovadas =
    reservas.filter(
      (r) =>
        r.status ===
        "aprovada"
    ).length;

  const recusadas =
    reservas.filter(
      (r) =>
        r.status ===
        "recusada"
    ).length;

  function obterStatus(status) {
    if (
      status === "aprovada"
    ) {
      return {
        texto:
          "Aprovada",
        fundo:
          "#dcfce7",
        cor:
          "#166534",
      };
    }

    if (
      status === "recusada"
    ) {
      return {
        texto:
          "Recusada",
        fundo:
          "#fee2e2",
        cor:
          "#b91c1c",
      };
    }

    if (
      status === "cancelada"
    ) {
      return {
        texto:
          "Cancelada",
        fundo:
          "#f3f4f6",
        cor:
          "#4b5563",
      };
    }

    if (
      status === "concluida"
    ) {
      return {
        texto:
          "Concluída",
        fundo:
          "#dbeafe",
        cor:
          "#1d4ed8",
      };
    }

    return {
      texto:
        "Pendente",
      fundo:
        "#fef3c7",
      cor:
        "#92400e",
    };
  }

    return (
    <div style={styles.container}>
      {/* HERO */}

      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📅 Reservas online
          </span>

          <h1 style={styles.title}>
            Reservas
          </h1>

          <p style={styles.subtitle}>
            Solicite áreas comuns do condomínio e acompanhe
            a aprovação da administração.
          </p>

          {morador && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Morador:{" "}
                <strong>{morador.nome}</strong>
              </span>

              <span style={styles.apBadge}>
                Apto {morador.apartamento || "-"}
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Minhas reservas
          </p>

          <h3 style={styles.heroNumber}>
            {minhasReservas.length}
          </h3>

          <span style={styles.heroStatus}>
            Controle integrado
          </span>
        </div>
      </div>

      {/* RESUMO */}

      <div style={styles.resumeGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Reservas pendentes
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes}
            </h2>

            <span style={styles.cardHintLight}>
              aguardando aprovação
            </span>
          </div>

          <div style={styles.cardIconLight}>
            🕒
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Aprovadas
            </p>

            <h2 style={styles.resumeNumberGreen}>
              {aprovadas}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconRed}>
            🚫
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Recusadas
            </p>

            <h2 style={styles.resumeNumberRed}>
              {recusadas}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconBlue}>
            🏢
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Áreas disponíveis
            </p>

            <h2 style={styles.resumeNumberBlue}>
              {opcoesAreas.length}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* FORM */}

        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Nova reserva
              </h2>

              <p style={styles.sectionSubtitle}>
                Escolha a área comum, data e horário desejados.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              Solicitação
            </span>
          </div>

          <label style={styles.label}>
            Área comum
          </label>

          <select
            value={area}
            onChange={(e) =>
              setArea(e.target.value)
            }
            style={styles.input}
          >
            <option value="">
              Selecione a área
            </option>

            {opcoesAreas.map((item) => (
              <option
                key={item.id || item.nome}
                value={item.nome || item.area || item.titulo}
              >
                {item.nome || item.area || item.titulo}
              </option>
            ))}
          </select>

          {opcoesAreas.length === 0 && (
            <p style={styles.formHint}>
              Nenhuma área comum disponível no momento.
            </p>
          )}

          <label style={styles.label}>
            Data
          </label>

          <input
            type="date"
            value={data}
            onChange={(e) =>
              setData(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Horário
          </label>

          <input
            type="time"
            value={horario}
            onChange={(e) =>
              setHorario(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Horário final
          </label>

          <input
            type="time"
            value={horarioFim}
            onChange={(e) =>
              setHorarioFim(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Observação
          </label>

          <textarea
            placeholder="Ex: reserva para aniversário, reunião familiar..."
            value={observacao}
            onChange={(e) =>
              setObservacao(e.target.value)
            }
            style={styles.textarea}
          />

          <button
            style={{
              ...styles.button,
              ...(
                !possuiPermissaoReserva() || opcoesAreas.length === 0
                  ? styles.disabledButton
                  : {}
              )
            }}
            onClick={solicitarReserva}
            disabled={opcoesAreas.length === 0}
          >
            Solicitar reserva
          </button>

          <p style={styles.formHint}>
            {possuiPermissaoReserva()
              ? "Sua reserva ficará pendente até a análise do síndico."
              : "Seu perfil está como dependente. A permissão de reserva pode ser liberada pelo condomínio."}
          </p>
        </div>

        {/* LISTA */}

        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Minhas reservas
              </h2>

              <p style={styles.sectionSubtitle}>
                Acompanhe suas solicitações de áreas comuns.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                placeholder="Buscar reserva..."
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
                <option>Pendente</option>
                <option>Aprovada</option>
                <option>Recusada</option>
                <option>Cancelada</option>
              </select>
            </div>
          </div>

          {minhasReservas.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhuma reserva encontrada
              </h3>

              <p style={styles.emptyText}>
                Quando você solicitar uma reserva,
                ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div style={styles.list}>
              {minhasReservas.map((item) => {
                const status =
                  obterStatus(item.status);

                return (
                  <div
                    key={item.id}
                    style={styles.card}
                  >
                    <div style={styles.cardTop}>
                      <div style={styles.areaIcon}>
                        🏢
                      </div>

                      <div style={styles.cardContent}>
                        <div style={styles.badges}>
                          <span
                            style={{
                              ...styles.status,
                              background: status.fundo,
                              color: status.cor
                            }}
                          >
                            {status.texto}
                          </span>

                          <span style={styles.dateBadge}>
                            📅 {item.data}
                          </span>

                          <span style={styles.dateBadge}>
                            🕒 {item.horario}
                          </span>
                        </div>

                        <h2 style={styles.area}>
                          {item.area}
                        </h2>

                        {item.observacao && (
                          <p style={styles.description}>
                            {item.observacao}
                          </p>
                        )}

                        <div style={styles.meta}>
                          <span>
                            Solicitada em {item.criadoEm}
                          </span>

                          <span>
                            Apto {item.apartamento || morador?.apartamento || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.footer}>
                      <span style={styles.created}>
                        Status atual:{" "}
                        <strong>{status.texto}</strong>
                      </span>

                      {status.texto === "Pendente" && (
                        <button
                          style={styles.cancelButton}
                          onClick={() =>
                            cancelarReserva(item.id)
                          }
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const styles = {
  container: {
    width: "100%",
    minWidth: 0,
    overflowX: "hidden",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    minWidth: 0,
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
    minWidth: 0,
    display: "grid",
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

  cardIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#ede9fe",
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

  resumeNumberGreen: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  resumeNumberRed: {
    margin: "8px 0 0",
    color: "#dc2626",
    fontSize: "34px"
  },

  resumeNumberBlue: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  mainGrid: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "390px 1fr",
    gap: "24px",
    alignItems: "flex-start"
  },

  formCard: {
    minWidth: 0,
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  listCard: {
    minWidth: 0,
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

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "800"
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    boxSizing: "border-box",
    marginBottom: "15px"
  },

  textarea: {
    width: "100%",
    minHeight: "115px",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    boxSizing: "border-box",
    marginBottom: "16px",
    resize: "vertical",
    fontFamily: "Arial",
    lineHeight: "1.5"
  },

  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed"
  },

  button: {
    width: "100%",
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow:
      "0 12px 25px rgba(37,99,235,0.22)"
  },

  formHint: {
    margin: "14px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "1.5",
    textAlign: "center"
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  filters: {
    minWidth: 0,
    display: "flex",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    minWidth: "210px"
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
    gap: "18px",
    alignItems: "flex-start"
  },

  areaIcon: {
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

  cardContent: {
    flex: 1
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  status: {
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

  area: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "22px"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 14px"
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px"
  },

  footer: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #ddd6fe",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px"
  },

  created: {
    color: "#6b7280",
    fontSize: "13px"
  },

  cancelButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px 14px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  }
};

export default ReservasMorador;