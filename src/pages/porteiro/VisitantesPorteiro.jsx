import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function VisitantesPorteiro() {
  const STORAGE_KEY = "visitantes";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";
  const STORAGE_HISTORICO = "visitantes_historico";
  const STORAGE_NOTIFICACOES_MORADOR = "notificacoesMorador";

  const estadoInicial = {
    nome: "",
    apartamento: "",
    observacao: "",
    tipoVisitante: "Pessoa comum",
    documento: ""
  };

  const [visitantes, setVisitantes] = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [form, setForm] = useState(estadoInicial);
  const [porteiro, setPorteiro] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  useEffect(() => {
    carregarSessao();
    carregarVisitantes();
    carregarApartamentos();
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
      localStorage.getItem("sessaoPorteiro") ||
      sessionStorage.getItem("sessaoPorteiro");

    try {
      const usuario = sessao ? JSON.parse(sessao) : null;
      setPorteiro(usuario);
    } catch {
      setPorteiro(null);
    }
  }

  function carregarVisitantes() {
    setVisitantes(lerStorage(STORAGE_KEY));
  }

  function carregarApartamentos() {
    const listaApartamentos = lerStorage("apartamentos");
    const moradores = lerStorage("moradores");

    const apartamentosDosMoradores = moradores
      .map((m) => m.apartamento || m.apto)
      .filter(Boolean);

    const apartamentosCadastrados = listaApartamentos
      .map((a) => a.numero || a.apartamento || a.apto)
      .filter(Boolean);

    const listaFinal = [
      ...new Set([
        ...apartamentosCadastrados,
        ...apartamentosDosMoradores
      ])
    ].sort((a, b) => Number(a) - Number(b));

    setApartamentos(listaFinal);
  }

  function limparFormulario() {
    setForm(estadoInicial);
  }

  function buscarMoradorPorApartamento(apartamento) {
    const moradores = lerStorage("moradores");

    return (
      moradores.find(
        (m) =>
          String(m.apartamento || m.apto) === String(apartamento) &&
          m.moradorPrincipal
      ) ||
      moradores.find(
        (m) =>
          String(m.apartamento || m.apto) === String(apartamento)
      ) ||
      {}
    );
  }

  function buscarApartamento(apartamento) {
    const apartamentos = lerStorage("apartamentos");

    return (
      apartamentos.find(
        (ap) =>
          String(ap.numero || ap.apartamento || ap.apto) === String(apartamento)
      ) || {}
    );
  }

  function registrarAuditoriaVisitante(acao, visitante, antes = null) {
    registrarAuditoria({
      acao,
      modulo: "Visitantes Porteiro",
      detalhes: `${visitante?.nome || "Visitante"} • Apto ${visitante?.apartamento || "-"}`,
      antes,
      depois: visitante,
      referenciaId: visitante?.id || null
    });
  }

  function criarNotificacaoSindicoVisitante(visitante, titulo, mensagem, prioridade = "normal") {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Visitantes",
      origem: "Porteiro",
      perfilDestino: "sindico",
      moduloOrigem: "VisitantesPorteiro",
      referenciaId: visitante?.id || null,
      prioridade
    });
  }

  function registrarAvisoSindico(acao, visitante) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);
    const moradorResponsavel = buscarMoradorPorApartamento(
      visitante.apartamento
    );

    const novo = {
      id: Date.now() + 1,
      visitanteId: visitante.id,
      categoria: "Visitante",
      origem: "Porteiro",
      titulo: `Visitante ${acao} - ${visitante.nome}`,
      descricao:
        visitante.observacao ||
        `Visitante ${visitante.nome} para o apartamento ${visitante.apartamento}`,
      apartamento: visitante.apartamento,
      apartamentoId: visitante.apartamentoId || null,
      morador: moradorResponsavel.nome || visitante.morador || "",
      responsavel: visitante.porteiro || "Porteiro",
      status: visitante.status,
      respostaSindico: "",
      cienciaSindico: false,
      data: visitante.data,
      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true,
      origemModulo: "Visitantes",
      criadoEm: agora.toISOString(),
      atualizadoEm: agora.toISOString()
    };

    salvarStorage(STORAGE_AVISOS_SINDICO, [
      novo,
      ...avisos
    ]);
  }

  function registrarMovimentacao(acao, visitante) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: Date.now() + 2,
      tipo: "Visitante",
      acao,
      origem: "Porteiro",
      titulo: `Visitante ${visitante.nome}`,
      visitanteId: visitante.id,
      apartamento: visitante.apartamento,
      descricao: visitante.observacao,
      status: visitante.status,
      porteiro: visitante.porteiro || "Porteiro",
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      timestamp: Date.now(),
      impactaBI: true,
      origemModulo: "Visitantes"
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [
      nova,
      ...movimentacoes
    ]);
  }

  function registrarRelatorio(acao, visitante) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novo = {
      id: Date.now() + 3,
      tipo: "Visitante",
      acao,
      origem: "Porteiro",
      titulo: `Visitante ${visitante.nome}`,
      visitanteId: visitante.id,
      nome: visitante.nome,
      apartamento: visitante.apartamento,
      documento: visitante.documento,
      tipoVisitante: visitante.tipoVisitante,
      observacao: visitante.observacao,
      status: visitante.status,
      porteiro: visitante.porteiro || "Porteiro",
      data: visitante.data,
      horarioEntrada: visitante.horarioEntrada,
      horarioSaida: visitante.horarioSaida || "",
      impactaRelatorio: true,
      origemModulo: "Visitantes"
    };

    salvarStorage(STORAGE_RELATORIOS, [
      novo,
      ...relatorios
    ]);
  }

  function registrarHistorico(acao, visitante) {
    const historico = lerStorage(STORAGE_HISTORICO);

    const novo = {
      id: Date.now() + 4,
      visitanteId: visitante.id,
      acao,
      origem: "Porteiro",
      nome: visitante.nome,
      apartamento: visitante.apartamento,
      documento: visitante.documento,
      tipoVisitante: visitante.tipoVisitante,
      observacao: visitante.observacao,
      status: visitante.status,
      porteiro: visitante.porteiro || "Porteiro",
      data: visitante.data,
      horarioEntrada: visitante.horarioEntrada,
      horarioSaida: visitante.horarioSaida || "",
      registradoEm: new Date().toLocaleString("pt-BR"),
      origemModulo: "Visitantes"
    };

    salvarStorage(STORAGE_HISTORICO, [
      novo,
      ...historico
    ]);
  }

  function registrarNotificacaoMorador(acao, visitante) {
    const moradorResponsavel = buscarMoradorPorApartamento(
      visitante.apartamento
    );

    if (!moradorResponsavel.nome) return;

    const notificacoes = lerStorage(STORAGE_NOTIFICACOES_MORADOR);

    const nova = {
      id: Date.now() + 5,
      categoria: "Visitante",
      origem: "Porteiro",
      titulo: `Atualização de visitante`,
      descricao: `O visitante ${visitante.nome} está com status: ${visitante.status}`,
      visitanteId: visitante.id,
      apartamento: visitante.apartamento,
      apartamentoId: visitante.apartamentoId || null,
      morador: moradorResponsavel.nome,
      moradorId: moradorResponsavel.id || "",
      status: visitante.status,
      acao,
      lida: false,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      origemModulo: "Visitantes"
    };

    salvarStorage(STORAGE_NOTIFICACOES_MORADOR, [
      nova,
      ...notificacoes
    ]);
  }

  function registrarFluxo(acao, visitante) {
    registrarAvisoSindico(acao, visitante);
    registrarMovimentacao(acao, visitante);
    registrarRelatorio(acao, visitante);
    registrarHistorico(acao, visitante);
    registrarAuditoriaVisitante(`Visitante - ${acao}`, visitante);

    if (
      visitante.status === "Autorizado" ||
      visitante.status === "Em Visita" ||
      visitante.status === "Saiu"
    ) {
      registrarNotificacaoMorador(acao, visitante);
    }
  }

  function cadastrarVisitante() {
    if (!form.nome || !form.apartamento) {
      alert("Preencha o nome do visitante e o apartamento");
      return;
    }

    if (form.nome.trim().length < 3) {
      alert("Informe um nome válido para o visitante.");
      return;
    }

    if (
      form.tipoVisitante === "Prestador de serviço" &&
      !form.documento
    ) {
      alert("Documento obrigatório para prestador de serviço");
      return;
    }

    const agora = new Date();
    const moradorResponsavel = buscarMoradorPorApartamento(
      form.apartamento
    );

    const apartamentoSelecionado = buscarApartamento(form.apartamento);

    const novo = {
      id: Date.now(),
      nome: form.nome.trim(),
      apartamento: form.apartamento,
      apto: form.apartamento,
      apartamentoId: apartamentoSelecionado.id || moradorResponsavel.apartamentoId || null,
      morador: moradorResponsavel.nome || "",
      moradorId: moradorResponsavel.id || "",
      observacao: form.observacao,
      tipoVisitante: form.tipoVisitante,
      documento: form.documento,
      horarioEntrada: agora.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      horarioSaida: "",
      data: agora.toLocaleDateString("pt-BR"),
      status: "Aguardando",
      cienciaSindico: false,
      porteiro: porteiro?.nome || "Porteiro",
      porteiroUsuario: porteiro?.usuario || "",
      turno: porteiro?.turno || "-",
      porteiroId: porteiro?.id || null,
      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true,
      origemModulo: "Visitantes"
    };

    const atualizados = [
      novo,
      ...visitantes
    ];

    salvarStorage(STORAGE_KEY, atualizados);
    setVisitantes(atualizados);

    registrarFluxo("cadastro", novo);
    criarNotificacaoSindicoVisitante(
      novo,
      "Novo visitante registrado",
      `${novo.nome} foi registrado para o apto ${novo.apartamento}.`
    );

    limparFormulario();
  }

  function alterarStatus(id, novoStatus) {
    const agora = new Date();

    let visitanteAtualizado = null;

    const atualizados = visitantes.map((v) => {
      if (v.id !== id) return v;

      visitanteAtualizado = {
        ...v,
        status: novoStatus,
        statusSindico: novoStatus,
        cienciaSindico: true,
        autorizado:
          novoStatus === "Autorizado" || novoStatus === "Em Visita"
            ? true
            : v.autorizado,
        bloqueado:
          novoStatus === "Bloqueado"
            ? true
            : novoStatus === "Autorizado" || novoStatus === "Em Visita"
            ? false
            : v.bloqueado,
        impactaBI: true,
        impactaRelatorio: true,
        exibirNaCentral: true,
        origemModulo: "Visitantes",
        atualizadoEm: agora.toISOString()
      };

      if (novoStatus === "Saiu") {
        visitanteAtualizado.horarioSaida =
          agora.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          });

        visitanteAtualizado.saidaEm =
          agora.toLocaleString("pt-BR");
      }

      return visitanteAtualizado;
    });

    salvarStorage(STORAGE_KEY, atualizados);
    setVisitantes(atualizados);

    if (visitanteAtualizado) {
      registrarFluxo(`status_${novoStatus}`, visitanteAtualizado);

      if (
        novoStatus === "Em Visita" ||
        novoStatus === "Saiu" ||
        novoStatus === "Bloqueado"
      ) {
        criarNotificacaoSindicoVisitante(
          visitanteAtualizado,
          `Visitante ${novoStatus}`,
          `${visitanteAtualizado.nome} agora está com status ${novoStatus}.`,
          novoStatus === "Bloqueado" ? "alta" : "normal"
        );
      }
    }
  }

  function excluirVisitante(id) {
    const confirmar = window.confirm(
      "Deseja excluir este visitante?"
    );

    if (!confirmar) return;

    const visitante = visitantes.find(
      (v) => v.id === id
    );

    const atualizados = visitantes.filter(
      (v) => v.id !== id
    );

    salvarStorage(STORAGE_KEY, atualizados);
    setVisitantes(atualizados);

    if (visitante) {
      registrarHistorico("exclusao", visitante);
      registrarMovimentacao("exclusao", visitante);
      registrarRelatorio("exclusao", visitante);
      registrarAuditoriaVisitante("Excluiu visitante", visitante, visitante);
    }
  }

  function obterStatus(status) {
    if (status === "Aguardando") {
      return {
        texto: "Aguardando",
        fundo: "#fef3c7",
        cor: "#92400e"
      };
    }

    if (status === "Autorizado") {
      return {
        texto: "Autorizado",
        fundo: "#dbeafe",
        cor: "#1d4ed8"
      };
    }

    if (status === "Em Visita") {
      return {
        texto: "Dentro do condomínio",
        fundo: "#dcfce7",
        cor: "#166534"
      };
    }

    if (status === "Saiu") {
      return {
        texto: "Saiu",
        fundo: "#f3f4f6",
        cor: "#374151"
      };
    }

    if (status === "Bloqueado") {
      return {
        texto: "Bloqueado",
        fundo: "#fee2e2",
        cor: "#b91c1c"
      };
    }

    return {
      texto: status,
      fundo: "#f3f4f6",
      cor: "#111827"
    };
  }

  const visitantesFiltrados = visitantes.filter((item) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      item.nome?.toLowerCase().includes(texto) ||
      item.apartamento?.toLowerCase().includes(texto) ||
      item.tipoVisitante?.toLowerCase().includes(texto) ||
      item.documento?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      item.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  const aguardando = visitantes.filter(
    (v) => v.status === "Aguardando"
  ).length;

  const liberados = visitantes.filter(
    (v) => v.status === "Autorizado"
  ).length;

  const dentro = visitantes.filter(
    (v) => v.status === "Em Visita"
  ).length;

  const saiu = visitantes.filter(
    (v) => v.status === "Saiu"
  ).length;
    return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            🚶 Controle de acesso
          </span>

          <h1 style={styles.title}>
            Visitantes da Portaria
          </h1>

          <p style={styles.subtitle}>
            Registre visitantes, libere entradas, acompanhe saídas
            e mantenha o plantão organizado em tempo real.
          </p>

          {porteiro && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Porteiro responsável:{" "}
                <strong>
                  {porteiro.nome}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Dentro agora
          </p>

          <h3 style={styles.heroNumber}>
            {dentro}
          </h3>

          <span style={styles.heroStatus}>
            Visitantes ativos
          </span>
        </div>
      </div>

      <div style={styles.cards}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Aguardando
            </p>

            <h2 style={styles.cardNumberLight}>
              {aguardando}
            </h2>

            <span style={styles.cardHintLight}>
              aguardando autorização
            </span>
          </div>

          <div style={styles.cardIconLight}>
            ⏳
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBlue}>
            🔓
          </div>

          <div>
            <p style={styles.cardLabel}>
              Autorizados
            </p>

            <h2 style={styles.cardNumberBlue}>
              {liberados}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconGreen}>
            🚶
          </div>

          <div>
            <p style={styles.cardLabel}>
              Dentro
            </p>

            <h2 style={styles.cardNumberGreen}>
              {dentro}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconDark}>
            ✅
          </div>

          <div>
            <p style={styles.cardLabel}>
              Saíram
            </p>

            <h2 style={styles.cardNumberDark}>
              {saiu}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.formCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Novo visitante
            </h2>

            <p style={styles.sectionSubtitle}>
              Preencha os dados para registrar uma nova entrada.
            </p>
          </div>

          <span style={styles.sectionBadge}>
            Registro rápido
          </span>
        </div>

        <div style={styles.formGrid}>
          <input
            placeholder="Nome do visitante"
            value={form.nome}
            onChange={(e) =>
              setForm({
                ...form,
                nome: e.target.value
              })
            }
            style={styles.input}
          />

          <select
            value={form.apartamento}
            onChange={(e) =>
              setForm({
                ...form,
                apartamento: e.target.value
              })
            }
            style={styles.input}
          >
            <option value="">
              Selecione o apartamento
            </option>

            {apartamentos.map((ap) => (
              <option key={ap} value={ap}>
                Apartamento {ap}
              </option>
            ))}
          </select>

          <select
            value={form.tipoVisitante}
            onChange={(e) =>
              setForm({
                ...form,
                tipoVisitante: e.target.value
              })
            }
            style={styles.input}
          >
            <option>Pessoa comum</option>
            <option>Prestador de serviço</option>
          </select>

          <input
            placeholder={
              form.tipoVisitante === "Prestador de serviço"
                ? "Documento obrigatório"
                : "Documento opcional"
            }
            value={form.documento}
            onChange={(e) =>
              setForm({
                ...form,
                documento: e.target.value
              })
            }
            style={styles.input}
          />
        </div>

        <textarea
          placeholder="Observação sobre a visita"
          value={form.observacao}
          onChange={(e) =>
            setForm({
              ...form,
              observacao: e.target.value
            })
          }
          style={styles.textarea}
        />

        <button
          style={styles.button}
          onClick={cadastrarVisitante}
        >
          Cadastrar visitante
        </button>
      </div>

      <div style={styles.listCard}>
        <div style={styles.listHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Registros de visitantes
            </h2>

            <p style={styles.sectionSubtitle}>
              Controle operacional de entradas e saídas.
            </p>
          </div>

          <div style={styles.filters}>
            <input
              placeholder="Buscar visitante..."
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
              <option value="Aguardando">Aguardando</option>
              <option value="Autorizado">Autorizado</option>
              <option value="Em Visita">Em Visita</option>
              <option value="Saiu">Saiu</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>

        {visitantesFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📭
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhum visitante encontrado
            </h3>

            <p style={styles.emptyText}>
              Os registros aparecerão aqui conforme forem cadastrados.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {visitantesFiltrados.map((item) => {
              const status = obterStatus(item.status);

              return (
                <div
                  key={item.id}
                  style={styles.visitorCard}
                >
                  <div style={styles.cardTop}>
                    <div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background: status.fundo,
                          color: status.cor
                        }}
                      >
                        {status.texto}
                      </span>

                      <h3 style={styles.nome}>
                        {item.nome}
                      </h3>
                    </div>

                    <div style={styles.visitorIcon}>
                      🚶
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Apartamento
                      </span>

                      <strong>
                        {item.apartamento}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Morador
                      </span>

                      <strong>
                        {item.morador || "-"}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Tipo
                      </span>

                      <strong>
                        {item.tipoVisitante}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Entrada
                      </span>

                      <strong>
                        {item.horarioEntrada}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Saída
                      </span>

                      <strong>
                        {item.horarioSaida || "-"}
                      </strong>
                    </div>
                  </div>

                  {item.documento && (
                    <p style={styles.documento}>
                      Documento: {item.documento}
                    </p>
                  )}

                  {item.observacao && (
                    <p style={styles.obs}>
                      {item.observacao}
                    </p>
                  )}

                  <p style={styles.porteiroInfo}>
                    Registrado por{" "}
                    <strong>
                      {item.porteiro || "Porteiro"}
                    </strong>{" "}
                    • Turno {item.turno || "-"}
                  </p>

                  <div style={styles.actions}>
                    <button
                      style={styles.blue}
                      onClick={() =>
                        alterarStatus(item.id, "Autorizado")
                      }
                    >
                      Autorizar
                    </button>

                    <button
                      style={styles.green}
                      onClick={() =>
                        alterarStatus(item.id, "Em Visita")
                      }
                    >
                      Entrada
                    </button>

                    <button
                      style={styles.gray}
                      onClick={() =>
                        alterarStatus(item.id, "Saiu")
                      }
                    >
                      Saída
                    </button>

                    <button
                      style={styles.red}
                      onClick={() =>
                        excluirVisitante(item.id)
                      }
                    >
                      Excluir
                    </button>
                  </div>
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
    fontFamily: "Arial",
    color: "#111827"
  },

  hero: {
    background:
      "linear-gradient(135deg,#052e16,#14532d,#166534)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow:
      "0 20px 45px rgba(20,83,45,0.25)"
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
    color: "#dcfce7",
    fontSize: "14px",
    fontWeight: "600"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow:
      "0 0 0 5px rgba(34,197,94,0.16)"
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
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#14532d,#16a34a)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 14px 35px rgba(22,163,74,0.2)"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)",
    border: "1px solid #eef2f7"
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

  cardIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconDark: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f3f4f6",
    display: "flex",
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
    color: "#2563eb",
    fontSize: "34px"
  },

  cardNumberGreen: {
    margin: "8px 0 0",
    color: "#166534",
    fontSize: "34px"
  },

  cardNumberDark: {
    margin: "8px 0 0",
    color: "#374151",
    fontSize: "34px"
  },

  formCard: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
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
    color: "#14532d",
    fontSize: "24px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "14px"
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb",
    boxSizing: "border-box"
  },

  textarea: {
    width: "100%",
    minHeight: "95px",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb",
    boxSizing: "border-box",
    marginTop: "14px",
    resize: "vertical",
    fontFamily: "Arial"
  },

  button: {
    marginTop: "14px",
    width: "100%",
    background:
      "linear-gradient(135deg,#14532d,#16a34a)",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow:
      "0 12px 25px rgba(22,163,74,0.20)"
  },

  listCard: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "22px"
  },

  filters: {
    display: "flex",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f9fafb",
    minWidth: "230px"
  },

  filter: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f9fafb"
  },

  empty: {
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
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

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(310px,1fr))",
    gap: "18px"
  },

  visitorCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "22px",
    boxShadow:
      "0 10px 25px rgba(15,23,42,0.04)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "16px"
  },

  statusBadge: {
    display: "inline-block",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "10px"
  },

  nome: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  visitorIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "17px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "14px"
  },

  infoItem: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "16px",
    padding: "12px"
  },

  infoLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "5px"
  },

  documento: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    padding: "12px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "700"
  },

  obs: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "14px",
    padding: "12px",
    color: "#374151",
    fontStyle: "italic",
    lineHeight: "1.5"
  },

  porteiroInfo: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "14px"
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "10px",
    marginTop: "16px"
  },

  blue: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  },

  green: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  },

  gray: {
    background: "#6b7280",
    color: "white",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  },

  red: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  }
};

export default VisitantesPorteiro;