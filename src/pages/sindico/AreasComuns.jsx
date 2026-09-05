import { confirmDialog } from "../../components/GlobalDialogs.jsx";
import {
  useEffect,
  useState,
} from "react";

import commonAreaApi from "../../Services/commonAreaApi.js";
import reservationApi from "../../Services/reservationApi.js";

function AreasComuns() {
  const estadoInicialArea = {
    nome: "",
    capacidade: "",
    horario: "",
    status: "Disponível",
  };

  const [areas, setAreas] =
    useState([]);

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState("Todos");

  const [novaArea, setNovaArea] =
    useState(
      estadoInicialArea
    );

  const [editId, setEditId] =
    useState(null);

  function limparCapacidade(valor) {
    return String(valor ?? "")
      .replace(/\D/g, "");
  }

  function horarioTexto(area) {
    if (
      area.openingTime &&
      area.closingTime
    ) {
      return `${area.openingTime} às ${area.closingTime}`;
    }

    return (
      area.openingTime ||
      area.closingTime ||
      ""
    );
  }

  function extrairHorarios(valor) {
    const matches =
      String(valor ?? "")
        .match(
          /(?:[01]\d|2[0-3]):[0-5]\d/g
        ) ?? [];

    if (matches.length < 2) {
      return null;
    }

    return {
      openingTime:
        matches[0],
      closingTime:
        matches[1],
    };
  }

  async function carregar() {
    try {
      const [
        areaData,
        reservationData,
      ] = await Promise.all([
        commonAreaApi.list(),
        reservationApi.list(),
      ]);
      const activeReservationList =
        reservationData ?? [];

      setAreas(
        (areaData ?? []).map(
          (item) => {
            const active =
              item.active !== false;

            const agora =
              new Date();

            const hoje =
              agora
                .toISOString()
                .slice(0, 10);

            const hora =
              agora
                .toTimeString()
                .slice(0, 5);

            const ocupada =
              active &&
              activeReservationList.some(
                (reserva) =>
                  reserva.commonAreaId ===
                    item.id &&
                  reserva.status ===
                    "APPROVED" &&
                  String(
                    reserva.reservationDate ??
                    ""
                  ).slice(0, 10) ===
                    hoje &&
                  reserva.startTime <=
                    hora &&
                  reserva.endTime >
                    hora
              );

            return {
              ...item,
              nome:
                item.name ??
                "",
              capacidade:
                item.capacity ===
                  null ||
                item.capacity ===
                  undefined
                  ? ""
                  : String(
                      item.capacity
                    ),
              horario:
                horarioTexto(
                  item
                ),
              status:
                !active
                  ? "Manutenção"
                  : ocupada
                    ? "Ocupado"
                    : "Disponível",
            };
          }
        )
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar as áreas comuns."
      );
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const areasFiltradas =
    areas.filter((area) => {
      const texto =
        busca
          .trim()
          .toLowerCase();

      const correspondeBusca =
        !texto ||
        area.nome
          ?.toLowerCase()
          .includes(texto) ||
        area.capacidade
          ?.toLowerCase()
          .includes(texto) ||
        area.horario
          ?.toLowerCase()
          .includes(texto) ||
        area.status
          ?.toLowerCase()
          .includes(texto);

      const correspondeStatus =
        filtroStatus ===
          "Todos" ||
        area.status ===
          filtroStatus;

      return (
        correspondeBusca &&
        correspondeStatus
      );
    });

  const disponiveis =
    areas.filter(
      (area) =>
        area.status ===
        "Disponível"
    );

  const ocupadas =
    areas.filter(
      (area) =>
        area.status ===
        "Ocupado"
    );

  const manutencao =
    areas.filter(
      (area) =>
        area.status ===
        "Manutenção"
    );

  function validarArea() {
    if (
      String(
        novaArea.nome ??
        ""
      ).trim().length < 3
    ) {
      alert(
        "Informe um nome válido para a área comum."
      );
      return false;
    }

    const horarios =
      extrairHorarios(
        novaArea.horario
      );

    if (!horarios) {
      alert(
        "Informe o funcionamento com horário inicial e final. Ex: 08:00 às 22:00."
      );
      return false;
    }

    if (
      horarios.openingTime >=
      horarios.closingTime
    ) {
      alert(
        "O horário final deve ser posterior ao inicial."
      );
      return false;
    }

    return true;
  }

  async function salvarArea() {
    if (!validarArea()) {
      return;
    }

    const horarios =
      extrairHorarios(
        novaArea.horario
      );

    const payload = {
      name:
        novaArea.nome.trim(),
      description:
        novaArea.description ??
        null,
      capacity:
        novaArea.capacidade
          ? Number(
              novaArea.capacidade
            )
          : null,
      openingTime:
        horarios.openingTime,
      closingTime:
        horarios.closingTime,
      reservationRequired:
        true,
      active:
        novaArea.status !==
        "Manutenção",
      rules:
        novaArea.rules ??
        null,
    };

    try {
      if (editId) {
        await commonAreaApi
          .update(
            editId,
            payload
          );
      } else {
        await commonAreaApi
          .create(
            payload
          );
      }

      await carregar();
      fecharModal();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível salvar a área comum."
      );
    }
  }

  function editarArea(area) {
    setNovaArea({
      ...estadoInicialArea,
      ...area,
      status:
        area.status ===
        "Ocupado"
          ? "Disponível"
          : area.status,
    });

    setEditId(
      area.id
    );

    setMostrarModal(
      true
    );
  }

  async function excluirArea(id) {
    if (
      !await confirmDialog(
        "Deseja excluir essa área?"
      )
    ) {
      return;
    }

    try {
      await commonAreaApi
        .remove(id);

      await carregar();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível excluir a área. Verifique se existem reservas ativas."
      );
    }
  }

  async function alterarStatus(
    id,
    status
  ) {
    if (status === "Ocupado") {
      alert(
        "O status Ocupado é calculado automaticamente a partir das reservas aprovadas em andamento."
      );
      return;
    }

    try {
      if (
        status ===
        "Manutenção"
      ) {
        await commonAreaApi
          .deactivate(id);
      } else {
        await commonAreaApi
          .activate(id);
      }

      await carregar();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível alterar o status da área."
      );
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovaArea(
      estadoInicialArea
    );
  }

  function corStatus(status) {
    if (
      status === "Disponível"
    ) {
      return {
        label:
          "Disponível",
        background:
          "#dcfce7",
        color:
          "#166534",
        border:
          "#bbf7d0",
      };
    }

    if (
      status === "Ocupado"
    ) {
      return {
        label:
          "Ocupado",
        background:
          "#fef3c7",
        color:
          "#92400e",
        border:
          "#fde68a",
      };
    }

    return {
      label:
        "Manutenção",
      background:
        "#fee2e2",
      color:
        "#b91c1c",
      border:
        "#fecaca",
    };
  }

  function iconeArea(nome) {
    const texto =
      String(nome ?? "")
        .toLowerCase();

    if (
      texto.includes(
        "pisc"
      )
    ) {
      return "🏊";
    }

    if (
      texto.includes(
        "churr"
      )
    ) {
      return "🔥";
    }

    if (
      texto.includes(
        "quadra"
      )
    ) {
      return "🏀";
    }

    if (
      texto.includes(
        "academ"
      )
    ) {
      return "🏋️";
    }

    if (
      texto.includes(
        "salão"
      ) ||
      texto.includes(
        "salao"
      )
    ) {
      return "🎉";
    }

    return "🏢";
  }

    return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            🏢 Centro de estruturas
          </span>

          <h1 style={styles.title}>
            Áreas Comuns
          </h1>

          <p style={styles.subtitle}>
            Catálogo operacional dos espaços do condomínio para reservas,
            manutenção e controle administrativo.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.structureBoard}>
            <div style={styles.structureItem}>
              <span>✅</span>
              <strong>{disponiveis.length}</strong>
              <small>disponíveis</small>
            </div>

            <div style={styles.structureItem}>
              <span>🟡</span>
              <strong>{ocupadas.length}</strong>
              <small>ocupadas</small>
            </div>

            <div style={styles.structureItem}>
              <span>🛠️</span>
              <strong>{manutencao.length}</strong>
              <small>manutenção</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovaArea(estadoInicialArea);
              setMostrarModal(true);
            }}
          >
            + Nova área
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por área, capacidade, horário ou status..."
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
          <option>Todos</option>
          <option>Disponível</option>
          <option>Ocupado</option>
          <option>Manutenção</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{areas.length}</b> áreas
          </span>

          <span>
            <b>{disponiveis.length}</b> disponíveis
          </span>

          <span>
            <b>{manutencao.length}</b> manutenção
          </span>
        </div>
      </section>

      <section style={styles.catalogPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>
              Catálogo
            </span>

            <h2 style={styles.panelTitle}>
              Estruturas cadastradas
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {areasFiltradas.length} resultado(s)
          </span>
        </div>

        {areasFiltradas.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              🏢
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhuma área comum encontrada
            </h3>

            <p style={styles.emptyText}>
              Cadastre espaços como piscina, salão, churrasqueira,
              quadra ou academia para liberar uso nas reservas.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovaArea(estadoInicialArea);
                setMostrarModal(true);
              }}
            >
              Cadastrar área
            </button>
          </div>
        ) : (
          <div style={styles.areaGrid}>
            {areasFiltradas.map((area) => {
              const status = corStatus(area.status);

              return (
                <article
                  key={area.id}
                  style={{
                    ...styles.areaCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardCover}>
                    <div style={styles.areaIcon}>
                      {iconeArea(area.nome)}
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

                  <div style={styles.areaBody}>
                    <h3 style={styles.areaName}>
                      {area.nome}
                    </h3>

                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <span>Capacidade</span>
                        <strong>{area.capacidade || "Opcional"}</strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span>Funcionamento</span>
                        <strong>{area.horario}</strong>
                      </div>
                    </div>

                    <div style={styles.integrationBox}>
                      <span>🔗 Reservas</span>
                      <p>
                        Essa área pode ser usada nos módulos de reservas do síndico e morador.
                      </p>
                    </div>

                    <div style={styles.actionRow}>
                      {area.status !== "Disponível" && (
                        <button
                          style={styles.availableButton}
                          onClick={() => alterarStatus(area.id, "Disponível")}
                        >
                          Liberar
                        </button>
                      )}

                      {area.status !== "Manutenção" && (
                        <button
                          style={styles.maintenanceButton}
                          onClick={() => alterarStatus(area.id, "Manutenção")}
                        >
                          Manutenção
                        </button>
                      )}

                      <button
                        style={styles.editButton}
                        onClick={() => editarArea(area)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => excluirArea(area.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {mostrarModal && (
        <div style={styles.modalBackground}>
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar estrutura" : "Nova estrutura"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar área comum"
                    : "Cadastrar área comum"}
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
                Dados da área
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Nome da área
                  </label>

                  <input
                    minLength="3"
                    placeholder="Ex: Piscina, Salão de Festas..."
                    value={novaArea.nome}
                    onChange={(e) =>
                      setNovaArea({
                        ...novaArea,
                        nome: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Capacidade
                  </label>

                  <input
                    inputMode="numeric"
                    placeholder="Opcional. Ex: 50"
                    value={novaArea.capacidade}
                    onChange={(e) =>
                      setNovaArea({
                        ...novaArea,
                        capacidade: limparCapacidade(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Funcionamento
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Horário
                  </label>

                  <input
                    placeholder="Ex: 08:00 às 22:00"
                    value={novaArea.horario}
                    onChange={(e) =>
                      setNovaArea({
                        ...novaArea,
                        horario: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Status
                  </label>

                  <select
                    value={novaArea.status}
                    onChange={(e) =>
                      setNovaArea({
                        ...novaArea,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Disponível</option>
                    <option>Manutenção</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveButton}
                onClick={salvarArea}
              >
                Salvar área
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
      "linear-gradient(135deg,#02140b,#5b21b6 55%,#15803d)",
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

  structureBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  structureItem: {
    width: "88px",
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
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
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

  catalogPanel: {
    minWidth: 0,
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
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

  areaGrid: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  areaCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    overflow: "hidden",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid #ede9fe"
  },

  cardCover: {
    height: "130px",
    background:
      "radial-gradient(circle at top right,rgba(187,247,208,0.60),transparent 34%), linear-gradient(135deg,#4c1d95,#7c3aed)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "20px"
  },

  areaIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "26px",
    background: "rgba(255,255,255,0.16)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)"
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },

  areaBody: {
    padding: "22px"
  },

  areaName: {
    margin: "0 0 16px",
    color: "#111827",
    fontSize: "23px"
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

  integrationBox: {
    marginTop: "12px",
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
    padding: "12px",
    borderRadius: "16px",
    fontSize: "13px"
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "8px",
    marginTop: "18px"
  },

  availableButton: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  maintenanceButton: {
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
    padding: "20px"
  },

  modal: {
    minWidth: 0,
    width: "720px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fbfaff",
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

export default AreasComuns;