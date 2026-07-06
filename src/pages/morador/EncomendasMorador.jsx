import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function EncomendasMorador() {
  const STORAGE_ENCOMENDAS = "encomendas";
  const STORAGE_ESPERADAS = "encomendas_esperadas";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";

  const [morador, setMorador] = useState(null);
  const [encomendas, setEncomendas] = useState(() =>
    lerStorage(STORAGE_ENCOMENDAS)
  );
  const [esperadas, setEsperadas] = useState(() =>
    lerStorage(STORAGE_ESPERADAS)
  );

  const [tipoEntrega, setTipoEntrega] = useState("");
  const [descricaoEntrega, setDescricaoEntrega] = useState("");
  const [transportadora, setTransportadora] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  useEffect(() => {
    carregarSessao();
    carregarEncomendas();
    carregarEsperadas();
  }, []);

  function lerStorage(chave) {
    try {
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : [];
    } catch {
      return [];
    }
  }

  function salvarStorage(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }

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

  function carregarEncomendas() {
    setEncomendas(lerStorage(STORAGE_ENCOMENDAS));
  }

  function carregarEsperadas() {
    setEsperadas(lerStorage(STORAGE_ESPERADAS));
  }

  function pertenceAoApartamento(item) {
    const apartamentoMorador =
      morador?.apartamento ||
      morador?.apto ||
      "";

    const apartamentoIdMorador = morador?.apartamentoId || null;

    return (
      String(item.apartamento || item.apto || "") === String(apartamentoMorador) ||
      (
        apartamentoIdMorador &&
        String(item.apartamentoId || "") === String(apartamentoIdMorador)
      ) ||
      item.moradorId === morador?.id ||
      item.usuario === morador?.usuario ||
      item.morador === morador?.nome ||
      item.nome === morador?.nome
    );
  }

  function registrarAuditoriaEncomenda(acao, registro, antes = null) {
    registrarAuditoria({
      acao,
      modulo: "Encomendas Morador",
      detalhes: `${registro?.tipo || "Encomenda"} • Apto ${registro?.apartamento || "-"}`,
      antes,
      depois: registro,
      referenciaId: registro?.id || null
    });
  }

  function criarNotificacaoEncomendaMorador(registro, titulo, mensagem) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Encomendas",
      origem: "Morador",
      perfilDestino: "sindico",
      moduloOrigem: "EncomendasMorador",
      referenciaId: registro?.id || null,
      prioridade: "normal"
    });
  }

  function limparFormulario() {
    setTipoEntrega("");
    setDescricaoEntrega("");
    setTransportadora("");
  }

  function registrarAvisoSindico(registro) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const novoAviso = {
      id: registro.id,
      categoria: "Encomenda",
      origem: "Morador",
      titulo: `Encomenda esperada - ${registro.tipo}`,
      descricao:
        registro.descricao ||
        `Morador informou que está aguardando uma entrega de ${registro.tipo}.`,
      apartamento: registro.apartamento,
      apartamentoId: registro.apartamentoId || null,
      morador: registro.morador,
      responsavel: registro.morador,
      status: "Novo",
      respostaSindico: "",
      cienciaSindico: false,
      data: registro.data,
      condominioId: registro.condominioId || null,
      nomeCondominio: registro.nomeCondominio || ""
    };

    salvarStorage(STORAGE_AVISOS_SINDICO, [
      novoAviso,
      ...avisos
    ]);
  }

  function registrarMovimentacao(registro) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const novaMovimentacao = {
      id: Date.now() + 1,
      tipo: "Encomenda Esperada",
      origem: "Morador",
      titulo: `Entrega aguardada - ${registro.tipo}`,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      apartamentoId: registro.apartamentoId || null,
      morador: registro.morador,
      moradorId: registro.moradorId || null,
      transportadora: registro.transportadora,
      status: registro.status,
      data: registro.data,
      hora: registro.hora
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [
      novaMovimentacao,
      ...movimentacoes
    ]);
  }

  function registrarRelatorio(registro) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novoRelatorio = {
      id: Date.now() + 2,
      tipo: "Encomenda Esperada",
      origem: "Morador",
      titulo: `Entrega aguardada - ${registro.tipo}`,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      apartamentoId: registro.apartamentoId || null,
      morador: registro.morador,
      moradorId: registro.moradorId || null,
      transportadora: registro.transportadora,
      status: registro.status,
      data: registro.data,
      hora: registro.hora
    };

    salvarStorage(STORAGE_RELATORIOS, [
      novoRelatorio,
      ...relatorios
    ]);
  }

  function registrarEsperada() {
    if (!morador) {
      alert("Sessão do morador não encontrada.");
      return;
    }

    if (!tipoEntrega) {
      alert("Selecione o tipo da entrega");
      return;
    }

    if (descricaoEntrega && descricaoEntrega.trim().length < 3) {
      alert("Informe uma descrição válida ou deixe o campo em branco.");
      return;
    }

    const agora = new Date();
    const todas = lerStorage(STORAGE_ESPERADAS);

    const nova = {
      id: Date.now(),

      moradorId: morador?.id || null,
      morador: morador?.nome || "Morador",
      nome: morador?.nome || "Morador",
      usuario: morador?.usuario || "",

      apartamento: morador?.apartamento || morador?.apto || "",
      apto: morador?.apartamento || morador?.apto || "",
      apartamentoId: morador?.apartamentoId || null,
      bloco: morador?.bloco || "",
      tipoMorador: morador?.tipoMorador || "Morador",
      moradorPrincipal: Boolean(morador?.moradorPrincipal),
      perfilMorador: morador?.perfilMorador || "dependente",
      condominioId: morador?.condominioId || null,
      nomeCondominio: morador?.nomeCondominio || "",

      tipo: tipoEntrega,
      transportadora: transportadora || "Não informada",
      descricao: descricaoEntrega,

      status: "aguardando",
      etapa: "aguardando_portaria",

      data: agora.toLocaleString("pt-BR"),
      dataRegistro: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),

      recebidaPorteiro: false,
      notificadoMorador: false,
      cienciaSindico: false,
      criadoEm: agora.toISOString(),
      atualizadoEm: agora.toISOString(),
      origemModulo: "EncomendasMorador"
    };

    const atualizadas = [
      nova,
      ...todas
    ];

    salvarStorage(STORAGE_ESPERADAS, atualizadas);
    setEsperadas(atualizadas);

    registrarAvisoSindico(nova);
    registrarMovimentacao(nova);
    registrarRelatorio(nova);

    registrarAuditoriaEncomenda("Registrou encomenda esperada", nova);

    criarNotificacaoEncomendaMorador(
      nova,
      "Encomenda esperada informada",
      `${nova.morador} informou uma entrega aguardada para o apto ${nova.apartamento}.`
    );

    limparFormulario();

    alert("Aviso de entrega esperada enviado para a portaria");
  }

  function cancelarEsperada(id) {
    const confirmar = window.confirm(
      "Deseja cancelar este aviso de entrega esperada?"
    );

    if (!confirmar) return;

    const atualizadas = esperadas.filter(
      (item) => item.id !== id
    );

    salvarStorage(STORAGE_ESPERADAS, atualizadas);
    setEsperadas(atualizadas);

    const avisosAtualizados = lerStorage(STORAGE_AVISOS_SINDICO).filter(
      (item) => item.id !== id
    );

    salvarStorage(STORAGE_AVISOS_SINDICO, avisosAtualizados);

    const cancelada = esperadas.find((item) => item.id === id);

    if (cancelada) {
      registrarAuditoriaEncomenda("Cancelou encomenda esperada", cancelada, cancelada);
    }
  }

  const encomendasMorador =
    encomendas.filter((e) => pertenceAoApartamento(e));

  const esperadasMorador =
    esperadas.filter((e) => pertenceAoApartamento(e));

  const encomendasFiltradas =
    encomendasMorador.filter((item) => {
      const texto = busca.toLowerCase();

      const correspondeBusca =
        item.tipo?.toLowerCase().includes(texto) ||
        item.descricao?.toLowerCase().includes(texto) ||
        item.codigo?.toLowerCase().includes(texto) ||
        item.transportadora?.toLowerCase().includes(texto) ||
        item.status?.toLowerCase().includes(texto);

      const statusNormalizado = String(item.status || "").toLowerCase();

      const correspondeStatus =
        filtroStatus === "Todos" ||
        statusNormalizado === String(filtroStatus).toLowerCase();

      return correspondeBusca && correspondeStatus;
    });

  const pendentes =
    encomendasMorador.filter((e) => {
      const status = String(e.status || "").toLowerCase();

      return (
        status === "pendente" ||
        status === "recebido" ||
        status === "aguardando" ||
        status === "aguardando retirada" ||
        status === "atrasado"
      );
    });

  const retiradas =
    encomendasMorador.filter((e) => {
      const status = String(e.status || "").toLowerCase();

      return (
        status === "retirada" ||
        status === "retirado" ||
        status === "entregue"
      );
    });

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📦 Central de encomendas
          </span>

          <h1 style={styles.title}>
            Minhas Encomendas
          </h1>

          <p style={styles.subtitle}>
            Acompanhe encomendas recebidas pela portaria,
            retiradas e entregas que você está aguardando.
          </p>

          {morador && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Morador:{" "}
                <strong>
                  {morador.nome}
                </strong>
              </span>

              <span style={styles.apBadge}>
                Apto {morador.apartamento || morador.apto || "-"}
              </span>

              <span style={styles.apBadge}>
                {morador.moradorPrincipal ? "Principal" : "Dependente"}
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Pendentes
          </p>

          <h3 style={styles.heroNumber}>
            {pendentes.length}
          </h3>

          <span style={styles.heroStatus}>
            aguardando retirada
          </span>
        </div>
      </div>

      <div style={styles.resumeGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Encomendas pendentes
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes.length}
            </h2>

            <span style={styles.cardHintLight}>
              disponíveis na portaria
            </span>
          </div>

          <div style={styles.cardIconLight}>
            📦
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Retiradas
            </p>

            <h2 style={styles.resumeNumberGreen}>
              {retiradas.length}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconBlue}>
            📬
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Entregas aguardadas
            </p>

            <h2 style={styles.resumeNumberBlue}>
              {esperadasMorador.length}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Avisar entrega esperada
              </h2>

              <p style={styles.sectionSubtitle}>
                Informe à portaria que você está aguardando uma entrega.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              Aviso prévio
            </span>
          </div>

          <label style={styles.label}>
            Tipo / loja
          </label>

          <select
            value={tipoEntrega}
            onChange={(e) =>
              setTipoEntrega(e.target.value)
            }
            style={styles.input}
          >
            <option value="">
              Selecione
            </option>

            <option value="Amazon">
              Amazon
            </option>

            <option value="Mercado Livre">
              Mercado Livre
            </option>

            <option value="Shopee">
              Shopee
            </option>

            <option value="iFood">
              iFood
            </option>

            <option value="Documento">
              Documento
            </option>

            <option value="Outro">
              Outro
            </option>
          </select>

          <label style={styles.label}>
            Transportadora
          </label>

          <input
            placeholder="Ex: Correios, Jadlog, Loggi..."
            value={transportadora}
            onChange={(e) =>
              setTransportadora(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Descrição
          </label>

          <textarea
            placeholder="Descrição opcional da entrega..."
            value={descricaoEntrega}
            onChange={(e) =>
              setDescricaoEntrega(e.target.value)
            }
            style={styles.textarea}
          />

          <button
            style={styles.button}
            onClick={registrarEsperada}
          >
            Avisar portaria
          </button>

          <p style={styles.formHint}>
            Quando a portaria confirmar o recebimento,
            a entrega sairá da lista de aguardadas e aparecerá como encomenda pendente.
          </p>
        </div>

        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Encomendas recebidas
              </h2>

              <p style={styles.sectionSubtitle}>
                Encomendas registradas pela portaria para o seu apartamento.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                placeholder="Buscar encomenda..."
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
                <option value="recebido">
                  Pendente
                </option>
                <option value="entregue">
                  Retirada
                </option>
              </select>
            </div>
          </div>

          {encomendasFiltradas.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhuma encomenda encontrada
              </h3>

              <p style={styles.emptyText}>
                Quando a portaria registrar uma encomenda para você,
                ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div style={styles.list}>
              {encomendasFiltradas.map((item) => (
                <div
                  key={item.id}
                  style={styles.card}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.packageIcon}>
                      📦
                    </div>

                    <div style={styles.cardContent}>
                      <div style={styles.badges}>
                        <span
                          style={{
                            ...styles.status,
                            background:
                              item.status === "pendente"
                                ? "#fef3c7"
                                : "#f3e8ff",
                            color:
                              item.status === "pendente"
                                ? "#92400e"
                                : "#7c3aed"
                          }}
                        >
                          {item.status === "pendente"
                            ? "Pendente"
                            : "Retirada"}
                        </span>

                        <span style={styles.dateBadge}>
                          🔖 {item.codigo || "Sem código"}
                        </span>
                      </div>

                      <h2 style={styles.packageTitle}>
                        {item.tipo || "Encomenda"}
                      </h2>

                      <p style={styles.description}>
                        {item.descricao || "Sem descrição"}
                      </p>

                      <div style={styles.infoGrid}>
                        <span>
                          🏢 Apto {item.apartamento}
                        </span>

                        <span>
                          🕒 Recebida: {item.data}
                        </span>

                        {item.transportadora && (
                          <span>
                            🚚 {item.transportadora}
                          </span>
                        )}

                        {item.retiradaEm && (
                          <span>
                            ✅ Retirada: {item.retiradaEm}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {esperadasMorador.length > 0 && (
            <div style={styles.waitingBox}>
              <div style={styles.waitingHeader}>
                <h2 style={styles.sectionTitle}>
                  Entregas aguardadas
                </h2>

                <p style={styles.sectionSubtitle}>
                  Avisos enviados para a portaria.
                </p>
              </div>

              <div style={styles.waitingList}>
                {esperadasMorador.map((item) => (
                  <div
                    key={item.id}
                    style={styles.waitingCard}
                  >
                    <div>
                      <span style={styles.waitingStatus}>
                        Aguardando portaria
                      </span>

                      <h3 style={styles.waitingType}>
                        📬 {item.tipo}
                      </h3>

                      <p style={styles.waitingDescription}>
                        {item.descricao ||
                          "Sem descrição"}
                      </p>

                      <div style={styles.infoGrid}>
                        <span>
                          🚚 {item.transportadora || "Não informada"}
                        </span>

                        <span>
                          🕒 {item.data}
                        </span>
                      </div>
                    </div>

                    <button
                      style={styles.cancelButton}
                      onClick={() =>
                        cancelarEsperada(item.id)
                      }
                    >
                      Cancelar aviso
                    </button>
                  </div>
                ))}
              </div>
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

  resumeNumberBlue: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "390px 1fr",
    gap: "24px",
    alignItems: "flex-start"
  },

  formCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
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

  packageIcon: {
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

  packageTitle: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "22px"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 14px"
  },

  infoGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px"
  },

  waitingBox: {
    marginTop: "30px",
    borderTop: "1px solid #ddd6fe",
    paddingTop: "24px"
  },

  waitingHeader: {
    marginBottom: "16px"
  },

  waitingList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  waitingCard: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start"
  },

  waitingStatus: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "9px"
  },

  waitingType: {
    margin: "0 0 8px",
    color: "#111827"
  },

  waitingDescription: {
    color: "#374151",
    margin: "0 0 12px"
  },

  cancelButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px 14px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800",
    whiteSpace: "nowrap"
  }
};

export default EncomendasMorador;