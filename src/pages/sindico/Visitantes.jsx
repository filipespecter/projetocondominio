import { confirmDialog } from "../../components/GlobalDialogs.jsx";
import { useEffect, useState } from "react";
import visitorApi from "../../Services/visitorApi";

function Visitantes() {
  const estadoInicialVisitante = {
    nome: "",
    documento: "",
    telefone: "",
    apartamento: "",
    morador: "",
    moradorId: "",
    apartamentoId: null,
    observacao: "",
    entrada: "",
    autorizado: false,
    bloqueado: false,
    status: "Aguardando",
    tipo: "Visitante",
  };

  const [visitantes, setVisitantes] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novoVisitante, setNovoVisitante] = useState(estadoInicialVisitante);
  const [editId, setEditId] = useState(null);

  const statusFront = {
    WAITING: "Aguardando",
    AUTHORIZED: "Autorizado",
    INSIDE: "Em Visita",
    EXITED: "Saiu",
    DENIED: "Bloqueado",
    CANCELED: "Bloqueado",
  };

  function mapResident(r) {
    return {
      ...r,
      nome: r.user?.name ?? r.name ?? "",
      apartamento: r.apartment?.number ?? "",
      apto: r.apartment?.number ?? "",
      apartamentoId: r.apartmentId ?? r.apartment?.id ?? null,
      moradorPrincipal: Boolean(r.isPrimary),
    };
  }

  function mapVisitor(v, residentList = moradores) {
    const resident =
      residentList.find(
        (r) =>
          String(r.apartamentoId) ===
            String(v.apartmentId) &&
          r.moradorPrincipal
      ) ??
      residentList.find(
        (r) =>
          String(r.apartamentoId) ===
          String(v.apartmentId)
      );

    const dateSource =
      v.enteredAt ??
      v.expectedAt ??
      v.createdAt;

    return {
      ...v,
      nome: v.name ?? "",
      documento: v.document ?? "",
      telefone: v.phone ?? "",
      apartamento:
        v.apartment?.number ??
        resident?.apartamento ??
        "",
      apartamentoId:
        v.apartmentId ??
        v.apartment?.id ??
        null,
      morador:
        resident?.nome ??
        "",
      moradorId:
        resident?.id ??
        "",
      tipo:
        v.visitType ??
        "Visitante",
      tipoVisitante:
        v.visitType ??
        "Visitante",
      observacao:
        v.notes ??
        "",
      status:
        statusFront[v.status] ??
        v.status ??
        "Aguardando",
      entrada:
        v.enteredAt
          ? new Date(v.enteredAt).toLocaleTimeString(
              "pt-BR",
              { hour: "2-digit", minute: "2-digit" }
            )
          : "",
      data:
        dateSource
          ? new Date(dateSource).toLocaleDateString("pt-BR")
          : "",
      autorizado:
        ["AUTHORIZED", "INSIDE", "EXITED"].includes(v.status),
      bloqueado:
        v.status === "DENIED",
    };
  }

  async function carregar() {
    try {
      const [visitorData, residentData] =
        await Promise.all([
          visitorApi.list(),
          visitorApi.residentsDirectory(),
        ]);

      const mappedResidents =
        (residentData ?? []).map(mapResident);

      setMoradores(mappedResidents);
      setVisitantes(
        (visitorData ?? []).map((v) =>
          mapVisitor(v, mappedResidents)
        )
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar visitantes."
      );
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const visitantesNormalizados = visitantes;

  const visitantesFiltrados =
    visitantesNormalizados.filter((v) => {
      const texto = busca.toLowerCase();

      const correspondeBusca =
        v.nome?.toLowerCase().includes(texto) ||
        v.documento?.toLowerCase().includes(texto) ||
        v.telefone?.toLowerCase().includes(texto) ||
        v.apartamento?.toLowerCase().includes(texto) ||
        v.morador?.toLowerCase().includes(texto) ||
        v.tipo?.toLowerCase().includes(texto) ||
        v.status?.toLowerCase().includes(texto);

      return (
        correspondeBusca &&
        (filtroStatus === "Todos" ||
          v.status === filtroStatus)
      );
    });

  const pendentes =
    visitantesNormalizados.filter(
      (v) => v.status === "Aguardando"
    );

  const emVisita =
    visitantesNormalizados.filter(
      (v) => v.status === "Em Visita"
    );

  const autorizados =
    visitantesNormalizados.filter(
      (v) => v.status === "Autorizado"
    );

  const bloqueados =
    visitantesNormalizados.filter(
      (v) => v.status === "Bloqueado"
    );

  const encerrados =
    visitantesNormalizados.filter(
      (v) => v.status === "Saiu"
    );

  function limparDocumento(valor) {
    return String(valor || "")
      .replace(/[^\dA-Za-z.-]/g, "");
  }

  function limparTelefone(valor) {
    return String(valor || "")
      .replace(/\D/g, "");
  }

  function validarHora(valor) {
    if (!valor) return true;
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
  }

  function validarDocumento(valor) {
    const doc = String(valor || "").trim();
    if (!doc) return true;

    const cpfNumerico =
      doc.replace(/\D/g, "");

    if (cpfNumerico.length === 11) {
      return true;
    }

    return /^[0-9A-Za-z.-]{5,14}$/.test(doc);
  }

  function validarVisitante() {
    if (
      novoVisitante.nome.trim().length < 2 ||
      !novoVisitante.apartamentoId
    ) {
      alert(
        "Informe o nome do visitante e o morador/apartamento responsável."
      );
      return false;
    }

    if (
      novoVisitante.documento &&
      !validarDocumento(
        novoVisitante.documento
      )
    ) {
      alert("Documento inválido.");
      return false;
    }

    if (
      novoVisitante.entrada &&
      !validarHora(
        novoVisitante.entrada
      )
    ) {
      alert("Hora inválida. Use HH:mm.");
      return false;
    }

    return true;
  }

  function obterMoradorIdPorNomeApartamento(
    nome,
    apartamento
  ) {
    return (
      moradores.find(
        (m) =>
          m.nome === nome &&
          String(m.apartamento) ===
            String(apartamento)
      )?.id ?? ""
    );
  }

  function selecionarMorador(moradorId) {
    const morador =
      moradores.find(
        (m) =>
          String(m.id) ===
          String(moradorId)
      );

    if (!morador) {
      setNovoVisitante((prev) => ({
        ...prev,
        morador: "",
        moradorId: "",
        apartamento: "",
        apartamentoId: null,
      }));
      return;
    }

    setNovoVisitante((prev) => ({
      ...prev,
      morador: morador.nome,
      moradorId: morador.id,
      apartamento: morador.apartamento,
      apartamentoId: morador.apartamentoId,
    }));
  }

  async function salvarVisitante() {
    if (!validarVisitante()) return;

    const expectedAt =
      novoVisitante.entrada
        ? (() => {
            const [h, m] =
              novoVisitante.entrada
                .split(":")
                .map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d.toISOString();
          })()
        : null;

    const payload = {
      apartmentId:
        novoVisitante.apartamentoId,
      name:
        novoVisitante.nome.trim(),
      document:
        novoVisitante.documento?.trim() ||
        null,
      phone:
        novoVisitante.telefone?.trim() ||
        null,
      visitType:
        novoVisitante.tipo?.trim() ||
        null,
      vehicle: null,
      plate: null,
      notes:
        novoVisitante.observacao?.trim() ||
        null,
      expectedAt,
    };

    try {
      let saved;

      if (editId) {
        saved =
          await visitorApi.update(
            editId,
            payload
          );
      } else {
        saved =
          await visitorApi.create(
            payload
          );
      }

      if (
        !editId &&
        saved?.id &&
        novoVisitante.bloqueado
      ) {
        await visitorApi.deny(saved.id);
      } else if (
        !editId &&
        saved?.id &&
        novoVisitante.autorizado
      ) {
        await visitorApi.authorize(saved.id);
      }

      await carregar();
      fecharModal();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível salvar o visitante."
      );
    }
  }

  async function excluirVisitante(id) {
    if (
      !await confirmDialog(
        "Deseja realmente excluir este visitante?"
      )
    ) {
      return;
    }

    try {
      await visitorApi.remove(id);
      await carregar();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível excluir o visitante."
      );
    }
  }

  async function mudarStatus(
    id,
    status
  ) {
    try {
      if (status === "Autorizado") {
        await visitorApi.authorize(id);
      } else if (
        status === "Em Visita"
      ) {
        await visitorApi.registerEntry(id);
      } else if (status === "Saiu") {
        await visitorApi.registerExit(id);
      } else if (
        status === "Bloqueado"
      ) {
        await visitorApi.deny(id);
      }

      await carregar();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível alterar o status."
      );
    }
  }

  function corStatus(status) {
    switch (status) {
      case "Aguardando":
        return {
          label: "Aguardando",
          bg: "#fef3c7",
          color: "#92400e",
          border: "#fde68a"
        };
      case "Autorizado":
        return {
          label: "Autorizado",
          bg: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0"
        };
      case "Em Visita":
        return {
          label: "Em Visita",
          bg: "#dbeafe",
          color: "#1d4ed8",
          border: "#bfdbfe"
        };
      case "Saiu":
        return {
          label: "Saiu",
          bg: "#f3f4f6",
          color: "#4b5563",
          border: "#e5e7eb"
        };
      default:
        return {
          label: "Bloqueado",
          bg: "#fee2e2",
          color: "#b91c1c",
          border: "#fecaca"
        };
    }
  }

  function tipoVisual(tipo) {
    const texto =
      String(tipo || "").toLowerCase();

    if (texto.includes("familiar")) return "👪";
    if (texto.includes("prestador")) return "🛠️";
    if (texto.includes("entreg")) return "🛵";
    if (texto.includes("técn")) return "🔧";
    if (texto.includes("corret")) return "🏠";
    return "👤";
  }

  function iniciais(nome) {
    const partes =
      String(nome || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (partes.length === 0) return "?";
    if (partes.length === 1) {
      return partes[0]
        .charAt(0)
        .toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[
      partes.length - 1
    ].charAt(0)}`.toUpperCase();
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoVisitante(
      estadoInicialVisitante
    );
  }


  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>🛂 Controle de acesso</span>

          <h1 style={styles.title}>Visitantes</h1>

          <p style={styles.subtitle}>
            Monitore entradas, autorizações, bloqueios e saídas do condomínio.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.accessBoard}>
            <div style={styles.accessItem}>
              <span>🟡</span>
              <strong>{pendentes.length}</strong>
              <small>pendentes</small>
            </div>

            <div style={styles.accessItem}>
              <span>🟢</span>
              <strong>{emVisita.length}</strong>
              <small>em visita</small>
            </div>

            <div style={styles.accessItem}>
              <span>🔴</span>
              <strong>{bloqueados.length}</strong>
              <small>bloqueados</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovoVisitante(estadoInicialVisitante);
              setMostrarModal(true);
            }}
          >
            + Novo visitante
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar visitante, documento, morador, apartamento ou tipo..."
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
          <option>Aguardando</option>
          <option>Autorizado</option>
          <option>Em Visita</option>
          <option>Bloqueado</option>
          <option>Saiu</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{visitantes.length}</b> total
          </span>

          <span>
            <b>{autorizados.length}</b> liberados
          </span>

          <span>
            <b>{encerrados.length}</b> encerrados
          </span>
        </div>
      </section>

      <section style={styles.accessPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>Monitoramento</span>

            <h2 style={styles.panelTitle}>Fluxo de visitantes</h2>
          </div>

          <span style={styles.resultBadge}>
            {visitantesFiltrados.length} resultado(s)
          </span>
        </div>

        {visitantesFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🛂</div>

            <h3 style={styles.emptyTitle}>Nenhum visitante encontrado</h3>

            <p style={styles.emptyText}>
              Registre visitantes para acompanhar entrada, autorização e saída.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovoVisitante(estadoInicialVisitante);
                setMostrarModal(true);
              }}
            >
              Registrar visitante
            </button>
          </div>
        ) : (
          <div style={styles.visitorGrid}>
            {visitantesFiltrados.map((v) => {
              const status = corStatus(v.status);

              return (
                <article
                  key={v.id}
                  style={{
                    ...styles.visitorCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.identityArea}>
                      <div style={styles.avatar}>{iniciais(v.nome)}</div>

                      <div>
                        <h3 style={styles.visitorName}>{v.nome}</h3>

                        <p style={styles.document}>Doc: {v.documento}</p>
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background: status.bg,
                        color: status.color
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div style={styles.typeLine}>
                    <span style={styles.typeIcon}>
                      {tipoVisual(v.tipo || v.tipoVisitante)}
                    </span>

                    <strong>{v.tipo || v.tipoVisitante || "Visita"}</strong>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span>Morador responsável</span>
                      <strong>{v.morador || "N/A"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Apartamento</span>
                      <strong>{v.apartamento || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Telefone</span>
                      <strong>{v.telefone || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Entrada</span>
                      <strong>
                        {v.entrada || v.horarioEntrada || v.hora || "-"}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Data</span>
                      <strong>{v.data || "-"}</strong>
                    </div>
                  </div>

                  {v.observacao && (
                    <div style={styles.noteBox}>{v.observacao}</div>
                  )}

                  <div style={styles.actionRow}>
                    <button
                      style={styles.authorizeBtn}
                      onClick={() => mudarStatus(v.id, "Autorizado")}
                    >
                      Autorizar
                    </button>

                    <button
                      style={styles.enterBtn}
                      onClick={() => mudarStatus(v.id, "Em Visita")}
                    >
                      Entrou
                    </button>

                    <button
                      style={styles.exitBtn}
                      onClick={() => mudarStatus(v.id, "Saiu")}
                    >
                      Saiu
                    </button>

                    <button
                      style={styles.deleteBtn}
                      onClick={() => excluirVisitante(v.id)}
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
        <div style={styles.modalBg}>
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar acesso" : "Novo acesso"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null ? "Editar visitante" : "Registrar visitante"}
                </h2>
              </div>

              <button style={styles.closeButton} onClick={fecharModal}>
                ✕
              </button>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>Dados do visitante</h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Nome</label>

                  <input
                    minLength="3"
                    placeholder="Nome do visitante"
                    value={novoVisitante.nome}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        nome: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Documento</label>

                  <input
                    placeholder="CPF ou RG"
                    value={novoVisitante.documento}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        documento: limparDocumento(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Telefone</label>

                  <input
                    inputMode="numeric"
                    maxLength="11"
                    placeholder="Ex: 81999999999"
                    value={novoVisitante.telefone}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        telefone: limparTelefone(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Tipo</label>

                  <select
                    value={novoVisitante.tipo}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        tipo: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Visitante</option>
                    <option>Familiar</option>
                    <option>Prestador</option>
                    <option>Entregador</option>
                    <option>Corretor</option>
                    <option>Técnico</option>
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Hora de entrada</label>

                  <input
                    placeholder="Ex: 14:35"
                    maxLength="5"
                    value={novoVisitante.entrada}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        entrada: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>Responsável pela visita</h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Morador responsável</label>

                  <select
                    value={
                      novoVisitante.moradorId ||
                      obterMoradorIdPorNomeApartamento(
                        novoVisitante.morador,
                        novoVisitante.apartamento
                      )
                    }
                    onChange={(e) => selecionarMorador(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Selecione o morador responsável</option>

                    {moradores.map((morador) => (
                      <option key={morador.id} value={morador.id}>
                        {morador.nome} - Apto{" "}
                        {morador.apartamento || morador.apto}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Apartamento</label>

                  <input
                    placeholder="Apartamento"
                    value={novoVisitante.apartamento}
                    readOnly
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>Controle de acesso</h3>

              <div style={styles.accessOptions}>
                <label style={styles.optionCard}>
                  <input
                    type="checkbox"
                    checked={novoVisitante.autorizado}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        autorizado: e.target.checked,
                        bloqueado: e.target.checked
                          ? false
                          : novoVisitante.bloqueado
                      })
                    }
                  />

                  <span>✅ Autorizado</span>
                </label>

                <label style={styles.optionCard}>
                  <input
                    type="checkbox"
                    checked={novoVisitante.bloqueado}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        bloqueado: e.target.checked,
                        autorizado: e.target.checked
                          ? false
                          : novoVisitante.autorizado
                      })
                    }
                  />

                  <span>⛔ Bloqueado</span>
                </label>
              </div>

              <textarea
                placeholder="Observações"
                value={novoVisitante.observacao}
                onChange={(e) =>
                  setNovoVisitante({
                    ...novoVisitante,
                    observacao: e.target.value
                  })
                }
                style={styles.textarea}
              />
            </div>

            <div style={styles.modalButtons}>
              <button style={styles.saveBtn} onClick={salvarVisitante}>
                Salvar visitante
              </button>

              <button style={styles.cancelBtn} onClick={fecharModal}>
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
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#02140b,var(--ic-primary-dark) 55%,var(--ic-primary))",
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
    color: "var(--ic-primary-soft)",
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

  accessBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  accessItem: {
    width: "84px",
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
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "none",
    padding: "15px 20px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  controlStrip: {
    background: "white",
    border: "1px solid var(--ic-primary-border-soft)",
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
    border: "1px solid var(--ic-primary-border)",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px"
  },

  searchIcon: {
    color: "var(--ic-primary)",
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
    border: "1px solid var(--ic-primary-border)",
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

  accessPanel: {
    background: "white",
    border: "1px solid var(--ic-primary-soft-2)",
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
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "var(--ic-primary-deep)",
    fontSize: "28px"
  },

  resultBadge: {
    background: "var(--ic-primary-soft-3)",
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  visitorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  visitorCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid var(--ic-primary-soft-2)"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  identityArea: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary-light))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
    boxShadow: "0 14px 26px rgb(var(--ic-primary-rgb) / 0.18)"
  },

  visitorName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  document: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px"
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },

  typeLine: {
    background: "var(--ic-primary-soft-3)",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "18px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--ic-primary)",
    marginBottom: "14px"
  },

  typeIcon: {
    fontSize: "21px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  infoItem: {
    background: "white",
    border: "1px solid var(--ic-primary-soft-2)",
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

  authorizeBtn: {
    background: "var(--ic-primary-soft-2)",
    color: "var(--ic-primary-strong)",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  enterBtn: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  exitBtn: {
    background: "var(--ic-primary-soft-4)",
    color: "#374151",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteBtn: {
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
    border: "1px dashed var(--ic-primary-border)",
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
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  modalBg: {
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
    width: "100%",
    maxWidth: "780px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalTop: {
    background:
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary))",
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
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "26px",
    padding: "20px",
    marginBottom: "15px"
  },

  modalSectionTitle: {
    margin: "0 0 16px",
    color: "var(--ic-primary-deep)"
  },

  formGrid: {
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
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff"
  },

  accessOptions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "14px"
  },

  optionCard: {
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "17px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "900",
    color: "#374151"
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "Arial"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveBtn: {
    flex: 1,
    background:
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  },

  cancelBtn: {
    flex: 1,
    background: "var(--ic-primary-soft-4)",
    color: "#374151",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Visitantes;