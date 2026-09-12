import { confirmDialog, promptDialog } from "../../components/GlobalDialogs.jsx";
import {
  useEffect,
  useState,
} from "react";

import noticeApi from "../../Services/noticeApi.js";
import occurrenceApi from "../../Services/occurrenceApi.js";
import apartmentApi from "../../Services/apartmentApi.js";

function Avisos() {
  const estadoInicialAviso = {
    titulo: "",
    descricao: "",
    prioridade: "Média",
    publico: "Todos",
    apartamentoId: "",
    statusPublicacao: "Publicado",
    data:
      new Date()
        .toLocaleDateString(
          "pt-BR"
        ),
  };

  const [avisos, setAvisos] =
    useState([]);

  const [apartamentos, setApartamentos] =
    useState([]);

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [
    filtroPrioridade,
    setFiltroPrioridade,
  ] = useState("Todas");

  const [
    filtroCategoria,
    setFiltroCategoria,
  ] = useState("Todas");

  const [novoAviso, setNovoAviso] =
    useState(
      estadoInicialAviso
    );

  const [editId, setEditId] =
    useState(null);

  const [
    respostaTexto,
    setRespostaTexto,
  ] = useState("");

  const priorityFront = {
    URGENT: "Urgente",
    HIGH: "Alta",
    NORMAL: "Média",
    LOW: "Baixa",
  };

  const priorityBack = {
    Urgente: "URGENT",
    Alta: "HIGH",
    Média: "NORMAL",
    Baixa: "LOW",
  };

  const audienceFront = {
    ALL: "Todos",
    RESIDENTS: "Moradores",
    DOORMEN: "Porteiros",
    MANAGERS: "Gestão",
    APARTMENT: "Apartamento",
  };

  const audienceBack = {
    Todos: "ALL",
    Moradores: "RESIDENTS",
    Porteiros: "DOORMEN",
    Gestão: "MANAGERS",
    Apartamento: "APARTMENT",
  };

  const occurrenceTypeFront = {
    COMPLAINT: "Reclamação",
    SUGGESTION: "Sugestão",
    REQUEST: "Solicitação",
    SECURITY: "Ocorrência",
    MAINTENANCE: "Ocorrência",
    NOISE: "Ocorrência",
    OTHER: "Ocorrência",
  };

  const occurrenceStatusFront = {
    NEW: "Novo",
    IN_REVIEW: "Em Tratamento",
    IN_PROGRESS: "Em Tratamento",
    RESOLVED: "Resolvido",
    CLOSED: "Resolvido",
    CANCELED: "Cancelado",
  };

  function mapNotice(item) {
    return {
      ...item,
      categoria: "Aviso",
      origem: "Síndico",
      titulo:
        item.title ?? "",
      descricao:
        item.message ?? "",
      prioridade:
        priorityFront[
          item.priority
        ] ??
        "Média",
      status:
        item.status ===
          "DRAFT"
          ? "Rascunho"
          : item.status ===
              "ARCHIVED"
            ? "Arquivado"
            : "Publicado",
      publico:
        audienceFront[
          item.audience
        ] ??
        "Todos",
      apartamentoId:
        item.apartmentId ??
        "",
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
    };
  }

  function mapOccurrence(item) {
    return {
      ...item,
      categoria:
        occurrenceTypeFront[
          item.type
        ] ??
        "Ocorrência",
      origem:
        item.createdBy?.role ===
          "RESIDENT"
          ? "Morador"
          : item.createdBy?.role ===
              "DOORMAN"
            ? "Porteiro"
            : "Sistema",
      titulo:
        item.title ??
        "Ocorrência",
      descricao:
        item.description ??
        "",
      prioridade:
        priorityFront[
          item.priority
        ] ??
        "Média",
      status:
        occurrenceStatusFront[
          item.status
        ] ??
        item.status,
      data:
        item.createdAt
          ? new Date(
              item.createdAt
            ).toLocaleString(
              "pt-BR"
            )
          : "",
      respostaSindico:
        item.resolution ??
        "",
    };
  }

  async function carregarCentral() {
    try {
      const [
        noticeData,
        occurrenceData,
        apartmentData,
      ] = await Promise.all([
        noticeApi.list(),
        occurrenceApi.list(),
        apartmentApi.list(),
      ]);

      setApartamentos(
        apartmentData ?? []
      );

      setAvisos(
        [
          ...(noticeData ?? [])
            .map(mapNotice),
          ...(occurrenceData ?? [])
            .map(
              mapOccurrence
            ),
        ].sort(
          (a, b) =>
            new Date(
              b.createdAt ??
              b.publishedAt ??
              0
            ) -
            new Date(
              a.createdAt ??
              a.publishedAt ??
              0
            )
        )
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar a central de avisos."
      );
    }
  }

  useEffect(() => {
    carregarCentral();
  }, []);

  const avisosFiltrados =
    avisos.filter(
      (a) => {
        const texto =
          busca
            .trim()
            .toLowerCase();

        const correspondeBusca =
          !texto ||
          a.titulo
            ?.toLowerCase()
            .includes(texto) ||
          a.descricao
            ?.toLowerCase()
            .includes(texto) ||
          a.prioridade
            ?.toLowerCase()
            .includes(texto) ||
          a.status
            ?.toLowerCase()
            .includes(texto) ||
          a.categoria
            ?.toLowerCase()
            .includes(texto) ||
          a.origem
            ?.toLowerCase()
            .includes(texto) ||
          a.data
            ?.toLowerCase()
            .includes(texto);

        const correspondePrioridade =
          filtroPrioridade ===
            "Todas" ||
          a.prioridade ===
            filtroPrioridade;

        const correspondeCategoria =
          filtroCategoria ===
            "Todas" ||
          a.categoria ===
            filtroCategoria;

        return (
          correspondeBusca &&
          correspondePrioridade &&
          correspondeCategoria
        );
      }
    );

  const alta =
    avisos.filter(
      (a) =>
        [
          "Alta",
          "Urgente",
        ].includes(
          a.prioridade
        )
    ).length;

  const media =
    avisos.filter(
      (a) =>
        a.prioridade ===
        "Média"
    ).length;

  const baixa =
    avisos.filter(
      (a) =>
        a.prioridade ===
        "Baixa"
    ).length;

  async function salvarAviso() {
    if (
      !novoAviso.titulo.trim() ||
      !novoAviso.descricao.trim()
    ) {
      alert(
        "Preencha título e descrição."
      );
      return;
    }

    const audience =
      audienceBack[
        novoAviso.publico
      ] ??
      "ALL";

    if (
      audience ===
        "APARTMENT" &&
      !novoAviso.apartamentoId
    ) {
      alert(
        "Selecione o apartamento destinatário."
      );
      return;
    }

    const payload = {
      title:
        novoAviso.titulo.trim(),
      message:
        novoAviso.descricao.trim(),
      category:
        "Aviso",
      priority:
        priorityBack[
          novoAviso.prioridade
        ] ??
        "NORMAL",
      audience,
      apartmentId:
        audience ===
        "APARTMENT"
          ? novoAviso.apartamentoId
          : null,
      status:
        novoAviso
          .statusPublicacao ===
          "Rascunho"
          ? "DRAFT"
          : "PUBLISHED",
      expiresAt: null,
    };

    try {
      if (editId) {
        await noticeApi.update(
          editId,
          payload
        );
      } else {
        await noticeApi.create(
          payload
        );
      }

      fecharModal();
      await carregarCentral();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível salvar o aviso."
      );
    }
  }

  function editarAviso(aviso) {
    if (
      aviso.categoria !==
      "Aviso"
    ) {
      return;
    }

    setEditId(
      aviso.id
    );

    setNovoAviso({
      ...estadoInicialAviso,
      titulo:
        aviso.titulo,
      descricao:
        aviso.descricao,
      prioridade:
        aviso.prioridade,
      publico:
        aviso.publico ??
        "Todos",
      apartamentoId:
        aviso.apartamentoId ??
        "",
      statusPublicacao:
        aviso.status ===
          "Rascunho"
          ? "Rascunho"
          : "Publicado",
    });

    setMostrarModal(
      true
    );
  }

  async function excluirAviso(id) {
    if (
      !await confirmDialog(
        "Deseja excluir este aviso?"
      )
    ) {
      return;
    }

    try {
      await noticeApi.remove(id);
      await carregarCentral();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível excluir o aviso."
      );
    }
  }

  async function atualizarStatus(
    item,
    novoStatus
  ) {
    if (
      item.categoria ===
      "Aviso"
    ) {
      return;
    }

    try {
      if (
        novoStatus ===
        "Ciente"
      ) {
        await occurrenceApi
          .markReadManager?.(
            item.id
          );
      } else if (
        novoStatus ===
        "Em Tratamento"
      ) {
        await occurrenceApi
          .markInReview(
            item.id
          );
      } else if (
        novoStatus ===
        "Resolvido"
      ) {
        const resolution =
          respostaTexto.trim() ||
          await promptDialog(
            "Informe a resolução:"
          );

        if (
          !resolution ||
          resolution.trim().length <
            2
        ) {
          return;
        }

        await occurrenceApi
          .resolve(
            item.id,
            resolution.trim()
          );

        setRespostaTexto("");
      }

      await carregarCentral();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível atualizar a ocorrência."
      );
    }
  }

  async function responderItem(
    item
  ) {
    if (
      !respostaTexto.trim()
    ) {
      alert(
        "Digite a resposta ou resolução."
      );
      return;
    }

    try {
      await occurrenceApi
        .resolve(
          item.id,
          respostaTexto.trim()
        );

      setRespostaTexto("");
      await carregarCentral();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível responder a solicitação."
      );
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoAviso(
      estadoInicialAviso
    );
  }

  function corPrioridade(prioridade) {
    switch (prioridade) {
      case "Urgente":
        return {
          label: "Urgente",
          background: "#fee2e2",
          color: "#991b1b",
          border: "#ef4444"
        };

      case "Alta":
        return {
          label: "Alta",
          background: "#ffedd5",
          color: "#9a3412",
          border: "#fb923c"
        };

      case "Baixa":
        return {
          label: "Baixa",
          background: "#dcfce7",
          color: "#166534",
          border: "#86efac"
        };

      default:
        return {
          label: "Média",
          background: "#fef3c7",
          color: "#92400e",
          border: "#fde68a"
        };
    }
  }

  function iconeCategoria(categoria) {
    switch (categoria) {
      case "Aviso":
        return "📢";
      case "Reclamação":
        return "⚠️";
      case "Sugestão":
        return "💡";
      case "Solicitação":
        return "📝";
      default:
        return "📋";
    }
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📢 Central de comunicação
          </span>

          <h1 style={styles.title}>Avisos</h1>

          <p style={styles.subtitle}>
            Publique comunicados e acompanhe ocorrências,
            sugestões e reclamações em uma única central.
            Encomendas, visitantes e demais eventos aparecem
            na Central de Notificações.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.noticeBoard}>
            <div style={styles.noticeItem}>
              <span>🚨</span>
              <strong>{alta}</strong>
              <small>alta</small>
            </div>

            <div style={styles.noticeItem}>
              <span>⚠️</span>
              <strong>{media}</strong>
              <small>média</small>
            </div>

            <div style={styles.noticeItem}>
              <span>✅</span>
              <strong>{baixa}</strong>
              <small>baixa</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovoAviso(
                estadoInicialAviso
              );
              setMostrarModal(true);
            }}
          >
            + Novo aviso
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por título, descrição, data, status, categoria ou prioridade..."
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            style={styles.search}
          />
        </div>

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
          <option>Alta</option>
          <option>Média</option>
          <option>Baixa</option>
          <option>Urgente</option>
        </select>

        <select
          value={filtroCategoria}
          onChange={(e) =>
            setFiltroCategoria(
              e.target.value
            )
          }
          style={styles.filter}
        >
          <option>Todas</option>
          <option>Aviso</option>
          <option>Ocorrência</option>
          <option>Reclamação</option>
          <option>Sugestão</option>
          <option>Solicitação</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{avisos.length}</b> registros
          </span>

          <span>
            <b>{avisosFiltrados.length}</b> resultado(s)
          </span>
        </div>
      </section>

      <section style={styles.communicationPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>Central operacional</span>

            <h2 style={styles.panelTitle}>Comunicações recebidas</h2>
          </div>

          <span style={styles.resultBadge}>
            {avisosFiltrados.length} resultado(s)
          </span>
        </div>

        {avisosFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📢</div>

            <h3 style={styles.emptyTitle}>Nenhum registro encontrado</h3>

            <p style={styles.emptyText}>
              Avisos, ocorrências, reclamações e sugestões aparecerão aqui.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovoAviso(estadoInicialAviso);
                setMostrarModal(true);
              }}
            >
              Publicar aviso
            </button>
          </div>
        ) : (
          <div style={styles.noticeGrid}>
            {avisosFiltrados.map((aviso) => {
              const prioridade = corPrioridade(aviso.prioridade);

              return (
                <article
                  key={`${aviso.categoria}-${aviso.id}`}
                  style={{
                    ...styles.noticeCard,
                    borderColor: prioridade.border
                  }}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.noticeIcon}>
                      {iconeCategoria(aviso.categoria)}
                    </div>

                    <span
                      style={{
                        ...styles.priorityBadge,
                        background: prioridade.background,
                        color: prioridade.color
                      }}
                    >
                      {prioridade.label}
                    </span>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.categoryBadge}>{aviso.categoria}</span>
                    <span style={styles.originBadge}>{aviso.origem}</span>
                    <span style={styles.statusBadge}>{aviso.status}</span>
                  </div>

                  <h3 style={styles.noticeTitle}>{aviso.titulo}</h3>

                  <p style={styles.description}>{aviso.descricao}</p>

                  <div style={styles.meta}>
                    <span>Registrado em</span>
                    <strong>{aviso.data}</strong>
                  </div>

                  {(aviso.categoria === "Sugestão" ||
                    aviso.categoria === "Reclamação" ||
                    aviso.categoria === "Solicitação" ||
                    aviso.categoria === "Ocorrência") && (
                    <div style={styles.responseArea}>
                      <textarea
                        placeholder="Resposta ou resolução da administração..."
                        value={respostaTexto}
                        onChange={(e) => setRespostaTexto(e.target.value)}
                        style={styles.responseInput}
                      />

                      <button
                        style={styles.editButton}
                        onClick={() => responderItem(aviso)}
                      >
                        Responder
                      </button>
                    </div>
                  )}

                  <div style={styles.actions}>
                    {aviso.categoria === "Aviso" ? (
                      <>
                        <button
                          style={styles.editButton}
                          onClick={() => editarAviso(aviso)}
                        >
                          Editar
                        </button>

                        <button
                          style={styles.deleteButton}
                          onClick={() => excluirAviso(aviso.id)}
                        >
                          Excluir
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          style={styles.editButton}
                          onClick={() => atualizarStatus(aviso, "Ciente")}
                        >
                          Ciente
                        </button>

                        <button
                          style={styles.editButton}
                          onClick={() =>
                            atualizarStatus(aviso, "Em Tratamento")
                          }
                        >
                          Em tratamento
                        </button>

                        <button
                          style={styles.editButton}
                          onClick={() => atualizarStatus(aviso, "Resolvido")}
                        >
                          Resolver
                        </button>
                      </>
                    )}
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
                  {editId !== null ? "Editar comunicado" : "Novo comunicado"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null ? "Editar aviso" : "Publicar aviso"}
                </h2>
              </div>

              <button style={styles.closeButton} onClick={fecharModal}>
                ✕
              </button>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>Conteúdo do aviso</h3>

              <div style={styles.formGrid}>
                <div style={styles.groupFull}>
                  <label style={styles.label}>Título</label>

                  <input
                    placeholder="Ex: Manutenção no elevador"
                    value={novoAviso.titulo}
                    onChange={(e) =>
                      setNovoAviso({
                        ...novoAviso,
                        titulo: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.groupFull}>
                  <label style={styles.label}>Descrição</label>

                  <textarea
                    placeholder="Digite a mensagem do comunicado..."
                    value={novoAviso.descricao}
                    onChange={(e) =>
                      setNovoAviso({
                        ...novoAviso,
                        descricao: e.target.value
                      })
                    }
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.groupFull}>
                  <label style={styles.label}>Prioridade</label>

                  <select
                    value={novoAviso.prioridade}
                    onChange={(e) =>
                      setNovoAviso({
                        ...novoAviso,
                        prioridade: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Urgente</option>
                    <option>Alta</option>
                    <option>Média</option>
                    <option>Baixa</option>
                  </select>
                </div>

                <div style={styles.groupFull}>
                  <label style={styles.label}>Público</label>

                  <select
                    value={novoAviso.publico}
                    onChange={(e) =>
                      setNovoAviso({
                        ...novoAviso,
                        publico: e.target.value,
                        apartamentoId:
                          e.target.value === "Apartamento"
                            ? novoAviso.apartamentoId
                            : ""
                      })
                    }
                    style={styles.input}
                  >
                    <option>Todos</option>
                    <option>Moradores</option>
                    <option>Porteiros</option>
                    <option>Gestão</option>
                    <option>Apartamento</option>
                  </select>
                </div>

                {novoAviso.publico === "Apartamento" && (
                  <div style={styles.groupFull}>
                    <label style={styles.label}>Apartamento</label>

                    <select
                      value={novoAviso.apartamentoId}
                      onChange={(e) =>
                        setNovoAviso({
                          ...novoAviso,
                          apartamentoId: e.target.value
                        })
                      }
                      style={styles.input}
                    >
                      <option value="">
                        Selecione
                      </option>

                      {apartamentos.map((ap) => (
                        <option
                          key={ap.id}
                          value={ap.id}
                        >
                          {ap.block
                            ? `${ap.block} - `
                            : ""}
                          {ap.number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={styles.groupFull}>
                  <label style={styles.label}>Publicação</label>

                  <select
                    value={novoAviso.statusPublicacao}
                    onChange={(e) =>
                      setNovoAviso({
                        ...novoAviso,
                        statusPublicacao: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Publicado</option>
                    <option>Rascunho</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button style={styles.saveButton} onClick={salvarAviso}>
                Salvar aviso
              </button>

              <button style={styles.cancelButton} onClick={fecharModal}>
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
    fontFamily: "Arial",
    color: "#111827",
    position: "relative",
    boxSizing: "border-box"
  },

  hero: {
    minWidth: 0,
    flexWrap: "wrap",
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.18),transparent 28%), radial-gradient(circle at bottom left,rgb(var(--ic-primary-bright-rgb) / 0.26),transparent 34%), linear-gradient(135deg,var(--ic-primary-deepest),var(--ic-primary-deep),var(--ic-primary))",
    borderRadius: "42px",
    padding: "40px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "34px",
    marginBottom: "26px",
    boxShadow:
      "0 30px 80px rgba(88,28,135,0.26), 0 0 46px rgb(var(--ic-primary-bright-rgb) / 0.16)",
    border: "1px solid rgba(255,255,255,0.18)",
    overflow: "hidden",
    position: "relative"
  },

  heroLeft: {
    flex: 1,
    position: "relative",
    zIndex: 2
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "10px 15px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
    display: "inline-block",
    marginBottom: "16px",
    boxShadow: "0 10px 28px rgba(0,0,0,0.10)"
  },

  title: {
    margin: 0,
    fontSize: "46px",
    letterSpacing: "-1px",
    fontWeight: "900"
  },

  subtitle: {
    margin: "13px 0 0",
    color: "rgba(255,255,255,0.80)",
    maxWidth: "780px",
    lineHeight: "1.6",
    fontSize: "15px"
  },

  heroRight: {
    minWidth: "330px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
    zIndex: 2
  },

  noticeBoard: {
    background:
      "linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "30px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "12px",
    backdropFilter: "blur(16px)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)"
  },

  noticeItem: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "22px",
    padding: "14px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  heroButton: {
    background: "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-light),var(--ic-primary-bright))",
    color: "white",
    border: "1px solid rgba(255,255,255,0.22)",
    padding: "16px 22px",
    borderRadius: "18px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow:
      "0 18px 34px rgb(var(--ic-primary-rgb) / 0.28), 0 0 28px rgb(var(--ic-primary-bright-rgb) / 0.18)"
  },

  controlStrip: {
    minWidth: 0,
    flexWrap: "wrap",
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "30px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "26px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)"
  },

  searchWrap: {
    flex: "1 1 320px",
    minWidth: "220px",
    position: "relative"
  },

  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--ic-primary)",
    fontWeight: "900"
  },

  search: {
    width: "100%",
    padding: "15px 16px 15px 44px",
    borderRadius: "17px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    background: "#fbfaff",
    color: "#111827",
    fontSize: "14px",
    boxSizing: "border-box"
  },

  filter: {
    width: "170px",
    padding: "15px 16px",
    borderRadius: "17px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    background: "#fbfaff",
    color: "#111827",
    fontSize: "14px"
  },

  compactStats: {
    background: "var(--ic-primary-soft)",
    border: "1px solid var(--ic-primary-border-soft)",
    color: "var(--ic-primary-strong)",
    padding: "12px 14px",
    borderRadius: "18px",
    display: "flex",
    gap: "14px",
    fontSize: "13px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  communicationPanel: {
    minWidth: 0,
    overflow: "hidden",
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "36px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(88,28,135,0.10)"
  },

  panelHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "24px"
  },

  panelLabel: {
    display: "inline-block",
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary-strong)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "10px"
  },

  panelTitle: {
    margin: 0,
    color: "var(--ic-primary-deepest)",
    fontSize: "27px",
    letterSpacing: "-0.4px"
  },

  resultBadge: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary-strong)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed var(--ic-primary-border)",
    borderRadius: "28px",
    padding: "46px",
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
    background: "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-bright))",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 16px 32px rgb(var(--ic-primary-rgb) / 0.22)"
  },

  noticeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))",
    gap: "18px"
  },

  avisosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))",
    gap: "18px"
  },

  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))",
    gap: "18px"
  },

  timeline: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))",
    gap: "18px"
  },

  noticeCard: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.11),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 18px 42px rgba(88,28,135,0.10)",
    position: "relative",
    overflow: "hidden"
  },

  card: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.11),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 18px 42px rgba(88,28,135,0.10)",
    position: "relative",
    overflow: "hidden"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "14px"
  },

  noticeIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,var(--ic-primary-soft),var(--ic-primary-soft-3))",
    border: "1px solid var(--ic-primary-border-soft)",
    color: "var(--ic-primary-strong)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0
  },

  categoryIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,var(--ic-primary-soft),var(--ic-primary-soft-3))",
    border: "1px solid var(--ic-primary-border-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px"
  },

  priorityBadge: {
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    border: "1px solid transparent"
  },

  categoryBadge: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary-strong)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  originBadge: {
    background: "var(--ic-primary-soft-2)",
    color: "var(--ic-primary-deep)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  statusBadge: {
    background: "var(--ic-primary-soft-4)",
    color: "var(--ic-primary-strong)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  dateBadge: {
    background: "#fbfaff",
    color: "#6b7280",
    border: "1px solid var(--ic-primary-soft-2)",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cardTitle: {
    margin: "8px 0",
    color: "#111827",
    fontSize: "21px",
    lineHeight: "1.25"
  },

  noticeTitle: {
    margin: "8px 0",
    color: "#111827",
    fontSize: "21px",
    lineHeight: "1.25"
  },

  description: {
    color: "#6b7280",
    lineHeight: "1.6",
    margin: "0 0 14px",
    fontSize: "14px"
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "12px"
  },

  responseArea: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "14px",
    minWidth: 0
  },

  responseBox: {
    background: "var(--ic-primary-soft)",
    border: "1px solid var(--ic-primary-border-soft)",
    color: "var(--ic-primary-deep)",
    borderRadius: "18px",
    padding: "14px",
    marginTop: "14px",
    fontSize: "14px"
  },

  responseInput: {
    width: "100%",
    minHeight: "90px",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    background: "#fbfaff",
    resize: "vertical",
    boxSizing: "border-box",
    marginTop: "12px",
    fontFamily: "Arial"
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px"
  },

  buttonSmall: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary-strong)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "10px 12px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editButton: {
    background: "var(--ic-primary-soft-2)",
    color: "var(--ic-primary-strong)",
    border: "none",
    padding: "11px 13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px 13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  saveResponseButton: {
    background: "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-bright))",
    color: "white",
    border: "none",
    padding: "11px 13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 14px 28px rgb(var(--ic-primary-rgb) / 0.22)"
  },

  modalBackground: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px",
    boxSizing: "border-box"
  },

  modal: {
    width: "620px",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), #fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 34px 90px rgba(88,28,135,0.30)",
    border: "1px solid rgba(255,255,255,0.55)"
  },

  modalTop: {
    minWidth: 0,
    flexWrap: "wrap",
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.16),transparent 34%), linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary))",
    color: "white",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
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
    margin: "14px 0 6px",
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

  modalSectionTitle: {
    margin: "0 0 16px",
    color: "var(--ic-primary-deep)",
    fontSize: "18px",
    fontWeight: "900"
  },

  modalSection: {
    background: "white",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "26px",
    padding: "20px"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px"
  },

  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  groupFull: {
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
    width: "100%",
    minWidth: 0,
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    color: "#111827",
    boxSizing: "border-box"
  },

  textarea: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    minHeight: "120px",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    color: "#111827",
    resize: "vertical",
    fontFamily: "Arial",
    boxSizing: "border-box"
  },

  modalButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
    flex: 1,
    background: "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-light),var(--ic-primary-bright))",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow:
      "0 18px 34px rgb(var(--ic-primary-rgb) / 0.28), 0 0 28px rgb(var(--ic-primary-bright-rgb) / 0.18)"
  },

  cancelButton: {
    flex: 1,
    background: "var(--ic-primary-soft-4)",
    color: "var(--ic-primary-deep)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Avisos;