import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

import ApartmentGrid from "../../components/Porteiro/ApartmentGrid";

function EncomendasPorteiro() {
  const STORAGE_ENCOMENDAS = "encomendas";
  const STORAGE_ESPERADAS = "encomendas_esperadas";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";
  const STORAGE_NOTIFICACOES = "notificacoesMorador";
  const STORAGE_HISTORICO = "encomendas_historico";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";

  const [esperadas, setEsperadas] = useState([]);
  const [encomendas, setEncomendas] = useState([]);
  const [porteiro, setPorteiro] = useState(null);

  useEffect(() => {
    carregarSessao();
    carregarEsperadas();
    carregarEncomendas();

    const sincronizar = () => {
      carregarEsperadas();
      carregarEncomendas();
    };

    window.addEventListener("storage", sincronizar);
    window.addEventListener(
      "infinitycondo:encomendas",
      sincronizar
    );

    return () => {
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener(
        "infinitycondo:encomendas",
        sincronizar
      );
    };
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

    if (
      chave === "encomendas" ||
      chave === "encomendas_esperadas" ||
      chave === "encomendas_historico"
    ) {
      window.dispatchEvent(
        new CustomEvent("infinitycondo:encomendas", {
          detail: { chave }
        })
      );
    }
  }

  function gerarIdUnico() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizarCodigo(valor) {
    const limpo = String(valor || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toUpperCase();

    return limpo;
  }

  function obterCodigoRastreio(item = {}) {
    const valor =
      item.codigoRastreio ||
      item.rastreio ||
      item.codigo ||
      "";

    if (
      String(valor).toLowerCase() === "não informado" ||
      String(valor).toLowerCase() === "nao informado"
    ) {
      return "";
    }

    return normalizarCodigo(valor);
  }

  function normalizarStatus(status) {
    const valor = String(status || "")
      .trim()
      .toLowerCase();

    if (
      valor === "entregue" ||
      valor === "retirada" ||
      valor === "retirado"
    ) {
      return "Entregue";
    }

    if (valor === "atrasado") {
      return "Atrasado";
    }

    if (
      valor === "aguardando" ||
      valor === "esperada" ||
      valor === "esperado"
    ) {
      return "Aguardando";
    }

    return "Recebido";
  }

  function carregarSessao() {
    const sessao =
      localStorage.getItem("sessaoPorteiro") ||
      sessionStorage.getItem("sessaoPorteiro");

    try {
      const usuario = sessao ? JSON.parse(sessao) : null;
      setPorteiro(usuario);
    } catch {
      setPorteiro(null);
    }
  }

  function carregarEsperadas() {
    setEsperadas(lerStorage(STORAGE_ESPERADAS));
  }

  function carregarEncomendas() {
    const lista = lerStorage(STORAGE_ENCOMENDAS);

    setEncomendas(
      lista.map((item) => ({
        ...item,
        codigoRastreio: obterCodigoRastreio(item),
        rastreio: obterCodigoRastreio(item),
        codigo: obterCodigoRastreio(item),
        status: normalizarStatus(item.status)
      }))
    );
  }

  function registrarAuditoriaEncomenda(acao, encomenda, antes = null) {
    registrarAuditoria({
      acao,
      modulo: "Encomendas Porteiro",
      detalhes: `${encomenda?.tipo || "Encomenda"} • Apto ${encomenda?.apartamento || "-"}`,
      antes,
      depois: encomenda,
      referenciaId: encomenda?.id || null
    });
  }

  function criarNotificacaoSindico(encomenda, titulo, mensagem, prioridade = "normal") {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Encomendas",
      origem: "Porteiro",
      perfilDestino: "sindico",
      moduloOrigem: "EncomendasPorteiro",
      referenciaId: encomenda?.id || null,
      prioridade
    });
  }

  function atualizarTela() {
    carregarEncomendas();
    carregarEsperadas();
  }

  const pendentes = encomendas.filter((e) => {
    const status = String(e.status || "").toLowerCase();

    return (
      status === "pendente" ||
      status === "recebido" ||
      status === "aguardando" ||
      status === "aguardando retirada" ||
      status === "atrasado"
    );
  });

  const retiradas = encomendas.filter((e) => {
    const status = String(e.status || "").toLowerCase();

    return (
      status === "retirada" ||
      status === "retirado" ||
      status === "entregue"
    );
  });

  const recebidasHoje = encomendas.filter((e) => {
    if (!e.dataRecebimento && !e.data) return false;

    const hoje = new Date().toLocaleDateString("pt-BR");

    return (
      e.dataRecebimento === hoje ||
      e.data?.includes(hoje)
    );
  });

  const retiradasHoje = encomendas.filter((e) => {
    if (!e.retiradaEm) return false;

    const hoje = new Date().toLocaleDateString("pt-BR");

    return e.retiradaEm.includes(hoje);
  });

  function registrarAvisoSindico(encomenda) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const novoAviso = {
      id: encomenda.id,
      categoria: "Encomenda",
      origem: "Porteiro",
      titulo: `Encomenda recebida - Apto ${encomenda.apartamento}`,
      descricao: encomenda.descricao,
      apartamento: encomenda.apartamento,
      apartamentoId: encomenda.apartamentoId || null,
      morador: encomenda.morador,
      responsavel: encomenda.porteiroRecebimento,
      status: "Novo",
      respostaSindico: "",
      cienciaSindico: false,
      data: encomenda.dataRecebimento
    };

    salvarStorage(STORAGE_AVISOS_SINDICO, [
      novoAviso,
      ...avisos
    ]);
  }

  function notificarMorador(encomenda) {
    const notificacoes = lerStorage(STORAGE_NOTIFICACOES);

    const novaNotificacao = {
      id: gerarIdUnico(),
      tipo: "Encomenda",
      titulo: "Encomenda recebida na portaria",
      descricao: `Sua encomenda ${encomenda.tipo || ""} foi recebida e está aguardando retirada na portaria.`,
      morador: encomenda.morador,
      moradorId: encomenda.moradorId || null,
      apartamento: encomenda.apartamento,
      apartamentoId: encomenda.apartamentoId || null,
      lida: false,
      data: encomenda.dataRecebimento,
      hora: encomenda.horaRecebimento
    };

    salvarStorage(STORAGE_NOTIFICACOES, [
      novaNotificacao,
      ...notificacoes
    ]);
  }

  function registrarHistorico(encomenda, origemEsperada) {
    const historico = lerStorage(STORAGE_HISTORICO);

    const novoHistorico = {
      id: gerarIdUnico(),
      encomendaId: encomenda.id,
      encomendaEsperadaId: origemEsperada?.id || null,
      acao: "recebimento_confirmado",
      origem: "Porteiro",
      morador: encomenda.morador,
      moradorId: encomenda.moradorId || null,
      apartamento: encomenda.apartamento,
      apartamentoId: encomenda.apartamentoId || null,
      descricao: encomenda.descricao,
      tipo: encomenda.tipo,
      codigo: obterCodigoRastreio(encomenda),
      codigoRastreio: obterCodigoRastreio(encomenda),
      rastreio: obterCodigoRastreio(encomenda),
      codigoInterno: encomenda.codigoInterno || "",
      transportadora: encomenda.transportadora,
      status: encomenda.status,
      porteiro: encomenda.porteiroRecebimento,
      data: encomenda.dataRecebimento,
      hora: encomenda.horaRecebimento
    };

    salvarStorage(STORAGE_HISTORICO, [
      novoHistorico,
      ...historico
    ]);
  }

  function registrarMovimentacao(encomenda) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const novaMovimentacao = {
      id: gerarIdUnico(),
      tipo: "Encomenda",
      acao: "recebimento_confirmado",
      origem: "Porteiro",
      titulo: `Encomenda recebida - Apto ${encomenda.apartamento}`,
      apartamento: encomenda.apartamento,
      morador: encomenda.morador,
      moradorId: encomenda.moradorId || null,
      descricao: encomenda.descricao,
      porteiro: encomenda.porteiroRecebimento,
      data: encomenda.dataRecebimento,
      hora: encomenda.horaRecebimento,
      timestamp: Date.now()
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [
      novaMovimentacao,
      ...movimentacoes
    ]);
  }

  function registrarRelatorio(encomenda) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novoRelatorio = {
      id: gerarIdUnico(),
      tipo: "Encomenda",
      acao: "recebimento_confirmado",
      origem: "Porteiro",
      titulo: `Encomenda recebida - Apto ${encomenda.apartamento}`,
      apartamento: encomenda.apartamento,
      morador: encomenda.morador,
      moradorId: encomenda.moradorId || null,
      descricao: encomenda.descricao,
      codigo: obterCodigoRastreio(encomenda),
      codigoRastreio: obterCodigoRastreio(encomenda),
      rastreio: obterCodigoRastreio(encomenda),
      codigoInterno: encomenda.codigoInterno || "",
      transportadora: encomenda.transportadora,
      status: encomenda.status,
      porteiro: encomenda.porteiroRecebimento,
      data: encomenda.dataRecebimento,
      hora: encomenda.horaRecebimento
    };

    salvarStorage(STORAGE_RELATORIOS, [
      novoRelatorio,
      ...relatorios
    ]);
  }

  function confirmarRecebimento(item) {
    const todasEncomendas = lerStorage(STORAGE_ENCOMENDAS);
    const agora = new Date();

    const codigoInterno = `ENC-${String(
      todasEncomendas.length + 1
    ).padStart(6, "0")}`;

    const codigoRastreio = obterCodigoRastreio(item);

    const novaEncomenda = {
      id: gerarIdUnico(),

      encomendaEsperadaId: item.id || null,

      moradorId: item.moradorId || null,

      codigoInterno,
      codigoRastreio,
      rastreio: codigoRastreio,
      codigo: codigoRastreio,

      apartamento: item.apartamento || "N/A",
      apto: item.apartamento || "N/A",
      apartamentoId: item.apartamentoId || null,

      nome: item.nome || item.morador || "Morador",

      morador: item.morador || item.nome || "Morador",

      usuario: item.usuario || "",

      bloco: item.bloco || "",

      descricao: item.descricao || item.tipo,

      tipo: item.tipo || "Encomenda",

      transportadora: item.transportadora || "Não informada",

      status: "Recebido",

      data: agora.toLocaleString("pt-BR"),

      dataRecebimento: agora.toLocaleDateString("pt-BR"),

      horaRecebimento: agora.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),

      porteiroRecebimento: porteiro?.nome || "Porteiro",

      porteiroUsuario: porteiro?.usuario || "",

      notificadoMorador: true,

      cienciaSindico: false,
      condominioId: item.condominioId || null,
      nomeCondominio: item.nomeCondominio || "",
      criadoEm: agora.toISOString(),
      atualizadoEm: agora.toISOString(),
      origemModulo: "EncomendasPorteiro"
    };

    const atualizadas = [
      novaEncomenda,
      ...todasEncomendas
    ];

    salvarStorage(STORAGE_ENCOMENDAS, atualizadas);

    const novasEsperadas = esperadas.filter(
      (e) => e.id !== item.id
    );

    salvarStorage(STORAGE_ESPERADAS, novasEsperadas);

    registrarAvisoSindico(novaEncomenda);
    notificarMorador(novaEncomenda);
    registrarHistorico(novaEncomenda, item);
    registrarMovimentacao(novaEncomenda);
    registrarRelatorio(novaEncomenda);
    registrarAuditoriaEncomenda("Confirmou recebimento de encomenda", novaEncomenda, item);
    criarNotificacaoSindico(
      novaEncomenda,
      "Encomenda recebida pela portaria",
      `A portaria recebeu uma encomenda para o apto ${novaEncomenda.apartamento}.`
    );

    atualizarTela();

    alert("Encomenda confirmada e morador notificado.");
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📦 Central logística
          </span>

          <h1 style={styles.title}>
            Encomendas da Portaria
          </h1>

          <p style={styles.subtitle}>
            Controle premium de recebimentos, retiradas,
            entregas esperadas e movimentações dos apartamentos.
          </p>

          {porteiro && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Operador responsável:{" "}
                <strong>
                  {porteiro.nome}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Hoje
          </p>

          <h3 style={styles.heroNumber}>
            {recebidasHoje.length}
          </h3>

          <span style={styles.heroStatus}>
            Recebidas no plantão
          </span>
        </div>
      </div>

      <div style={styles.cardsGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Pendentes
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes.length}
            </h2>

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
            📬
          </div>

          <div>
            <p style={styles.cardLabel}>
              Entregas esperadas
            </p>

            <h2 style={styles.cardNumberBlue}>
              {esperadas.length}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.cardLabel}>
              Retiradas
            </p>

            <h2 style={styles.cardNumberGreen}>
              {retiradas.length}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconYellow}>
            🕒
          </div>

          <div>
            <p style={styles.cardLabel}>
              Retiradas hoje
            </p>

            <h2 style={styles.cardNumberYellow}>
              {retiradasHoje.length}
            </h2>
          </div>
        </div>
      </div>

      {esperadas.length > 0 && (
        <div style={styles.expectedSection}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Encomendas esperadas
              </h2>

              <p style={styles.sectionSubtitle}>
                Entregas informadas previamente pelos moradores.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              📬 {esperadas.length} aguardando
            </span>
          </div>

          <div style={styles.expectedGrid}>
            {esperadas.map((item) => (
              <div
                key={item.id}
                style={styles.expectedCard}
              >
                <div style={styles.expectedTop}>
                  <div>
                    <span style={styles.expectedBadge}>
                      Aguardada
                    </span>

                    <h3 style={styles.expectedType}>
                      📦 {item.tipo || "Encomenda"}
                    </h3>
                  </div>

                  <div style={styles.expectedIcon}>
                    📬
                  </div>
                </div>

                <p style={styles.expectedDescription}>
                  {item.descricao ||
                    "Sem descrição informada"}
                </p>

                <div style={styles.expectedMeta}>
                  <span>
                    🏠 Apto {item.apartamento || "N/A"}
                  </span>

                  {item.nome && (
                    <span>
                      👤 {item.nome}
                    </span>
                  )}

                  {item.transportadora && (
                    <span>
                      🚚 {item.transportadora}
                    </span>
                  )}

                  {item.data && (
                    <span>
                      🕒 {item.data}
                    </span>
                  )}
                </div>

                <button
                  style={styles.confirmButton}
                  onClick={() =>
                    confirmarRecebimento(item)
                  }
                >
                  Confirmar recebimento
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.apartmentSection}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Mapa de apartamentos
            </h2>

            <p style={styles.sectionSubtitle}>
              Clique em um apartamento para registrar, retirar ou
              consultar encomendas.
            </p>
          </div>

          <span style={styles.sectionBadgeGreen}>
            🏢 Torre operacional
          </span>
        </div>

        <ApartmentGrid onRefresh={atualizarTela} />
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
      "linear-gradient(135deg,#4c1d95,#6d28d9,#7c3aed)",
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
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    color: "#f3e8ff",
    fontSize: "14px",
    fontWeight: "600"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#a855f7",
    boxShadow:
      "0 0 0 5px rgba(168,85,247,0.18)"
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
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(220px,100%),1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
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

  cardIconYellow: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#fef3c7",
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

  cardNumberYellow: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  expectedSection: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  apartmentSection: {
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
    marginBottom: "22px"
  },

  sectionTitle: {
    margin: 0,
    color: "#6d28d9",
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

  sectionBadgeGreen: {
    background: "#faf5ff",
    color: "#7c3aed",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  expectedGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(280px,100%), 1fr))",
    gap: "18px"
  },

  expectedCard: {
    minWidth: 0,
    background: "#fbfaff",
    borderRadius: "22px",
    padding: "22px",
    border: "1px solid #ddd6fe"
  },

  expectedTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px"
  },

  expectedBadge: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "9px"
  },

  expectedType: {
    margin: 0,
    color: "#111827",
    fontSize: "18px"
  },

  expectedIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "#ede9fe",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px"
  },

  expectedDescription: {
    color: "#374151",
    lineHeight: "1.5",
    margin: "0 0 16px"
  },

  expectedMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "18px"
  },

  confirmButton: {
    width: "100%",
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow:
      "0 12px 25px rgba(124,58,237,0.18)"
  }
};

export default EncomendasPorteiro;