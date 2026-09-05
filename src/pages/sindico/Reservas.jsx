import { confirmDialog, promptDialog } from "../../components/GlobalDialogs.jsx";
import {
  useEffect,
  useState,
} from "react";

import reservationApi from "../../Services/reservationApi.js";
import commonAreaApi from "../../Services/commonAreaApi.js";
import residentApi from "../../Services/residentApi.js";

function Reservas() {
  const estadoInicialReserva = {
    area: "",
    areaId: null,
    morador: "",
    moradorId: null,
    requestedByUserId: null,
    apartamento: "",
    apartamentoId: null,
    tipoMorador: "",
    moradorPrincipal: false,
    perfilMorador: "",
    data: "",
    horario: "",
    horarioFim: "",
    obs: "",
    status: "pendente",
  };

  const [reservas, setReservas] =
    useState([]);

  const [moradores, setMoradores] =
    useState([]);

  const [areasComuns, setAreasComuns] =
    useState([]);

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState("Todos");

  const [novaReserva, setNovaReserva] =
    useState(
      estadoInicialReserva
    );

  const [editId, setEditId] =
    useState(null);

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

  function mapResident(item) {
    return {
      ...item,
      nome:
        item.user?.name ??
        item.name ??
        "",
      requestedByUserId:
        item.user?.id ??
        item.userId ??
        null,
      apartamento:
        item.apartment?.number ??
        "",
      apto:
        item.apartment?.number ??
        "",
      apartamentoId:
        item.apartmentId ??
        item.apartment?.id ??
        null,
      tipoMorador:
        item.residentType ??
        "Morador",
      moradorPrincipal:
        Boolean(
          item.isPrimary
        ),
      perfilMorador:
        item.isPrimary
          ? "principal"
          : "dependente",
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

  function mapReservation(item) {
    return {
      ...item,
      area:
        item.commonArea?.name ??
        "",
      areaId:
        item.commonAreaId,
      morador:
        item.requestedBy?.name ??
        "",
      moradorId:
        item.requestedByUserId,
      requestedByUserId:
        item.requestedByUserId,
      apartamento:
        item.apartment?.number ??
        "",
      apartamentoId:
        item.apartmentId,
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
      obs:
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
      moradorPrincipal:
        false,
      tipoMorador:
        "Morador",
    };
  }

  async function carregar() {
    try {
      const [
        reservationData,
        areaData,
        residentData,
      ] = await Promise.all([
        reservationApi.list(),
        commonAreaApi.list(),
        residentApi.list(),
      ]);

      const mappedResidents =
        (residentData ?? [])
          .map(mapResident);

      setMoradores(
        mappedResidents
      );

      setAreasComuns(
        (areaData ?? [])
          .map(mapArea)
      );

      setReservas(
        (reservationData ?? [])
          .map((item) => {
            const mapped =
              mapReservation(
                item
              );

            const resident =
              mappedResidents
                .find(
                  (r) =>
                    r.requestedByUserId ===
                    item.requestedByUserId
                );

            return {
              ...mapped,
              moradorPrincipal:
                Boolean(
                  resident?.moradorPrincipal
                ),
              tipoMorador:
                resident?.tipoMorador ??
                "Morador",
            };
          })
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

  const reservasFiltradas =
    reservas.filter(
      (reserva) => {
        const texto =
          busca
            .trim()
            .toLowerCase();

        const match =
          !texto ||
          reserva.area
            ?.toLowerCase()
            .includes(texto) ||
          reserva.morador
            ?.toLowerCase()
            .includes(texto) ||
          reserva.apartamento
            ?.toLowerCase()
            .includes(texto) ||
          reserva.data
            ?.toLowerCase()
            .includes(texto) ||
          reserva.status
            ?.toLowerCase()
            .includes(texto);

        return (
          match &&
          (
            filtroStatus ===
              "Todos" ||
            reserva.status ===
              filtroStatus
          )
        );
      }
    );

  const reservasOrdenadas =
    [...reservasFiltradas]
      .sort(
        (a, b) =>
          `${b.data} ${b.horario}`
            .localeCompare(
              `${a.data} ${a.horario}`
            )
      );

  const pendentes =
    reservas.filter(
      (r) =>
        r.status ===
        "pendente"
    );

  const aprovadas =
    reservas.filter(
      (r) =>
        r.status ===
        "aprovada"
    );

  const recusadas =
    reservas.filter(
      (r) =>
        r.status ===
        "recusada"
    );

  function selecionarMorador(id) {
    const morador =
      moradores.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!morador) {
      return;
    }

    setNovaReserva(
      (prev) => ({
        ...prev,
        moradorId:
          morador.id,
        requestedByUserId:
          morador.requestedByUserId,
        morador:
          morador.nome,
        apartamento:
          morador.apartamento,
        apartamentoId:
          morador.apartamentoId,
        tipoMorador:
          morador.tipoMorador,
        moradorPrincipal:
          morador.moradorPrincipal,
        perfilMorador:
          morador.perfilMorador,
      })
    );
  }

  function areaSelecionada() {
    return areasComuns.find(
      (item) =>
        item.nome ===
        novaReserva.area
    );
  }

  async function salvarReserva() {
    const area =
      areaSelecionada();

    if (
      !area?.id ||
      !novaReserva.requestedByUserId ||
      !novaReserva.data ||
      !novaReserva.horario ||
      !novaReserva.horarioFim
    ) {
      alert(
        "Preencha área, morador, data, horário inicial e horário final."
      );
      return;
    }

    const payload = {
      commonAreaId:
        area.id,
      reservationDate:
        novaReserva.data,
      startTime:
        novaReserva.horario,
      endTime:
        novaReserva.horarioFim,
      guestsCount:
        null,
      purpose:
        novaReserva.obs?.trim() ||
        null,
      notes:
        novaReserva.obs?.trim() ||
        null,
    };

    try {
      if (editId) {
        await reservationApi
          .update(
            editId,
            payload
          );
      } else {
        await reservationApi
          .createAdministrative({
            ...payload,
            requestedByUserId:
              novaReserva
                .requestedByUserId,
            initialStatus:
              novaReserva.status ===
                "aprovada"
                ? "APPROVED"
                : "PENDING",
          });
      }

      await carregar();
      fecharModal();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível salvar a reserva."
      );
    }
  }

  async function alterarStatus(
    id,
    status
  ) {
    try {
      if (
        status === "aprovada"
      ) {
        await reservationApi
          .approve(id);
      } else if (
        status === "recusada"
      ) {
        const motivo =
          await promptDialog(
            "Informe o motivo da recusa:"
          );

        if (
          !motivo ||
          motivo.trim().length <
            2
        ) {
          return;
        }

        await reservationApi
          .reject(
            id,
            motivo.trim()
          );
      } else if (
        status === "pendente"
      ) {
        await reservationApi
          .reopen(id);
      }

      await carregar();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível alterar o status da reserva."
      );
    }
  }

  function editarReserva(reserva) {
    setNovaReserva({
      ...estadoInicialReserva,
      ...reserva,
    });

    setEditId(
      reserva.id
    );

    setMostrarModal(
      true
    );
  }

  async function excluirReserva(id) {
    if (
      !await confirmDialog(
        "Deseja excluir esta reserva?"
      )
    ) {
      return;
    }

    try {
      await reservationApi
        .remove(id);

      await carregar();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível excluir a reserva."
      );
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovaReserva(
      estadoInicialReserva
    );
  }

  function formatarData(value) {
    if (!value) {
      return "-";
    }

    const [
      year,
      month,
      day,
    ] =
      String(value)
        .slice(0, 10)
        .split("-");

    return (
      year &&
      month &&
      day
        ? `${day}/${month}/${year}`
        : value
    );
  }

  function corStatus(status) {
    if (
      status === "aprovada"
    ) {
      return {
        label:
          "Confirmada",
        background:
          "#dcfce7",
        color:
          "#166534",
        border:
          "#bbf7d0",
      };
    }

    if (
      status === "recusada"
    ) {
      return {
        label:
          "Recusada",
        background:
          "#fee2e2",
        color:
          "#b91c1c",
        border:
          "#fecaca",
      };
    }

    if (
      status === "cancelada"
    ) {
      return {
        label:
          "Cancelada",
        background:
          "#f3f4f6",
        color:
          "#4b5563",
        border:
          "#e5e7eb",
      };
    }

    if (
      status === "concluida"
    ) {
      return {
        label:
          "Concluída",
        background:
          "#dbeafe",
        color:
          "#1d4ed8",
        border:
          "#bfdbfe",
      };
    }

    return {
      label:
        "Em análise",
      background:
        "#fef3c7",
      color:
        "#92400e",
      border:
        "#fde68a",
    };
  }

  function iconeArea(nome) {
    const text =
      String(nome ?? "")
        .toLowerCase();

    if (
      text.includes(
        "pisc"
      )
    ) return "🏊";

    if (
      text.includes(
        "quadra"
      )
    ) return "🏀";

    if (
      text.includes(
        "churr"
      )
    ) return "🔥";

    if (
      text.includes(
        "academ"
      )
    ) return "🏋️";

    return "🏢";
  }


  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            📅 Central de reservas
          </span>

          <h1 style={styles.title}>
            Reservas
          </h1>

          <p style={styles.subtitle}>
            Analise solicitações, aprove reservas e organize o uso das áreas comuns cadastradas.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.reserveBoard}>
            <div style={styles.reserveItem}>
              <span>🟡</span>
              <strong>{pendentes.length}</strong>
              <small>em análise</small>
            </div>

            <div style={styles.reserveItem}>
              <span>🟢</span>
              <strong>{aprovadas.length}</strong>
              <small>confirmadas</small>
            </div>

            <div style={styles.reserveItem}>
              <span>🔴</span>
              <strong>{recusadas.length}</strong>
              <small>recusadas</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovaReserva(estadoInicialReserva);
              setMostrarModal(true);
            }}
          >
            + Nova reserva
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por área, morador, apartamento, data ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={styles.search}
          />
        </div>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={styles.filter}
        >
          <option value="Todos">Todos</option>
          <option value="pendente">Em análise</option>
          <option value="aprovada">Confirmadas</option>
          <option value="recusada">Recusadas</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{reservas.length}</b> total
          </span>

          <span>
            <b>{areasComuns.length}</b> áreas
          </span>

          <span>
            <b>{moradores.length}</b> moradores
          </span>
        </div>
      </section>

      <section style={styles.reservationPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>
              Agenda
            </span>

            <h2 style={styles.panelTitle}>
              Solicitações de reserva
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {reservasOrdenadas.length} resultado(s)
          </span>
        </div>

        {reservasOrdenadas.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📅
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhuma reserva encontrada
            </h3>

            <p style={styles.emptyText}>
              As reservas cadastradas pelo síndico ou solicitadas por moradores aparecerão aqui.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovaReserva(estadoInicialReserva);
                setMostrarModal(true);
              }}
            >
              Criar reserva
            </button>
          </div>
        ) : (
          <div style={styles.reservationGrid}>
            {reservasOrdenadas.map((r) => {
              const status = corStatus(r.status);

              return (
                <article
                  key={r.id}
                  style={{
                    ...styles.reservationCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.areaIdentity}>
                      <div style={styles.areaIcon}>
                        {iconeArea(r.area)}
                      </div>

                      <div>
                        <h3 style={styles.areaName}>
                          {r.area}
                        </h3>

                        <p style={styles.created}>
                          Criada em {r.criadoEm || "não informado"}
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background: status.background,
                        color: status.color
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div style={styles.scheduleBox}>
                    <div>
                      <span>Data</span>
                      <strong>{formatarData(r.data)}</strong>
                    </div>

                    <div>
                      <span>Horário</span>
                      <strong>{r.horario || "-"}</strong>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span>Morador</span>
                      <strong>{r.morador || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Apartamento</span>
                      <strong>{r.apartamento || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Perfil</span>
                      <strong>
                        {r.moradorPrincipal ? "Principal" : r.tipoMorador || "Morador"}
                      </strong>
                    </div>
                  </div>

                  {r.obs && (
                    <div style={styles.noteBox}>
                      {r.obs}
                    </div>
                  )}

                  <div style={styles.actionRow}>
                    {r.status === "pendente" && (
                      <>
                        <button
                          style={styles.approveButton}
                          onClick={() => alterarStatus(r.id, "aprovada")}
                        >
                          Aprovar
                        </button>

                        <button
                          style={styles.rejectButton}
                          onClick={() => alterarStatus(r.id, "recusada")}
                        >
                          Recusar
                        </button>
                      </>
                    )}

                    {r.status !== "pendente" && (
                      <button
                        style={styles.pendingButton}
                        onClick={() => alterarStatus(r.id, "pendente")}
                      >
                        Reabrir
                      </button>
                    )}

                    <button
                      style={styles.editButton}
                      onClick={() => editarReserva(r)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => excluirReserva(r.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {mostrarModal && (
        <div
          style={styles.modalBackground}
          onClick={fecharModal}
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId ? "Editar solicitação" : "Nova solicitação"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId ? "Editar reserva" : "Cadastrar reserva"}
                </h2>
              </div>

              <button
                style={styles.closeButton}
                onClick={fecharModal}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Área e responsável
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Área comum
                  </label>

                  <select
                    value={novaReserva.area}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        area: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option value="">
                      Selecione uma área
                    </option>

                    {areasComuns.map((area) => (
                      <option
                        key={area.id}
                        value={area.nome}
                      >
                        {area.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Morador
                  </label>

                  <select
                    value={
                      novaReserva.moradorId ||
                      moradores.find(
                        (m) =>
                          m.nome === novaReserva.morador &&
                          (
                            m.apto === novaReserva.apartamento ||
                            m.apartamento === novaReserva.apartamento
                          )
                      )?.id ||
                      ""
                    }
                    onChange={(e) => selecionarMorador(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">
                      Selecione o morador
                    </option>

                    {moradores.map((morador) => (
                      <option
                        key={morador.id}
                        value={morador.id}
                      >
                        {morador.nome} - Apto{" "}
                        {morador.apartamento || morador.apto} -{" "}
                        {morador.tipoMorador || "Morador"}
                        {morador.moradorPrincipal ? " - Principal" : " - Dependente"}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Apartamento
                  </label>

                  <input
                    placeholder="Apartamento"
                    value={novaReserva.apartamento}
                    readOnly
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Agenda
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Data
                  </label>

                  <input
                    type="date"
                    value={novaReserva.data}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        data: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Horário
                  </label>

                  <input
                    type="time"
                    value={novaReserva.horario}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        horario: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Horário final
                  </label>

                  <input
                    type="time"
                    value={novaReserva.horarioFim}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        horarioFim: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Status
                  </label>

                  <select
                    value={novaReserva.status}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option value="pendente">Em análise</option>
                    <option value="aprovada">Confirmada</option>
                  </select>
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Observação
                  </label>

                  <textarea
                    placeholder="Observação"
                    value={novaReserva.obs}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        obs: e.target.value
                      })
                    }
                    style={styles.textarea}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveButton}
                onClick={salvarReserva}
              >
                Salvar reserva
              </button>

              <button
                style={styles.cancelButton}
                onClick={fecharModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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
      "linear-gradient(135deg,#02140b,#5b21b6 55%,#7c3aed)",
    borderRadius: "36px",
    padding: "34px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    boxShadow: "0 26px 70px rgba(6,78,59,0.30)",
    marginBottom: "24px"
  },

  heroLeft: {
    maxWidth: "680px"
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#f3e8ff",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "44px",
    letterSpacing: "-1px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.76)",
    lineHeight: "1.55"
  },

  heroRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  reserveBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  reserveItem: {
    width: "92px",
    height: "76px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.11)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px"
  },

  heroButton: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "none",
    padding: "15px 20px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  controlStrip: {
    minWidth: 0,
    background: "white",
    border: "1px solid #ddd6fe",
    borderRadius: "28px",
    padding: "18px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 14px 35px rgba(88,28,135,0.07)"
  },

  searchWrap: {
    flex: 1,
    background: "#fbfaff",
    border: "1px solid #c4b5fd",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px"
  },

  searchIcon: {
    color: "#7c3aed",
    fontSize: "20px",
    marginRight: "8px"
  },

  search: {
    flex: 1,
    padding: "15px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px"
  },

  filter: {
    width: "170px",
    padding: "15px",
    borderRadius: "18px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff"
  },

  compactStats: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#374151"
  },

  reservationPanel: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(88,28,135,0.09)"
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  panelLabel: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "#4c1d95",
    fontSize: "28px"
  },

  resultBadge: {
    background: "#faf5ff",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  reservationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  reservationCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid #ede9fe"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  areaIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  areaIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,#4c1d95,#8b5cf6)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "900",
    boxShadow: "0 14px 26px rgba(124,58,237,0.18)"
  },

  areaName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  created: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "12px"
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },

  scheduleBox: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    color: "#7c3aed",
    marginBottom: "14px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  infoItem: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "17px",
    padding: "13px"
  },

  noteBox: {
    marginTop: "12px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "12px",
    borderRadius: "16px",
    fontSize: "13px"
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: "8px",
    marginTop: "18px"
  },

  approveButton: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  rejectButton: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  pendingButton: {
    background: "#fef3c7",
    color: "#92400e",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editButton: {
    background: "#ede9fe",
    color: "#6d28d9",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed #c4b5fd",
    borderRadius: "26px",
    padding: "48px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "44px",
    marginBottom: "12px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 18px",
    color: "#6b7280"
  },

  emptyButton: {
    background:
      "linear-gradient(135deg,#5b21b6,#8b5cf6)",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  modalBackground: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px",
    boxSizing: "border-box"
  },

  modal: {
    minWidth: 0,
    width: "100%",
    maxWidth: "780px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fbfaff",
    boxSizing: "border-box",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalTop: {
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
    color: "white",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px"
  },

  modalBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  modalTitle: {
    margin: "14px 0 0",
    fontSize: "28px"
  },

  closeButton: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    border: "none",
    background: "rgba(255,255,255,0.14)",
    color: "white",
    cursor: "pointer",
    fontWeight: "900"
  },

  modalSection: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "26px",
    padding: "20px",
    marginBottom: "15px"
  },

  modalSectionTitle: {
    margin: "0 0 16px",
    color: "#4c1d95"
  },

  formGrid: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px"
  },

  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  formRowFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  label: {
    color: "#374151",
    fontSize: "13px",
    fontWeight: "900"
  },

  input: {
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff"
  },

  textarea: {
    minHeight: "100px",
    resize: "vertical",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    fontFamily: "Arial"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
    flex: 1,
    background:
      "linear-gradient(135deg,#5b21b6,#8b5cf6)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  },

  cancelButton: {
    flex: 1,
    background: "#f5f3ff",
    color: "#374151",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Reservas;