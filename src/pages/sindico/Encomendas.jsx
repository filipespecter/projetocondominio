import { confirmDialog, promptDialog } from "../../components/GlobalDialogs.jsx";
import { useEffect, useState } from "react";
import packageApi from "../../Services/packageApi.js";

function Encomendas() {
  const estadoInicialEncomenda = {
    morador: "",
    moradorId: "",
    apartamento: "",
    apartamentoId: null,
    descricao: "",
    codigo: "",
    transportadora: "",
    status: "Recebido",
    tipo: "Encomenda",
  };

  const [encomendas, setEncomendas] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novaEncomenda, setNovaEncomenda] = useState(estadoInicialEncomenda);
  const [editId, setEditId] = useState(null);


  function normalizarCodigo(valor) {
    return String(valor || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toUpperCase();
  }

  function obterCodigoRastreio(item = {}) {
    return normalizarCodigo(
      item.codigoRastreio ??
      item.trackingCode ??
      item.rastreio ??
      item.codigo ??
      ""
    );
  }

  function mapPackage(item, residentList = []) {
    const resident =
      item.expectedByResident ??
      item.resident ??
      residentList.find(
        (r) =>
          String(r.id) ===
          String(
            item.expectedByResidentId ??
            item.residentId ??
            ""
          )
      ) ??
      residentList.find(
        (r) =>
          String(r.apartamentoId) ===
          String(item.apartmentId)
      );

    const user =
      resident?.user ??
      resident ??
      {};

    const statusMap = {
      EXPECTED: "Aguardando",
      RECEIVED: "Recebido",
      DELIVERED: "Entregue",
      CANCELED: "Cancelado",
    };

    return {
      ...item,
      codigoInterno:
        item.internalCode ??
        "",
      codigoRastreio:
        item.trackingCode ??
        "",
      codigo:
        item.trackingCode ??
        "",
      rastreio:
        item.trackingCode ??
        "",
      apartamento:
        item.apartment?.number ??
        resident?.apartment?.number ??
        resident?.apartamento ??
        "",
      apartamentoId:
        item.apartmentId ??
        item.apartment?.id ??
        null,
      moradorId:
        resident?.id ??
        null,
      morador:
        user.name ??
        resident?.nome ??
        "Morador",
      nome:
        user.name ??
        resident?.nome ??
        "Morador",
      tipo:
        item.type ??
        "Encomenda",
      descricao:
        item.description ??
        item.type ??
        "Encomenda",
      transportadora:
        item.carrier ??
        "",
      status:
        statusMap[item.status] ??
        item.status ??
        "Recebido",
      data:
        item.receivedAt
          ? new Date(item.receivedAt).toLocaleString("pt-BR")
          : item.createdAt
            ? new Date(item.createdAt).toLocaleString("pt-BR")
            : "",
      dataRecebimento:
        item.receivedAt
          ? new Date(item.receivedAt).toLocaleDateString("pt-BR")
          : "",
      receivedAtRaw: item.receivedAt ?? item.createdAt ?? null,
      retiradaEm:
        item.deliveredAt
          ? new Date(item.deliveredAt).toLocaleString("pt-BR")
          : "",
      retiradoPor:
        item.withdrawnBy ??
        "",
      retiradoDocumento:
        item.withdrawnDocument ??
        "",
      pickupMethod:
        item.pickupMethod ??
        "",
      pickupPersonType:
        item.pickupPersonType ??
        "",
      porteiroRecebimento:
        item.receivedBy?.name ??
        item.receivedBy?.user?.name ??
        "",
    };
  }

  function mapResident(r) {
    return {
      ...r,
      nome:
        r.user?.name ??
        r.name ??
        "",
      apartamento:
        r.apartment?.number ??
        "",
      apto:
        r.apartment?.number ??
        "",
      apartamentoId:
        r.apartmentId ??
        r.apartment?.id ??
        null,
    };
  }

  async function carregar() {
    try {
      const [
        packageData,
        residentData,
      ] = await Promise.all([
        packageApi.list(),
        packageApi.residentsDirectory(),
      ]);

      const mappedResidents =
        (residentData ?? []).map(
          mapResident
        );

      setMoradores(
        mappedResidents
      );

      setEncomendas(
        (packageData ?? []).map(
          (item) =>
            mapPackage(
              item,
              mappedResidents
            )
        )
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar encomendas."
      );
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const encomendasFiltradas =
    encomendas.filter((e) => {
      const texto =
        busca.toLowerCase();

      const corresponde =
        e.morador?.toLowerCase().includes(texto) ||
        e.apartamento?.toLowerCase().includes(texto) ||
        e.codigoInterno?.toLowerCase().includes(texto) ||
        e.codigoRastreio?.toLowerCase().includes(texto) ||
        e.transportadora?.toLowerCase().includes(texto) ||
        e.status?.toLowerCase().includes(texto);

      return (
        corresponde &&
        (
          filtroStatus === "Todos" ||
          e.status === filtroStatus
        )
      );
    });

  const recebidas =
    encomendas.filter(
      (e) => e.status === "Recebido"
    );

  const entregues =
    encomendas.filter(
      (e) => e.status === "Entregue"
    );

  const LIMITE_ATRASO_DIAS = 3;
  const agora = Date.now();
  const atrasadas = encomendas.filter((e) => {
    if (e.status !== "Recebido" || !e.receivedAtRaw) return false;
    const recebidoEm = new Date(e.receivedAtRaw).getTime();
    if (Number.isNaN(recebidoEm)) return false;
    return agora - recebidoEm >= LIMITE_ATRASO_DIAS * 24 * 60 * 60 * 1000;
  });

  function limparCodigo(valor) {
    return normalizarCodigo(valor);
  }

  function selecionarMorador(moradorId) {
    const morador =
      moradores.find(
        (m) =>
          String(m.id) ===
          String(moradorId)
      );

    if (!morador) {
      setNovaEncomenda(
        (prev) => ({
          ...prev,
          moradorId: "",
          morador: "",
          apartamento: "",
          apartamentoId: null,
        })
      );
      return;
    }

    setNovaEncomenda(
      (prev) => ({
        ...prev,
        moradorId:
          morador.id,
        morador:
          morador.nome,
        apartamento:
          morador.apartamento,
        apartamentoId:
          morador.apartamentoId,
      })
    );
  }

  async function salvarEncomenda() {
    if (
      !novaEncomenda.apartamentoId ||
      novaEncomenda.descricao.trim().length < 2
    ) {
      alert(
        "Selecione o morador/apartamento e informe a descrição."
      );
      return;
    }

    const payload = {
      apartmentId:
        novaEncomenda.apartamentoId,
      expectedByResidentId:
        novaEncomenda.moradorId ||
        null,
      type:
        novaEncomenda.tipo ||
        "Encomenda",
      description:
        novaEncomenda.descricao.trim(),
      carrier:
        novaEncomenda.transportadora?.trim() ||
        null,
      trackingCode:
        normalizarCodigo(
          novaEncomenda.codigo
        ) || null,
      notes: null,
      expectedAt: null,
    };

    try {
      if (editId) {
        await packageApi.update(
          editId,
          payload
        );
      } else {
        await packageApi.createReceived(
          payload
        );
      }

      await carregar();
      fecharModal();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível salvar a encomenda."
      );
    }
  }

  async function alterarStatus(
    id,
    status
  ) {
    try {
      if (status === "Entregue") {
        const retiradoPor =
          await promptDialog(
            "Nome de quem retirou a encomenda:"
          );

        if (!retiradoPor?.trim()) {
          return;
        }

        await packageApi.deliver(
          id,
          retiradoPor.trim()
        );

        await carregar();
        return;
      }

      if (status === "Atrasado") {
        alert(
          "Encomendas recebidas há 3 dias ou mais são sinalizadas automaticamente como atrasadas até a retirada."
        );
      }
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível atualizar a encomenda."
      );
    }
  }

  function editarEncomenda(e) {
    setEditId(e.id);
    setNovaEncomenda({
      ...estadoInicialEncomenda,
      ...e,
      codigo:
        obterCodigoRastreio(e),
    });
    setMostrarModal(true);
  }

  async function excluirEncomenda(id) {
    if (
      !await confirmDialog(
        "Deseja excluir este registro?"
      )
    ) {
      return;
    }

    try {
      await packageApi.remove(id);
      await carregar();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível excluir a encomenda."
      );
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovaEncomenda(
      estadoInicialEncomenda
    );
  }

  function corStatus(status) {
    if (status === "Entregue") {
      return {
        label: "Entregue",
        background: "#dcfce7",
        color: "#166534",
        border: "#bbf7d0",
      };
    }

    if (status === "Aguardando") {
      return {
        label: "Aguardando",
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "#bfdbfe",
      };
    }

    if (status === "Cancelado") {
      return {
        label: "Cancelado",
        background: "#fee2e2",
        color: "#b91c1c",
        border: "#fecaca",
      };
    }

    return {
      label: "Recebido",
      background: "#fef3c7",
      color: "#92400e",
      border: "#fde68a",
    };
  }

  function iconeTransportadora(
    transportadora
  ) {
    const texto =
      String(
        transportadora || ""
      ).toLowerCase();

    if (texto.includes("correio")) return "📮";
    if (texto.includes("amazon")) return "🟧";
    if (texto.includes("mercado")) return "🛒";
    if (texto.includes("shopee")) return "🛍️";
    if (texto.includes("jadlog")) return "🚚";
    if (texto.includes("loggi")) return "⚡";
    return "📦";
  }


  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            📦 Central logística
          </span>

          <h1 style={styles.title}>
            Encomendas
          </h1>

          <p style={styles.subtitle}>
            Controle de recebimento, retirada e histórico de encomendas do condomínio.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.packageBoard}>
            <div style={styles.packageItem}>
              <span>📥</span>
              <strong>{recebidas.length}</strong>
              <small>recebidas</small>
            </div>

            <div style={styles.packageItem}>
              <span>✅</span>
              <strong>{entregues.length}</strong>
              <small>entregues</small>
            </div>

            <div style={styles.packageItem}>
              <span>⚠️</span>
              <strong>{atrasadas.length}</strong>
              <small>atrasadas</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovaEncomenda(estadoInicialEncomenda);
              setMostrarModal(true);
            }}
          >
            + Nova encomenda
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por morador, apartamento, código, transportadora ou status..."
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
          <option>Recebido</option>
          <option>Entregue</option>
          <option>Atrasado</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{encomendas.length}</b> total
          </span>

          <span>
            <b>{recebidas.length}</b> pendentes
          </span>

          <span>
            <b>{entregues.length}</b> retiradas
          </span>
        </div>
      </section>

      <section style={styles.logisticPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>
              Recebimento
            </span>

            <h2 style={styles.panelTitle}>
              Fluxo de encomendas
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {encomendasFiltradas.length} resultado(s)
          </span>
        </div>

        {encomendasFiltradas.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📦
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhuma encomenda encontrada
            </h3>

            <p style={styles.emptyText}>
              Registre uma encomenda para acompanhar recebimento e retirada.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovaEncomenda(estadoInicialEncomenda);
                setMostrarModal(true);
              }}
            >
              Registrar encomenda
            </button>
          </div>
        ) : (
          <div style={styles.packageGrid}>
            {encomendasFiltradas.map((e) => {
              const status = corStatus(e.status);

              return (
                <article
                  key={e.id}
                  style={{
                    ...styles.packageCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.packageIdentity}>
                      <div style={styles.packageIcon}>
                        {iconeTransportadora(e.transportadora)}
                      </div>

                      <div>
                        <h3 style={styles.packageTitle}>
                          {e.descricao}
                        </h3>

                        <p style={styles.packageCode}>
                          Código: {e.codigoInterno || "Sem código interno"}{" "}
                          {obterCodigoRastreio(e)
                            ? `• Rastreio: ${obterCodigoRastreio(e)}`
                            : ""}
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

                  <div style={styles.receiverBox}>
                    <span style={styles.receiverIcon}>
                      🏠
                    </span>

                    <div>
                      <strong>{e.morador}</strong>
                      <p>Apartamento {e.apartamento || "-"}</p>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span>Recebida em</span>
                      <strong>{e.data || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Transportadora</span>
                      <strong>{e.transportadora || "Não informada"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Retirada</span>
                      <strong>{e.retiradaEm || "Pendente"}</strong>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    {e.status !== "Entregue" && (
                      <button
                        style={styles.successButton}
                        onClick={() => alterarStatus(e.id, "Entregue")}
                      >
                        Entregar
                      </button>
                    )}

                    {e.status !== "Atrasado" && e.status !== "Entregue" && (
                      <button
                        style={styles.warningButton}
                        onClick={() => alterarStatus(e.id, "Atrasado")}
                      >
                        Atrasar
                      </button>
                    )}

                    <button
                      style={styles.editButton}
                      onClick={() => editarEncomenda(e)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => excluirEncomenda(e.id)}
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
        <div style={styles.modalBackground}>
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar pacote" : "Novo pacote"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar encomenda"
                    : "Registrar encomenda"}
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
                Destinatário
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Morador
                  </label>

                  {moradores.length > 0 ? (
                    <select
                      value={
                        novaEncomenda.moradorId ||
                        moradores.find(
                          (m) => m.nome === novaEncomenda.morador
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
                          {morador.apartamento || morador.apto}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="Nome do morador"
                      value={novaEncomenda.morador}
                      onChange={(e) =>
                        setNovaEncomenda({
                          ...novaEncomenda,
                          morador: e.target.value
                        })
                      }
                      style={styles.input}
                    />
                  )}
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Apartamento
                  </label>

                  <input
                    placeholder="Apartamento"
                    inputMode="numeric"
                                        maxLength="6"
                    value={novaEncomenda.apartamento}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        apartamento: e.target.value.replace(/\\D/g, "").slice(0, 6)
                      })
                    }
                    style={styles.input}
                    readOnly={moradores.length > 0}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Dados da encomenda
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Descrição
                  </label>

                  <input
                    minLength="3"
                    placeholder="Ex: Amazon - Caixa média"
                    value={novaEncomenda.descricao}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        descricao: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Código / rastreio
                  </label>

                  <input
                    placeholder="Ex: BR123456789"
                    value={novaEncomenda.codigo}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        codigo: limparCodigo(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Transportadora
                  </label>

                  <input
                    minLength="2"
                    placeholder="Ex: Correios, Amazon, Jadlog..."
                    value={novaEncomenda.transportadora}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        transportadora: e.target.value
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
                    value={novaEncomenda.status}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Recebido</option>
                    <option>Entregue</option>
                    <option>Atrasado</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveButton}
                onClick={salvarEncomenda}
              >
                Salvar encomenda
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
    background:
      "linear-gradient(135deg,#1c1205,var(--ic-primary-dark) 45%,#15803d)",
    borderRadius: "36px",
    padding: "34px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    boxShadow: "0 26px 70px rgba(6,78,59,0.28)",
    marginBottom: "24px"
  },

  heroLeft: {
    width: "100%",
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

  packageBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  packageItem: {
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
    minWidth: 0,
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
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
    width: "160px",
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

  logisticPanel: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(88,28,135,0.09)"
  },

  panelHeader: {
    minWidth: 0,
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

  packageGrid: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  packageCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid var(--ic-primary-border-soft)"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  packageIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  packageIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,#78350f,var(--ic-primary-light))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "900",
    boxShadow: "0 14px 26px rgb(var(--ic-primary-rgb) / 0.18)"
  },

  packageTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px"
  },

  packageCode: {
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

  receiverBox: {
    background: "var(--ic-primary-soft-3)",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "18px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "var(--ic-primary)",
    marginBottom: "14px"
  },

  receiverIcon: {
    fontSize: "22px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  infoItem: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "17px",
    padding: "13px"
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: "8px",
    marginTop: "18px"
  },

  successButton: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  warningButton: {
    background: "#fef3c7",
    color: "#92400e",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editButton: {
    background: "var(--ic-primary-soft-2)",
    color: "var(--ic-primary-strong)",
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
      "linear-gradient(135deg,#1c1205,var(--ic-primary))",
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
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
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
    border: "1px solid var(--ic-primary-border)",
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
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  },

  cancelButton: {
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

export default Encomendas;