import { useAlerta } from "../../components/Alerta/AlertaProvider";
import { useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function Moradores() {
  const { mostrarAlerta, confirmarAcao } = useAlerta();
  const STORAGE_KEY = "moradores";
  const STORAGE_MOVIMENTACOES = "movimentacoes";

  const estadoInicialMorador = {
    id: null,
    nome: "",
    apto: "",
    apartamento: "",
    telefone: "",
    email: "",
    usuario: "",
    senha: "",
    status: "Ativo",
    tipoMorador: "Proprietário",
    moradorPrincipal: false,
    perfilMorador: "principal",
    apartamentoId: null,
    permissoesMorador: {
      podeReservar: true,
      podeAbrirSugestao: true,
      podeVisualizarEncomendas: true
    },
    condominioId: null,
    nomeCondominio: ""
  };

  const [moradores, setMoradores] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEY);

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return lista.map((morador) => ({
      ...morador,
      apto: morador.apto || morador.apartamento || "",
      apartamento: morador.apartamento || morador.apto || "",
      tipoMorador: morador.tipoMorador || "Proprietário",
      moradorPrincipal: Boolean(morador.moradorPrincipal),
      perfilMorador: morador.perfilMorador || (morador.moradorPrincipal ? "principal" : "dependente"),
      apartamentoId: morador.apartamentoId || null,
      permissoesMorador: morador.permissoesMorador || {
        podeReservar: morador.moradorPrincipal !== false,
        podeAbrirSugestao: true,
        podeVisualizarEncomendas: true
      },
      status: morador.status || "Ativo"
    }));
  });

  const [apartamentos] = useState(() => {
    const dados = localStorage.getItem("apartamentos");
    return dados ? JSON.parse(dados) : [];
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novoMorador, setNovoMorador] = useState(estadoInicialMorador);
  const [editId, setEditId] = useState(null);

  const moradoresFiltrados = moradores.filter((morador) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      morador.nome?.toLowerCase().includes(texto) ||
      morador.apto?.toLowerCase().includes(texto) ||
      morador.apartamento?.toLowerCase().includes(texto) ||
      morador.telefone?.toLowerCase().includes(texto) ||
      morador.email?.toLowerCase().includes(texto) ||
      morador.usuario?.toLowerCase().includes(texto) ||
      morador.tipoMorador?.toLowerCase().includes(texto) ||
      morador.status?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      morador.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  const totalAtivos = moradores.filter(
    (m) => m.status === "Ativo"
  ).length;

  const totalInativos = moradores.filter(
    (m) => m.status === "Inativo"
  ).length;

  const totalBloqueados = moradores.filter(
    (m) => m.status === "Bloqueado"
  ).length;

  const totalPrincipais = moradores.filter(
    (m) => m.moradorPrincipal
  ).length;

  const totalDependentes = moradores.filter(
    (m) => !m.moradorPrincipal
  ).length;

  const apartamentosVinculados = new Set(
    moradores
      .map((m) => m.apto || m.apartamento)
      .filter(Boolean)
  ).size;

  const apartamentosDisponiveisParaSelect = apartamentos.map((ap) => ({
    id: ap.id,
    label: `Bloco ${ap.bloco} - Apto ${ap.numero}`,
    value: ap.numero,
    bloco: ap.bloco,
    numero: ap.numero
  }));

  function lerStorage(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
      return [];
    }
  }

  function salvarStorage(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  function obterPerfilCondominio() {
    try {
      const perfil =
        JSON.parse(localStorage.getItem("perfil_condominio")) ||
        JSON.parse(localStorage.getItem("configuracoes")) ||
        {};

      return {
        condominioId: perfil.id || perfil.condominioId || null,
        nomeCondominio: perfil.nomeCondominio || ""
      };
    } catch {
      return {
        condominioId: null,
        nomeCondominio: ""
      };
    }
  }

  function buscarApartamentoPorNumero(numero) {
    return apartamentos.find(
      (ap) => String(ap.numero) === String(numero)
    );
  }

  function atualizarVinculosApartamento(listaMoradoresAtualizada) {
    const apartamentosAtuais = lerStorage("apartamentos");

    const apartamentosAtualizados = apartamentosAtuais.map((ap) => {
      const vinculados = listaMoradoresAtualizada.filter(
        (morador) =>
          String(morador.apartamento || morador.apto || "") ===
          String(ap.numero || "")
      );

      const principal = vinculados.find((morador) => morador.moradorPrincipal);

      return {
        ...ap,
        moradoresIds: vinculados.map((morador) => morador.id),
        moradoresNomes: vinculados.map((morador) => morador.nome),
        morador: principal?.nome || vinculados[0]?.nome || "",
        status: vinculados.length > 0 ? "Ocupado" : ap.status
      };
    });

    salvarStorage("apartamentos", apartamentosAtualizados);
  }

  function definirPermissoesMorador(moradorPrincipal, tipoMorador) {
    const dependente = tipoMorador === "Dependente" || !moradorPrincipal;

    return {
      podeReservar: !dependente || moradorPrincipal,
      podeAbrirSugestao: true,
      podeVisualizarEncomendas: true
    };
  }

  function registrarMovimentacaoMorador(acao, morador) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: Date.now(),
      tipo: "Morador",
      origem: "Síndico",
      titulo: `${acao}: ${morador?.nome || "Morador"}`,
      descricao: `Apartamento ${morador?.apto || morador?.apartamento || "-"}`,
      status: morador?.status || "Ativo",
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      criadoEm: new Date().toISOString()
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [nova, ...movimentacoes]);
  }

  function registrarAuditoriaMorador({
    acao,
    detalhes,
    antes = null,
    depois = null,
    referenciaId = null
  }) {
    registrarAuditoria({
      acao,
      modulo: "Moradores",
      detalhes,
      antes,
      depois,
      referenciaId
    });
  }

  function criarNotificacaoMorador({
    titulo,
    mensagem,
    referenciaId = null,
    prioridade = "normal"
  }) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Moradores",
      origem: "Moradores",
      perfilDestino: "sindico",
      moduloOrigem: "Moradores",
      referenciaId,
      prioridade
    });
  }

  function limparTelefone(valor) {
    return String(valor || "").replace(/\D/g, "");
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function validarMorador() {
    const nome = String(novoMorador.nome || "").trim();
    const apartamento = String(novoMorador.apto || "").trim();
    const telefone = limparTelefone(novoMorador.telefone);
    const email = String(novoMorador.email || "").trim();
    const usuario = String(novoMorador.usuario || "").trim();
    const senha = String(novoMorador.senha || "").trim();

    if (nome.length < 3) {
      mostrarAlerta("Informe um nome válido com pelo menos 3 caracteres.");
      return false;
    }

    if (!apartamento) {
      mostrarAlerta("Selecione ou informe o apartamento do morador.");
      return false;
    }

    if (telefone.length < 10 || telefone.length > 11) {
      mostrarAlerta("Informe um telefone válido com DDD. Use apenas números.");
      return false;
    }

    if (!validarEmail(email)) {
      mostrarAlerta("Informe um e-mail válido. Exemplo: morador@email.com");
      return false;
    }

    if (usuario.length < 4) {
      mostrarAlerta("O usuário de login deve ter pelo menos 4 caracteres.");
      return false;
    }

    if (/\s/.test(usuario)) {
      mostrarAlerta("O usuário de login não pode conter espaços.");
      return false;
    }

    if (senha.length < 4) {
      mostrarAlerta("A senha deve ter pelo menos 4 caracteres.");
      return false;
    }

    if (!novoMorador.tipoMorador) {
      mostrarAlerta("Selecione o tipo de morador.");
      return false;
    }

    if (!novoMorador.status) {
      mostrarAlerta("Selecione o status do morador.");
      return false;
    }

    if (novoMorador.moradorPrincipal) {
      const principalExistente = moradores.find(
        (m) =>
          String(m.apto || m.apartamento || "") === String(apartamento) &&
          m.moradorPrincipal &&
          m.id !== editId
      );

      if (principalExistente) {
        mostrarAlerta("Este apartamento já possui um morador principal.");
        return false;
      }
    }

    return true;
  }


  function selecionarApartamento(valor) {
    const apartamentoSelecionado = buscarApartamentoPorNumero(valor);

    setNovoMorador({
      ...novoMorador,
      apto: valor,
      apartamento: valor,
      apartamentoId: apartamentoSelecionado?.id || null
    });
  }

  function salvarMorador() {
    if (!validarMorador()) {
      return;
    }

    const usuarioExistente = moradores.find(
      (m) =>
        m.usuario?.toLowerCase() ===
          novoMorador.usuario.toLowerCase() &&
        m.id !== editId
    );

    if (usuarioExistente) {
      mostrarAlerta("Esse usuário já existe");
      return;
    }

    const perfilCondominio = obterPerfilCondominio();
    const apartamentoSelecionado = buscarApartamentoPorNumero(novoMorador.apto);
    const moradorPrincipal = Boolean(novoMorador.moradorPrincipal);

    const moradorFormatado = {
      ...novoMorador,
      nome: String(novoMorador.nome || "").trim(),
      apto: String(novoMorador.apto || "").trim(),
      apartamento: String(novoMorador.apto || "").trim(),
      apartamentoId: apartamentoSelecionado?.id || novoMorador.apartamentoId || null,
      telefone: limparTelefone(novoMorador.telefone),
      email: String(novoMorador.email || "").trim().toLowerCase(),
      usuario: String(novoMorador.usuario || "").trim(),
      senha: String(novoMorador.senha || "").trim(),
      tipoMorador: novoMorador.tipoMorador || "Proprietário",
      moradorPrincipal,
      perfilMorador: moradorPrincipal ? "principal" : "dependente",
      permissoesMorador: definirPermissoesMorador(
        moradorPrincipal,
        novoMorador.tipoMorador
      ),
      status: novoMorador.status || "Ativo",
      condominioId: perfilCondominio.condominioId,
      nomeCondominio: perfilCondominio.nomeCondominio,
      atualizadoEm: new Date().toISOString()
    };

    let listaAtualizada = [];

    if (editId !== null) {
      const moradorAntes = moradores.find((morador) => morador.id === editId);

      listaAtualizada = moradores.map((morador) =>
        morador.id === editId
          ? {
              ...moradorFormatado,
              id: editId
            }
          : morador
      );

      const moradorDepois = listaAtualizada.find((morador) => morador.id === editId);

      registrarAuditoriaMorador({
        acao: "Editou morador",
        detalhes: `${moradorFormatado.nome} - Apto ${moradorFormatado.apto}`,
        antes: moradorAntes,
        depois: moradorDepois,
        referenciaId: editId
      });

      criarNotificacaoMorador({
        titulo: "Morador atualizado",
        mensagem: `${moradorFormatado.nome} teve o cadastro atualizado.`,
        referenciaId: editId
      });

      registrarMovimentacaoMorador("Editou morador", moradorDepois);

      setEditId(null);
    } else {
      const novo = {
        ...moradorFormatado,
        id: Date.now(),
        criadoEm: new Date().toISOString()
      };

      listaAtualizada = [
        ...moradores,
        novo
      ];

      registrarAuditoriaMorador({
        acao: "Cadastrou morador",
        detalhes: `${novo.nome} - Apto ${novo.apto}`,
        depois: novo,
        referenciaId: novo.id
      });

      criarNotificacaoMorador({
        titulo: "Novo morador cadastrado",
        mensagem: `${novo.nome} foi vinculado ao apartamento ${novo.apto}.`,
        referenciaId: novo.id
      });

      registrarMovimentacaoMorador("Cadastrou morador", novo);
    }

    setMoradores(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listaAtualizada)
    );

    atualizarVinculosApartamento(listaAtualizada);

    setNovoMorador(estadoInicialMorador);
    setMostrarModal(false);
  }

  async function excluirMorador(id) {
    const confirmar = await confirmarAcao(
      "Deseja realmente excluir este morador?"
    );

    if (!confirmar) return;

    const moradorExcluido = moradores.find(
      (morador) => morador.id === id
    );

    const listaAtualizada = moradores.filter(
      (morador) => morador.id !== id
    );

    setMoradores(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listaAtualizada)
    );

    atualizarVinculosApartamento(listaAtualizada);

    registrarAuditoriaMorador({
      acao: "Excluiu morador",
      detalhes: `${moradorExcluido?.nome || "Morador"} - Apto ${moradorExcluido?.apto || moradorExcluido?.apartamento || "-"}`,
      antes: moradorExcluido,
      referenciaId: id
    });

    criarNotificacaoMorador({
      titulo: "Morador removido",
      mensagem: `${moradorExcluido?.nome || "Um morador"} foi removido do cadastro.`,
      referenciaId: id,
      prioridade: "alta"
    });

    registrarMovimentacaoMorador("Excluiu morador", moradorExcluido);
  }

  function editarMorador(morador) {
    setNovoMorador({
      ...estadoInicialMorador,
      ...morador,
      apto: morador.apto || morador.apartamento || "",
      apartamento: morador.apartamento || morador.apto || "",
      tipoMorador: morador.tipoMorador || "Proprietário",
      moradorPrincipal: Boolean(morador.moradorPrincipal),
      perfilMorador: morador.perfilMorador || (morador.moradorPrincipal ? "principal" : "dependente"),
      apartamentoId: morador.apartamentoId || null,
      permissoesMorador: morador.permissoesMorador || {
        podeReservar: morador.moradorPrincipal !== false,
        podeAbrirSugestao: true,
        podeVisualizarEncomendas: true
      },
      status: morador.status || "Ativo"
    });

    setEditId(morador.id);
    setMostrarModal(true);
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoMorador(estadoInicialMorador);
  }

  function corStatus(status) {
    if (status === "Ativo") {
      return {
        background: "#f3e8ff",
        color: "#7c3aed",
        border: "#ddd6fe"
      };
    }

    if (status === "Bloqueado") {
      return {
        background: "#fef3c7",
        color: "#92400e",
        border: "#fde68a"
      };
    }

    return {
      background: "#fee2e2",
      color: "#b91c1c",
      border: "#fecaca"
    };
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            Diretório residencial
          </span>

          <h1 style={styles.title}>
            Moradores
          </h1>

          <p style={styles.subtitle}>
            Central de cadastro, acesso e vínculo residencial dos moradores.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.heroCounter}>
            <strong>{moradores.length}</strong>
            <span>moradores</span>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovoMorador(estadoInicialMorador);
              setMostrarModal(true);
            }}
          >
            + Novo morador
          </button>
        </div>
      </section>

      <section style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por nome, apartamento, telefone, e-mail, usuário ou tipo..."
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
          <option>Ativo</option>
          <option>Inativo</option>
          <option>Bloqueado</option>
        </select>

        <div style={styles.inlineNumbers}>
          <span>
            <b>{totalAtivos}</b> ativos
          </span>

          <span>
            <b>{totalInativos}</b> inativos
          </span>

          <span>
            <b>{totalBloqueados}</b> bloqueados
          </span>

          <span>
            <b>{apartamentosVinculados}</b> aptos
          </span>

          <span>
            <b>{totalPrincipais}</b> principais
          </span>

          <span>
            <b>{totalDependentes}</b> dependentes
          </span>
        </div>
      </section>

      <section style={styles.registry}>
        <div style={styles.registryHeader}>
          <div>
            <span style={styles.registryLabel}>
              Cadastro geral
            </span>

            <h2 style={styles.registryTitle}>
              Lista de moradores
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {moradoresFiltrados.length} resultado(s)
          </span>
        </div>

        {moradoresFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              👥
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhum morador encontrado
            </h3>

            <p style={styles.emptyText}>
              Cadastre moradores para liberar acesso ao portal e integrar com reservas, encomendas e portaria.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovoMorador(estadoInicialMorador);
                setMostrarModal(true);
              }}
            >
              Cadastrar morador
            </button>
          </div>
        ) : (
          <div style={styles.roster}>
            {moradoresFiltrados.map((morador) => {
              const status = corStatus(morador.status);

              return (
                <article
                  key={morador.id}
                  style={{
                    ...styles.residentCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardAccent}></div>

                  <div style={styles.residentMain}>
                    <div style={styles.avatarBox}>
                      {morador.nome
                        ? morador.nome.charAt(0).toUpperCase()
                        : "M"}
                    </div>

                    <div style={styles.residentIdentity}>
                      <div style={styles.nameLine}>
                        <h3 style={styles.residentName}>
                          {morador.nome}
                        </h3>

                        <span
                          style={{
                            ...styles.status,
                            background: status.background,
                            color: status.color
                          }}
                        >
                          {morador.status}
                        </span>
                      </div>

                      <p style={styles.residentEmail}>
                        {morador.email || "Sem e-mail cadastrado"}
                      </p>
                    </div>
                  </div>

                  <div style={styles.residentData}>
                    <div style={styles.dataPill}>
                      <span>Apto</span>
                      <strong>
                        {morador.apto || morador.apartamento || "-"}
                      </strong>
                    </div>

                    <div style={styles.dataPill}>
                      <span>Tipo</span>
                      <strong>
                        {morador.tipoMorador || "Proprietário"}
                      </strong>
                    </div>

                    <div style={styles.dataPill}>
                      <span>Perfil</span>
                      <strong>
                        {morador.moradorPrincipal ? "Principal" : "Dependente"}
                      </strong>
                    </div>

                    <div style={styles.dataPill}>
                      <span>Telefone</span>
                      <strong>{morador.telefone || "-"}</strong>
                    </div>

                    <div style={styles.dataPill}>
                      <span>Login</span>
                      <strong>{morador.usuario || "-"}</strong>
                    </div>
                  </div>

                  <div style={styles.residentActions}>
                    <button
                      style={styles.editButton}
                      onClick={() => editarMorador(morador)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => excluirMorador(morador.id)}
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
          <div style={styles.modal} className="scroll-sindico">
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar cadastro" : "Novo cadastro"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar morador"
                    : "Cadastrar morador"}
                </h2>
              </div>

              <button
                style={styles.closeButton}
                onClick={fecharModal}
              >
                ✕
              </button>
            </div>

            <div style={styles.formPanel}>
              <div style={styles.formRow}>
                <label style={styles.label}>
                  Nome completo
                </label>

                <input
                  minLength="3"
                  placeholder="Ex: João Silva"
                  value={novoMorador.nome}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      nome: e.target.value
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Apartamento
                </label>

                {apartamentosDisponiveisParaSelect.length > 0 ? (
                  <select
                    value={novoMorador.apto}
                    onChange={(e) =>
                      selecionarApartamento(e.target.value)
                    }
                    style={styles.input}
                  >
                    <option value="">
                      Selecione um apartamento
                    </option>

                    {apartamentosDisponiveisParaSelect.map((ap) => (
                      <option
                        key={ap.id}
                        value={ap.value}
                      >
                        {ap.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    inputMode="numeric"
                    placeholder="Ex: 101"
                    value={novoMorador.apto}
                    onChange={(e) =>
                      setNovoMorador({
                        ...novoMorador,
                        apto: e.target.value.replace(/\D/g, "").slice(0, 6),
                        apartamento: e.target.value.replace(/\D/g, "").slice(0, 6),
                        apartamentoId: null
                      })
                    }
                    style={styles.input}
                  />
                )}
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Tipo de morador
                </label>

                <select
                  value={novoMorador.tipoMorador}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      tipoMorador: e.target.value
                    })
                  }
                  style={styles.input}
                >
                  <option>Proprietário</option>
                  <option>Inquilino</option>
                  <option>Dependente</option>
                  <option>Cônjuge</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Morador principal
                </label>

                <select
                  value={novoMorador.moradorPrincipal ? "Sim" : "Não"}
                  onChange={(e) => {
                    const principal = e.target.value === "Sim";

                    setNovoMorador({
                      ...novoMorador,
                      moradorPrincipal: principal,
                      perfilMorador: principal ? "principal" : "dependente"
                    });
                  }}
                  style={styles.input}
                >
                  <option>Não</option>
                  <option>Sim</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Telefone
                </label>

                <input
                  inputMode="numeric"
                  maxLength="11"
                  placeholder="Ex: 81999999999"
                  value={novoMorador.telefone}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      telefone: limparTelefone(e.target.value)
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  E-mail
                </label>

                <input
                  type="email"
                  required
                  placeholder="Ex: morador@email.com"
                  value={novoMorador.email}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      email: e.target.value
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Usuário de login
                </label>

                <input
                  minLength="4"
                  placeholder="Ex: joao101"
                  value={novoMorador.usuario}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      usuario: e.target.value.replace(/\s/g, "")
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Senha
                </label>

                <input
                  type="password"
                  minLength="4"
                  placeholder="Senha de acesso"
                  value={novoMorador.senha}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      senha: e.target.value
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
                  value={novoMorador.status}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      status: e.target.value
                    })
                  }
                  style={styles.input}
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                  <option>Bloqueado</option>
                </select>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.saveButton}
                onClick={salvarMorador}
              >
                Salvar morador
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
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.18),transparent 30%), radial-gradient(circle at bottom left,rgba(168,85,247,0.24),transparent 34%), linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
    borderRadius: "42px",
    padding: "38px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "26px",
    color: "white",
    boxShadow:
      "0 30px 80px rgba(88,28,135,0.26), 0 0 46px rgba(168,85,247,0.16)",
    border: "1px solid rgba(255,255,255,0.18)",
    marginBottom: "24px",
    position: "relative",
    overflow: "hidden"
  },

  heroLeft: {
    maxWidth: "720px",
    position: "relative",
    zIndex: 2
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "#f5f3ff",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "15px",
    boxShadow: "0 10px 26px rgba(0,0,0,0.10)"
  },

  title: {
    margin: 0,
    fontSize: "46px",
    letterSpacing: "-1px",
    fontWeight: "900"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    lineHeight: "1.6"
  },

  heroRight: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px",
    position: "relative",
    zIndex: 2
  },

  heroCounter: {
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "26px",
    padding: "19px 24px",
    textAlign: "center",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)"
  },

  heroButton: {
    background: "linear-gradient(135deg,#ffffff,#f3e8ff)",
    color: "#6d28d9",
    border: "1px solid rgba(255,255,255,0.28)",
    padding: "16px 22px",
    borderRadius: "18px",
    cursor: "pointer",
    fontWeight: "900",
    whiteSpace: "nowrap",
    boxShadow: "0 16px 34px rgba(0,0,0,0.16)"
  },

  toolbar: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
    border: "1px solid #ddd6fe",
    borderRadius: "30px",
    padding: "18px",
    marginBottom: "24px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 18px 45px rgba(88,28,135,0.09)"
  },

  searchWrap: {
    flex: 1,
    background: "#fbfaff",
    border: "1px solid #c4b5fd",
    borderRadius: "18px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    padding: "0 14px",
    boxShadow: "inset 0 0 0 1px rgba(168,85,247,0.04)"
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
    fontSize: "14px",
    color: "#111827"
  },

  filter: {
    width: "160px",
    padding: "15px",
    borderRadius: "18px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    color: "#111827"
  },

  inlineNumbers: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#4b5563"
  },

  registry: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ddd6fe",
    borderRadius: "36px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(88,28,135,0.10)"
  },

  registryHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  registryLabel: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  registryTitle: {
    margin: "12px 0 0",
    color: "#4c1d95",
    fontSize: "28px",
    letterSpacing: "-0.4px"
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

  roster: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
    gap: "18px"
  },

  residentCard: {
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 18px 42px rgba(88,28,135,0.10)",
    border: "1px solid #ede9fe"
  },

  cardAccent: {
    position: "absolute",
    inset: "0 auto 0 0",
    width: "7px",
    background:
      "linear-gradient(180deg,#6d28d9,#a855f7,#ddd6fe)"
  },

  residentMain: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px"
  },

  avatarBox: {
    width: "62px",
    height: "62px",
    borderRadius: "23px",
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed,#a855f7)",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    fontWeight: "900",
    boxShadow: "0 16px 30px rgba(124,58,237,0.24)"
  },

  residentIdentity: {
    flex: 1
  },

  nameLine: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center"
  },

  residentName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  residentEmail: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px"
  },

  status: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap",
    border: "1px solid transparent"
  },

  residentData: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  dataPill: {
    background: "#ffffff",
    border: "1px solid #ede9fe",
    borderRadius: "17px",
    padding: "13px",
    boxShadow: "0 8px 20px rgba(88,28,135,0.04)"
  },

  residentActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "18px"
  },

  editButton: {
    flex: 1,
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
    padding: "12px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    flex: 1,
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "12px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed #c4b5fd",
    borderRadius: "28px",
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
      "linear-gradient(135deg,#6d28d9,#a855f7)",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 16px 32px rgba(124,58,237,0.22)"
  },

  modalBackground: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px"
  },

  modal: {
    width: "min(720px, 94vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), #fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 34px 90px rgba(88,28,135,0.30)",
    border: "1px solid rgba(255,255,255,0.55)"
  },

  modalTop: {
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.16),transparent 34%), linear-gradient(135deg,#4c1d95,#7c3aed)",
    color: "white",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: "20px",
    boxShadow: "0 18px 38px rgba(88,28,135,0.18)"
  },

  modalBadge: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
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

  formPanel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    border: "1px solid #ede9fe",
    borderRadius: "26px",
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
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
    background: "#fbfaff",
    color: "#111827",
    boxSizing: "border-box"
  },

  modalActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
    flex: 1,
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6,#a855f7)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 18px 34px rgba(124,58,237,0.28), 0 0 28px rgba(168,85,247,0.18)"
  },

  cancelButton: {
    flex: 1,
    background: "#f5f3ff",
    color: "#4c1d95",
    border: "1px solid #ddd6fe",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Moradores;
