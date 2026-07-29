import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function Configuracoes() {
  const [abaAtiva, setAbaAtiva] = useState("dados");
  const [salvo, setSalvo] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [config, setConfig] = useState({
    nomeCondominio: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    sindico: "",
    email: "",
    corTema: "#8b5cf6",
    tema: {
      corPrincipal: "#8b5cf6",
      corSecundaria: "#5b21b6",
      aplicarTemaPersonalizado: false,
      logoUrl: "",
      atualizadoEm: ""
    },

    logoUrl: "",
    plano: "Completo",
    statusComercial: "Ativo",
    quantidadeUnidades: "",
    responsavelTecnico: "",
    observacoesComerciais: ""
  });

  const [preferencias, setPreferencias] = useState({
    nomeSistema: "InfinityCondo",
    assinaturaRelatorios: "Síndico / Administração",
    formatoData: "pt-BR",
    notificacoes: true,
    confirmacaoExclusao: true,
    backupAutomatico: false,

    notificarReserva: true,
    notificarEncomenda: true,
    notificarOcorrencia: true,
    notificarVisitante: true,
    notificarSugestao: true,
    notificarReclamacao: true
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    ativo: false,
    provider: "Evolution",
    token: "",
    numeroEmpresa: "",
    webhook: ""
  });

  const [biConfig, setBiConfig] = useState({
    periodoPadrao: "30dias",
    exportacaoAutomatica: false,
    retencaoHistorico: "12 meses",
    dashboardExecutivo: true
  });

  const [segurancaConfig, setSegurancaConfig] = useState({
    jwtAtivo: false,
    tempoSessao: 60,
    refreshToken: true,
    loginPorPerfil: true
  });

  const usuarioLogado = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("usuarioSindico")) ||
        JSON.parse(sessionStorage.getItem("usuarioSindico")) ||
        {}
      );
    } catch {
      return {};
    }
  })();

  const isMestre =
    usuarioLogado.perfilAdmin === "mestre" ||
    usuarioLogado.perfil === "mestre";

  const usuarioInicial = {
    nome: "",
    usuario: "",
    senha: "",
    perfil: "sub",
    status: "Ativo"
  };

  const [usuariosSindico, setUsuariosSindico] = useState([]);
  const [novoUsuario, setNovoUsuario] = useState(usuarioInicial);
  const [editId, setEditId] = useState(null);

  const [credenciaisMestre, setCredenciaisMestre] = useState({
    usuario: "",
    senha: "",
    confirmarSenha: ""
  });

  useEffect(() => {
    carregarTudo();
  }, []);

  function lerStorage(chave) {
    try {
      const valor = localStorage.getItem(chave);
      if (!valor) return [];
      return JSON.parse(valor);
    } catch {
      return [];
    }
  }

  function carregarObjeto(chave, fallback) {
    try {
      const valor = localStorage.getItem(chave);
      return valor ? JSON.parse(valor) : fallback;
    } catch {
      return fallback;
    }
  }

  function registrarConfiguracaoAuditoria(acao, detalhes, depois = null, antes = null) {
    registrarAuditoria({
      acao,
      modulo: "Configurações",
      detalhes,
      antes,
      depois
    });
  }

  function criarNotificacaoConfiguracao(titulo, mensagem, prioridade = "normal") {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Configuração",
      origem: "Configurações",
      perfilDestino: "sindico",
      moduloOrigem: "Configurações",
      prioridade
    });
  }

  function carregarTudo() {
    const dadosConfig = carregarObjeto("configuracoes", null);
    const dadosPerfil = carregarObjeto("perfil_condominio", null);
    const dadosPreferencias = carregarObjeto("preferenciasSistema", null);
    const dadosWhatsapp = carregarObjeto("whatsappConfig", null);
    const dadosBI = carregarObjeto("biConfig", null);
    const dadosSeguranca = carregarObjeto("segurancaConfig", null);

    if (dadosConfig || dadosPerfil) {
      setConfig((prev) => {
        const dadosUnificados = {
          ...prev,
          ...(dadosConfig || {}),
          ...(dadosPerfil || {})
        };

        return {
          ...dadosUnificados,
          plano:
            dadosUnificados.plano === "Básico" ||
            dadosUnificados.plano === "Completo"
              ? dadosUnificados.plano
              : "Completo",
          corTema:
            dadosUnificados.corTema ||
            dadosUnificados.tema?.corPrincipal ||
            "#8b5cf6",
          tema: {
            ...prev.tema,
            ...(dadosUnificados.tema || {}),
            corPrincipal:
              dadosUnificados.tema?.corPrincipal ||
              dadosUnificados.corTema ||
              "#8b5cf6",
            logoUrl:
              dadosUnificados.tema?.logoUrl ||
              dadosUnificados.logoUrl ||
              ""
          }
        };
      });
    }

    if (dadosPreferencias) {
      setPreferencias((prev) => ({
        ...prev,
        ...dadosPreferencias
      }));
    }

    if (dadosWhatsapp) {
      setWhatsappConfig((prev) => ({
        ...prev,
        ...dadosWhatsapp
      }));
    }

    if (dadosBI) {
      setBiConfig((prev) => ({
        ...prev,
        ...dadosBI
      }));
    }

    if (dadosSeguranca) {
      setSegurancaConfig((prev) => ({
        ...prev,
        ...dadosSeguranca
      }));
    }

    let usuarios =
      JSON.parse(localStorage.getItem("usuariosSindico")) || [];

    if (usuarios.length === 0) {
      usuarios = [
        {
          id: Date.now(),
          nome: "Administrador Principal",
          usuario: "admin",
          senha: "1234",
          perfil: "mestre",
          status: "Ativo",
          usuarioPadrao: true,
          criadoEm: new Date().toLocaleString("pt-BR")
        }
      ];

      localStorage.setItem("usuariosSindico", JSON.stringify(usuarios));
    }

    setUsuariosSindico(usuarios);

    const mestreEncontrado = usuarios.find((u) => u.perfil === "mestre");

    if (mestreEncontrado) {
      setCredenciaisMestre({
        usuario: mestreEncontrado.usuario || "",
        senha: "",
        confirmarSenha: ""
      });
    }
  }

  const mestre =
    usuariosSindico.find((u) => u.perfil === "mestre") || {};

  const usandoPadrao =
    mestre.usuario === "admin" &&
    mestre.senha === "1234";

  const ultimoBackup =
    localStorage.getItem("ultimoBackupInfinity") || "Nenhum backup gerado";

  const totalUsuarios = usuariosSindico.length;

  function feedback(texto) {
    setMensagem(texto);
    setSalvo(true);

    setTimeout(() => {
      setSalvo(false);
      setMensagem("");
    }, 3000);
  }

  function salvarDadosCondominio() {
    const agoraISO = new Date().toISOString();
    const agoraBR = new Date().toLocaleString("pt-BR");

    const planoNormalizado =
      config.plano === "Básico" || config.plano === "Completo"
        ? config.plano
        : "Completo";

    const perfilCondominio = {
      ...config,
      condominioId:
        config.condominioId ||
        `cond-${Date.now()}`,
      plano: planoNormalizado,
      corTema: config.corTema || "#8b5cf6",
      tema: {
        ...(config.tema || {}),
        corPrincipal: config.corTema || config.tema?.corPrincipal || "#8b5cf6",
        corSecundaria: config.tema?.corSecundaria || "#5b21b6",
        aplicarTemaPersonalizado:
          Boolean(config.tema?.aplicarTemaPersonalizado),
        logoUrl: config.logoUrl || config.tema?.logoUrl || "",
        atualizadoEm: agoraISO
      },
      recursosPlano: {
        biAnalytics: planoNormalizado === "Completo",
        biMonitor: planoNormalizado === "Completo",
        centralBI: planoNormalizado === "Completo"
      },
      criadoEm: config.criadoEm || agoraISO,
      atualizadoEm: agoraBR,
      atualizadoEmISO: agoraISO,
      origem: "Configuracoes",
      preparadoParaSaaS: true
    };

    setConfig((prev) => ({
      ...prev,
      ...perfilCondominio
    }));

    localStorage.setItem("configuracoes", JSON.stringify(perfilCondominio));
    localStorage.setItem("perfil_condominio", JSON.stringify(perfilCondominio));

    registrarConfiguracaoAuditoria(
      "Atualizou perfil do condomínio",
      `Perfil do condomínio ${config.nomeCondominio || "não informado"} atualizado.`,
      perfilCondominio
    );

    criarNotificacaoConfiguracao(
      "Perfil do condomínio atualizado",
      `Os dados institucionais do condomínio ${config.nomeCondominio || "não informado"} foram atualizados.`
    );

    feedback("Dados do condomínio salvos com sucesso.");
  }

  function salvarPreferencias() {
    localStorage.setItem("preferenciasSistema", JSON.stringify(preferencias));

    registrarConfiguracaoAuditoria(
      "Atualizou preferências do sistema",
      "Preferências gerais do InfinityCondo foram atualizadas.",
      preferencias
    );

    feedback("Preferências salvas com sucesso.");
  }

  function salvarWhatsapp() {
    localStorage.setItem("whatsappConfig", JSON.stringify(whatsappConfig));

    registrarConfiguracaoAuditoria(
      "Atualizou configurações de WhatsApp",
      `Provider configurado: ${whatsappConfig.provider}`,
      whatsappConfig
    );

    feedback("Configurações de WhatsApp salvas com sucesso.");
  }

  function salvarBI() {
    localStorage.setItem("biConfig", JSON.stringify(biConfig));

    registrarConfiguracaoAuditoria(
      "Atualizou configurações do BI",
      `Período padrão do BI: ${biConfig.periodoPadrao}`,
      biConfig
    );

    feedback("Configurações do BI salvas com sucesso.");
  }

  function salvarSeguranca() {
    localStorage.setItem("segurancaConfig", JSON.stringify(segurancaConfig));

    registrarConfiguracaoAuditoria(
      "Atualizou configurações de segurança",
      "Configurações de autenticação e JWT futuro foram atualizadas.",
      segurancaConfig
    );

    criarNotificacaoConfiguracao(
      "Segurança atualizada",
      "As configurações de segurança do sistema foram atualizadas.",
      "alta"
    );

    feedback("Configurações de segurança salvas com sucesso.");
  }

  function salvarUsuarios(lista) {
    setUsuariosSindico(lista);
    localStorage.setItem("usuariosSindico", JSON.stringify(lista));
  }

  function salvarUsuarioAdministrativo() {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode gerenciar usuários.");
      return;
    }

    if (!novoUsuario.nome || !novoUsuario.usuario || !novoUsuario.senha) {
      alert("Preencha nome, usuário e senha.");
      return;
    }

    const usuarioRepetido = usuariosSindico.find(
      (u) =>
        u.usuario?.toLowerCase() === novoUsuario.usuario.toLowerCase() &&
        u.id !== editId
    );

    if (usuarioRepetido) {
      alert("Este usuário já existe.");
      return;
    }

    let listaAtualizada = [];

    if (editId !== null) {
      listaAtualizada = usuariosSindico.map((u) =>
        u.id === editId
          ? {
              ...u,
              ...novoUsuario,
              perfil: u.perfil === "mestre" ? "mestre" : "sub"
            }
          : u
      );
    } else {
      listaAtualizada = [
        {
          id: Date.now(),
          ...novoUsuario,
          perfil: "sub",
          usuarioPadrao: false,
          criadoEm: new Date().toLocaleString("pt-BR")
        },
        ...usuariosSindico
      ];
    }

    salvarUsuarios(listaAtualizada);

    registrarConfiguracaoAuditoria(
      editId ? "Editou usuário administrativo" : "Criou usuário administrativo",
      `${novoUsuario.nome} - ${novoUsuario.usuario}`,
      novoUsuario
    );

    criarNotificacaoConfiguracao(
      editId ? "Usuário administrativo editado" : "Novo usuário administrativo",
      `${novoUsuario.nome} foi ${editId ? "editado" : "criado"} no sistema.`
    );

    setNovoUsuario(usuarioInicial);
    setEditId(null);
    feedback("Usuário salvo com sucesso.");
  }

  function editarUsuario(usuario) {
    if (usuario.perfil === "mestre") {
      setAbaAtiva("seguranca");
      return;
    }

    setNovoUsuario({
      nome: usuario.nome,
      usuario: usuario.usuario,
      senha: usuario.senha,
      perfil: usuario.perfil,
      status: usuario.status
    });

    setEditId(usuario.id);
  }

  function excluirUsuario(id) {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode excluir usuários.");
      return;
    }

    const usuario = usuariosSindico.find((u) => u.id === id);

    if (usuario?.perfil === "mestre") {
      alert("O usuário mestre não pode ser excluído.");
      return;
    }

    const confirmar = window.confirm(
      "Deseja excluir este usuário administrativo?"
    );

    if (!confirmar) return;

    const listaAtualizada = usuariosSindico.filter((u) => u.id !== id);

    salvarUsuarios(listaAtualizada);

    registrarConfiguracaoAuditoria(
      "Excluiu usuário administrativo",
      `${usuario?.nome || "Usuário"} foi excluído.`,
      null,
      usuario
    );

    criarNotificacaoConfiguracao(
      "Usuário administrativo excluído",
      `${usuario?.nome || "Usuário"} foi removido do sistema.`,
      "alta"
    );

    feedback("Usuário excluído com sucesso.");
  }

  function alterarStatusUsuario(id) {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode alterar status.");
      return;
    }

    const usuarioAntes = usuariosSindico.find((u) => u.id === id);

    const listaAtualizada = usuariosSindico.map((u) =>
      u.id === id && u.perfil !== "mestre"
        ? {
            ...u,
            status: u.status === "Ativo" ? "Inativo" : "Ativo"
          }
        : u
    );

    salvarUsuarios(listaAtualizada);

    const usuarioDepois = listaAtualizada.find((u) => u.id === id);

    registrarConfiguracaoAuditoria(
      "Alterou status de usuário administrativo",
      `${usuarioAntes?.nome || "Usuário"} teve o status alterado para ${usuarioDepois?.status}.`,
      usuarioDepois,
      usuarioAntes
    );

    feedback("Status atualizado com sucesso.");
  }

  function alterarCredenciaisMestre() {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode alterar estas credenciais.");
      return;
    }

    if (!credenciaisMestre.usuario) {
      alert("Informe o novo usuário.");
      return;
    }

    if (
      credenciaisMestre.senha &&
      credenciaisMestre.senha !== credenciaisMestre.confirmarSenha
    ) {
      alert("As senhas não conferem.");
      return;
    }

    const mestreAtual = usuariosSindico.find((u) => u.perfil === "mestre");

    if (!mestreAtual) return;

    const usuarioRepetido = usuariosSindico.find(
      (u) =>
        u.usuario?.toLowerCase() === credenciaisMestre.usuario.toLowerCase() &&
        u.id !== mestreAtual.id
    );

    if (usuarioRepetido) {
      alert("Este usuário já está em uso.");
      return;
    }

    const listaAtualizada = usuariosSindico.map((u) =>
      u.id === mestreAtual.id
        ? {
            ...u,
            usuario: credenciaisMestre.usuario,
            senha: credenciaisMestre.senha ? credenciaisMestre.senha : u.senha,
            usuarioPadrao: false,
            ultimaAlteracao: new Date().toLocaleString("pt-BR")
          }
        : u
    );

    salvarUsuarios(listaAtualizada);

    const sessaoAtualizada = {
      ...usuarioLogado,
      usuario: credenciaisMestre.usuario,
      usuarioPadrao: false
    };

    localStorage.setItem("usuarioSindico", JSON.stringify(sessaoAtualizada));
    sessionStorage.setItem("usuarioSindico", JSON.stringify(sessaoAtualizada));
    localStorage.setItem("sessaoSindico", JSON.stringify(sessaoAtualizada));
    sessionStorage.setItem("sessaoSindico", JSON.stringify(sessaoAtualizada));

    registrarConfiguracaoAuditoria(
      "Alterou credenciais do Síndico Mestre",
      "As credenciais principais do sistema foram atualizadas.",
      {
        usuario: credenciaisMestre.usuario,
        senhaAlterada: Boolean(credenciaisMestre.senha)
      }
    );

    criarNotificacaoConfiguracao(
      "Credenciais do Síndico Mestre alteradas",
      "As credenciais principais do sistema foram atualizadas.",
      "alta"
    );

    setCredenciaisMestre({
      usuario: credenciaisMestre.usuario,
      senha: "",
      confirmarSenha: ""
    });

    feedback("Credenciais atualizadas com sucesso.");
  }
    function gerarBackup() {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode gerar backup.");
      return;
    }

    const chaves = [
      "configuracoes",
      "perfil_condominio",
      "preferenciasSistema",
      "whatsappConfig",
      "biConfig",
      "segurancaConfig",

      "usuariosSindico",
      "usuarioSindico",
      "sessaoSindico",
      "usuarioPorteiro",
      "sessaoPorteiro",
      "usuarioMorador",
      "sessaoMorador",

      "moradores",
      "apartamentos",
      "porteiros",
      "visitantes",
      "visitantes_historico",

      "encomendas",
      "encomendas_esperadas",
      "encomendas_historico",

      "reservas",
      "areasComuns",

      "avisos",
      "avisos_sindico",
      "notificacoes",
      "notificacoesMorador",

      "auditoria_logs",
      "auditoriaSistema",

      "ocorrencias",
      "historico_ocorrencias",
      "livro_ocorrencias",

      "sugestoesMorador",
      "sugestoes_reclamacoes",

      "movimentacoes",
      "relatorios_operacionais",
      "historico_relatorios_greencondo",

      "condominio_prestadores",
      "prestadores_particulares_v2",
      "operacional_condominio_v2"
    ];

    const dados = {};

    chaves.forEach((chave) => {
      dados[chave] = lerStorage(chave);
    });

    const backup = {
      sistema: preferencias.nomeSistema || "InfinityCondo",
      tipo: "backup-completo-greencondo",
      versao: "front-localstorage-v2-profissional",
      geradoEm: new Date().toISOString(),
      perfilCondominio: config,
      dados
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-greencondo-${Date.now()}.json`;
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    localStorage.setItem(
      "ultimoBackupInfinity",
      new Date().toLocaleString("pt-BR")
    );

    registrarConfiguracaoAuditoria(
      "Gerou backup completo",
      "Backup completo do sistema foi gerado.",
      {
        totalChaves: chaves.length,
        versao: "front-localstorage-v2-profissional"
      }
    );

    criarNotificacaoConfiguracao(
      "Backup completo gerado",
      "Um backup completo do InfinityCondo foi gerado com sucesso."
    );

    feedback("Backup completo gerado com sucesso.");
  }

  function restaurarBackup(event) {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode restaurar backup.");
      return;
    }

    const arquivo = event.target.files[0];

    if (!arquivo) return;

    const confirmar = window.confirm(
      "Restaurar um backup pode sobrescrever os dados atuais. Deseja continuar?"
    );

    if (!confirmar) return;

    const leitor = new FileReader();

    leitor.onload = function (e) {
      try {
        const conteudo = JSON.parse(e.target.result);

        if (!conteudo.dados) {
          alert("Arquivo de backup inválido.");
          return;
        }

        Object.keys(conteudo.dados).forEach((chave) => {
          localStorage.setItem(chave, JSON.stringify(conteudo.dados[chave]));
        });

        if (conteudo.perfilCondominio) {
          localStorage.setItem(
            "perfil_condominio",
            JSON.stringify(conteudo.perfilCondominio)
          );

          localStorage.setItem(
            "configuracoes",
            JSON.stringify(conteudo.perfilCondominio)
          );
        }

        localStorage.setItem(
          "ultimoBackupInfinity",
          new Date().toLocaleString("pt-BR")
        );

        registrarConfiguracaoAuditoria(
          "Restaurou backup",
          "Backup do sistema foi restaurado.",
          {
            arquivo: arquivo.name,
            restauradoEm: new Date().toLocaleString("pt-BR")
          }
        );

        criarNotificacaoConfiguracao(
          "Backup restaurado",
          "Um backup foi restaurado no InfinityCondo.",
          "alta"
        );

        carregarTudo();
        feedback("Backup restaurado com sucesso. Recarregue o sistema se necessário.");
      } catch {
        alert("Erro ao restaurar backup.");
      }
    };

    leitor.readAsText(arquivo);

    event.target.value = "";
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>⚙️ Central administrativa</span>

          <h1 style={styles.title}>Configurações</h1>

          <p style={styles.subtitle}>
            Gerencie dados do condomínio, usuários, segurança, backup,
            integrações, BI e preferências gerais do sistema.
          </p>
        </div>

        <div style={styles.heroInfo}>
          <div style={styles.heroCard}>
            <span>Perfil atual</span>
            <strong>{isMestre ? "Síndico Mestre" : "Subsíndico"}</strong>
          </div>

          <div style={styles.heroCard}>
            <span>Usuários</span>
            <strong>{totalUsuarios}</strong>
          </div>

          <div style={styles.heroCardGold}>
            <span>Segurança</span>
            <strong>{usandoPadrao ? "Atenção" : "Protegido"}</strong>
          </div>
        </div>
      </section>

      <section style={styles.tabs}>
        {[
          { id: "dados", label: "🏢 Dados" },
          { id: "usuarios", label: "👥 Usuários" },
          { id: "seguranca", label: "🔐 Segurança" },
          { id: "backup", label: "💾 Backup" },
          { id: "whatsapp", label: "📲 WhatsApp" },
          { id: "bi", label: "📊 BI" },
          { id: "preferencias", label: "🎛️ Preferências" }
        ].map((aba) => (
          <button
            key={aba.id}
            style={{
              ...styles.tab,
              ...(abaAtiva === aba.id ? styles.activeTab : {})
            }}
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </section>

      {salvo && <div style={styles.success}>✅ {mensagem}</div>}

      {abaAtiva === "dados" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>Dados institucionais</span>
              <h2 style={styles.panelTitle}>Informações do condomínio</h2>
            </div>

            <button style={styles.primaryButton} onClick={salvarDadosCondominio}>
              Salvar dados
            </button>
          </div>

          <div style={styles.formGrid}>
            <Campo label="Nome do condomínio">
              <input
                value={config.nomeCondominio}
                onChange={(e) =>
                  setConfig({ ...config, nomeCondominio: e.target.value })
                }
                style={styles.input}
              />
            </Campo>

            <Campo label="CNPJ">
              <input
                value={config.cnpj}
                onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                style={styles.input}
              />
            </Campo>

            <Campo label="Nome do síndico">
              <input
                value={config.sindico}
                onChange={(e) => setConfig({ ...config, sindico: e.target.value })}
                style={styles.input}
              />
            </Campo>

            <Campo label="Telefone">
              <input
                value={config.telefone}
                onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                style={styles.input}
              />
            </Campo>

            <Campo label="E-mail">
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                style={styles.input}
              />
            </Campo>

            <Campo label="Cor principal">
              <div style={styles.colorRow}>
                <input
                  type="color"
                  value={config.corTema}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      corTema: e.target.value,
                      tema: {
                        ...(config.tema || {}),
                        corPrincipal: e.target.value,
                        atualizadoEm: new Date().toISOString()
                      }
                    })
                  }
                  style={styles.colorInput}
                />

                <strong>{config.corTema}</strong>
              </div>

              <div
                style={{
                  ...styles.colorPreview,
                  borderColor: config.corTema
                }}
              >
                <div
                  style={{
                    ...styles.colorPreviewHeader,
                    background: config.corTema
                  }}
                >
                  Preview do condomínio
                </div>

                <div style={styles.colorPreviewBody}>
                  <strong>{config.nomeCondominio || "Nome do condomínio"}</strong>
                  <span>
                    Cor salva para uso futuro no backend e tema do cliente.
                  </span>
                </div>
              </div>
            </Campo>

            <Campo label="Logo do condomínio URL">
              <input
                value={config.logoUrl}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    logoUrl: e.target.value,
                    tema: {
                      ...(config.tema || {}),
                      logoUrl: e.target.value,
                      atualizadoEm: new Date().toISOString()
                    }
                  })
                }
                style={styles.input}
                placeholder="https://..."
              />
            </Campo>

            <Campo label="Plano comercial">
              <select
                value={config.plano}
                onChange={(e) => setConfig({ ...config, plano: e.target.value })}
                style={styles.input}
              >
                <option>Básico</option>
                <option>Completo</option>
              </select>

              <div style={styles.planInfo}>
                {config.plano === "Básico"
                  ? "Plano Básico: libera todos os módulos operacionais e bloqueia somente BI Analytics, BI Monitor e Central de BI."
                  : "Plano Completo: libera todos os módulos, incluindo visualizações e central de BI."}
              </div>
            </Campo>

            <Campo label="Status comercial">
              <select
                value={config.statusComercial}
                onChange={(e) =>
                  setConfig({ ...config, statusComercial: e.target.value })
                }
                style={styles.input}
              >
                <option>Ativo</option>
                <option>Teste</option>
                <option>Suspenso</option>
                <option>Cancelado</option>
              </select>
            </Campo>

            <Campo label="Quantidade de unidades">
              <input
                value={config.quantidadeUnidades}
                onChange={(e) =>
                  setConfig({ ...config, quantidadeUnidades: e.target.value })
                }
                style={styles.input}
                placeholder="Ex: 80 apartamentos"
              />
            </Campo>

            <Campo label="Responsável técnico/comercial">
              <input
                value={config.responsavelTecnico}
                onChange={(e) =>
                  setConfig({ ...config, responsavelTecnico: e.target.value })
                }
                style={styles.input}
                placeholder="Ex: Star Infinity Code"
              />
            </Campo>

            <div style={styles.groupFull}>
              <label style={styles.label}>Endereço</label>

              <input
                value={config.endereco}
                onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.groupFull}>
              <label style={styles.label}>Observações comerciais</label>

              <input
                value={config.observacoesComerciais}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    observacoesComerciais: e.target.value
                  })
                }
                style={styles.input}
                placeholder="Ex: Cliente em fase de teste, contrato mensal, implantação inicial..."
              />
            </div>
          </div>
        </section>
      )}

      {abaAtiva === "usuarios" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>Usuários administrativos</span>
              <h2 style={styles.panelTitle}>Síndico Mestre e Subsíndico</h2>
            </div>
          </div>

          {!isMestre && (
            <div style={styles.warningBox}>
              Apenas o Síndico Mestre pode criar, editar ou excluir usuários.
            </div>
          )}

          <div style={styles.userGrid}>
            {usuariosSindico.map((u) => (
              <div key={u.id} style={styles.userCard}>
                <div style={styles.userTop}>
                  <div style={styles.userAvatar}>
                    {u.perfil === "mestre" ? "👑" : "🛡️"}
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      background: u.status === "Ativo" ? "#f3e8ff" : "#fee2e2",
                      color: u.status === "Ativo" ? "#7c3aed" : "#dc2626"
                    }}
                  >
                    {u.status}
                  </span>
                </div>

                <h3 style={styles.userName}>{u.nome}</h3>

                <p style={styles.userText}>
                  Usuário: <strong>{u.usuario}</strong>
                </p>

                <p style={styles.userText}>
                  Perfil:{" "}
                  <strong>
                    {u.perfil === "mestre" ? "Síndico Mestre" : "Subsíndico"}
                  </strong>
                </p>

                <div style={styles.userActions}>
                  <button style={styles.editButton} onClick={() => editarUsuario(u)}>
                    Editar
                  </button>

                  {u.perfil !== "mestre" && (
                    <>
                      <button
                        style={styles.neutralButton}
                        onClick={() => alterarStatusUsuario(u.id)}
                      >
                        Status
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => excluirUsuario(u.id)}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.subPanel}>
            <h3 style={styles.subTitle}>
              {editId ? "Editar Subsíndico" : "Criar Subsíndico"}
            </h3>

            <div style={styles.formGrid}>
              <Campo label="Nome">
                <input
                  value={novoUsuario.nome}
                  onChange={(e) =>
                    setNovoUsuario({ ...novoUsuario, nome: e.target.value })
                  }
                  style={styles.input}
                  disabled={!isMestre}
                />
              </Campo>

              <Campo label="Usuário">
                <input
                  value={novoUsuario.usuario}
                  onChange={(e) =>
                    setNovoUsuario({ ...novoUsuario, usuario: e.target.value })
                  }
                  style={styles.input}
                  disabled={!isMestre}
                />
              </Campo>

              <Campo label="Senha">
                <input
                  value={novoUsuario.senha}
                  onChange={(e) =>
                    setNovoUsuario({ ...novoUsuario, senha: e.target.value })
                  }
                  style={styles.input}
                  disabled={!isMestre}
                />
              </Campo>

              <Campo label="Status">
                <select
                  value={novoUsuario.status}
                  onChange={(e) =>
                    setNovoUsuario({ ...novoUsuario, status: e.target.value })
                  }
                  style={styles.input}
                  disabled={!isMestre}
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </Campo>
            </div>

            <button
              style={styles.primaryButton}
              onClick={salvarUsuarioAdministrativo}
              disabled={!isMestre}
            >
              Salvar Subsíndico
            </button>
          </div>
        </section>
      )}

      {abaAtiva === "seguranca" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadgeGold}>Segurança e senhas</span>
              <h2 style={styles.panelTitle}>Credenciais e autenticação</h2>
            </div>

            <button
              style={styles.primaryButton}
              onClick={salvarSeguranca}
              disabled={!isMestre}
            >
              Salvar segurança
            </button>
          </div>

          {usandoPadrao ? (
            <div style={styles.warningBox}>
              ⚠️ O sistema ainda está usando o acesso padrão{" "}
              <strong>admin / 1234</strong>. Recomendamos alterar.
            </div>
          ) : (
            <div style={styles.safeBox}>🟢 Credenciais personalizadas em uso.</div>
          )}

          <div style={styles.formGrid}>
            <Campo label="Usuário mestre">
              <input
                value={credenciaisMestre.usuario}
                onChange={(e) =>
                  setCredenciaisMestre({
                    ...credenciaisMestre,
                    usuario: e.target.value
                  })
                }
                style={styles.input}
                disabled={!isMestre}
              />
            </Campo>

            <Campo label="Nova senha">
              <input
                type="password"
                value={credenciaisMestre.senha}
                onChange={(e) =>
                  setCredenciaisMestre({
                    ...credenciaisMestre,
                    senha: e.target.value
                  })
                }
                style={styles.input}
                disabled={!isMestre}
              />
            </Campo>

            <Campo label="Confirmar senha">
              <input
                type="password"
                value={credenciaisMestre.confirmarSenha}
                onChange={(e) =>
                  setCredenciaisMestre({
                    ...credenciaisMestre,
                    confirmarSenha: e.target.value
                  })
                }
                style={styles.input}
                disabled={!isMestre}
              />
            </Campo>

            <Campo label="JWT ativo no backend">
              <select
                value={segurancaConfig.jwtAtivo ? "Sim" : "Não"}
                onChange={(e) =>
                  setSegurancaConfig({
                    ...segurancaConfig,
                    jwtAtivo: e.target.value === "Sim"
                  })
                }
                style={styles.input}
                disabled={!isMestre}
              >
                <option>Não</option>
                <option>Sim</option>
              </select>
            </Campo>

            <Campo label="Tempo de sessão em minutos">
              <input
                type="number"
                value={segurancaConfig.tempoSessao}
                onChange={(e) =>
                  setSegurancaConfig({
                    ...segurancaConfig,
                    tempoSessao: Number(e.target.value)
                  })
                }
                style={styles.input}
                disabled={!isMestre}
              />
            </Campo>

            <Campo label="Refresh token futuro">
              <select
                value={segurancaConfig.refreshToken ? "Ativo" : "Inativo"}
                onChange={(e) =>
                  setSegurancaConfig({
                    ...segurancaConfig,
                    refreshToken: e.target.value === "Ativo"
                  })
                }
                style={styles.input}
                disabled={!isMestre}
              >
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </Campo>
          </div>

          <button
            style={styles.primaryButton}
            onClick={alterarCredenciaisMestre}
            disabled={!isMestre}
          >
            Atualizar credenciais
          </button>
        </section>
      )}
            {abaAtiva === "backup" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>Backup e restauração</span>
              <h2 style={styles.panelTitle}>Proteção dos dados locais</h2>
            </div>
          </div>

          <div style={styles.infoGrid}>
            <InfoCard title="Último backup" value={ultimoBackup} />
            <InfoCard title="Permissão" value={isMestre ? "Liberado" : "Restrito"} />
            <InfoCard title="Tipo" value="Backup completo" />
          </div>

          <div style={styles.backupGrid}>
            <div style={styles.backupCard}>
              <h3>💾 Gerar Backup Completo</h3>
              <p>
                Baixe um arquivo JSON com configurações, usuários,
                avisos, reservas, visitantes, encomendas, BI,
                relatórios, notificações, auditoria e históricos.
              </p>

              <button
                style={styles.primaryButton}
                onClick={gerarBackup}
                disabled={!isMestre}
              >
                Gerar backup
              </button>
            </div>

            <div style={styles.backupCardGold}>
              <h3>♻️ Restaurar Backup</h3>
              <p>
                Restaure dados a partir de um arquivo gerado anteriormente.
                Esta ação sobrescreve os dados atuais.
              </p>

              <label style={styles.restoreButton}>
                Selecionar arquivo
                <input
                  type="file"
                  accept=".json"
                  onChange={restaurarBackup}
                  style={{ display: "none" }}
                  disabled={!isMestre}
                />
              </label>
            </div>
          </div>
        </section>
      )}

      {abaAtiva === "whatsapp" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadgeGold}>Integração futura</span>
              <h2 style={styles.panelTitle}>WhatsApp Business</h2>
            </div>

            <button style={styles.primaryButton} onClick={salvarWhatsapp}>
              Salvar WhatsApp
            </button>
          </div>

          <div style={styles.warningBox}>
            Esta área prepara o front para integração futura com API de WhatsApp.
            O envio real só funcionará após conexão com backend.
          </div>

          <div style={styles.formGrid}>
            <Campo label="Integração ativa">
              <select
                value={whatsappConfig.ativo ? "Sim" : "Não"}
                onChange={(e) =>
                  setWhatsappConfig({
                    ...whatsappConfig,
                    ativo: e.target.value === "Sim"
                  })
                }
                style={styles.input}
              >
                <option>Não</option>
                <option>Sim</option>
              </select>
            </Campo>

            <Campo label="Provider">
              <select
                value={whatsappConfig.provider}
                onChange={(e) =>
                  setWhatsappConfig({
                    ...whatsappConfig,
                    provider: e.target.value
                  })
                }
                style={styles.input}
              >
                <option>Evolution</option>
                <option>Meta Cloud API</option>
                <option>Z-API</option>
                <option>Outro</option>
              </select>
            </Campo>

            <Campo label="Número da empresa">
              <input
                value={whatsappConfig.numeroEmpresa}
                onChange={(e) =>
                  setWhatsappConfig({
                    ...whatsappConfig,
                    numeroEmpresa: e.target.value
                  })
                }
                style={styles.input}
              />
            </Campo>

            <Campo label="Token / API Key">
              <input
                value={whatsappConfig.token}
                onChange={(e) =>
                  setWhatsappConfig({
                    ...whatsappConfig,
                    token: e.target.value
                  })
                }
                style={styles.input}
              />
            </Campo>

            <div style={styles.groupFull}>
              <label style={styles.label}>Webhook</label>

              <input
                value={whatsappConfig.webhook}
                onChange={(e) =>
                  setWhatsappConfig({
                    ...whatsappConfig,
                    webhook: e.target.value
                  })
                }
                style={styles.input}
              />
            </div>
          </div>
        </section>
      )}

      {abaAtiva === "bi" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>BI Analytics</span>
              <h2 style={styles.panelTitle}>Configurações do BI</h2>
            </div>

            <button style={styles.primaryButton} onClick={salvarBI}>
              Salvar BI
            </button>
          </div>

          <div style={styles.formGrid}>
            <Campo label="Período padrão">
              <select
                value={biConfig.periodoPadrao}
                onChange={(e) =>
                  setBiConfig({
                    ...biConfig,
                    periodoPadrao: e.target.value
                  })
                }
                style={styles.input}
              >
                <option value="geral">Geral</option>
                <option value="hoje">Hoje</option>
                <option value="7dias">7 dias</option>
                <option value="30dias">30 dias</option>
                <option value="mes">Mês</option>
                <option value="ano">Ano</option>
              </select>
            </Campo>

            <Campo label="Retenção de histórico">
              <select
                value={biConfig.retencaoHistorico}
                onChange={(e) =>
                  setBiConfig({
                    ...biConfig,
                    retencaoHistorico: e.target.value
                  })
                }
                style={styles.input}
              >
                <option>3 meses</option>
                <option>6 meses</option>
                <option>12 meses</option>
                <option>24 meses</option>
                <option>Permanente</option>
              </select>
            </Campo>

            <Campo label="Dashboard executivo">
              <select
                value={biConfig.dashboardExecutivo ? "Ativo" : "Inativo"}
                onChange={(e) =>
                  setBiConfig({
                    ...biConfig,
                    dashboardExecutivo: e.target.value === "Ativo"
                  })
                }
                style={styles.input}
              >
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </Campo>

            <Campo label="Exportação automática">
              <select
                value={biConfig.exportacaoAutomatica ? "Ativa" : "Inativa"}
                onChange={(e) =>
                  setBiConfig({
                    ...biConfig,
                    exportacaoAutomatica: e.target.value === "Ativa"
                  })
                }
                style={styles.input}
              >
                <option>Inativa</option>
                <option>Ativa</option>
              </select>
            </Campo>
          </div>
        </section>
      )}

      {abaAtiva === "preferencias" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>Preferências</span>
              <h2 style={styles.panelTitle}>Comportamento do sistema</h2>
            </div>

            <button style={styles.primaryButton} onClick={salvarPreferencias}>
              Salvar preferências
            </button>
          </div>

          <div style={styles.formGrid}>
            <Campo label="Nome do sistema">
              <input
                value={preferencias.nomeSistema}
                onChange={(e) =>
                  setPreferencias({
                    ...preferencias,
                    nomeSistema: e.target.value
                  })
                }
                style={styles.input}
              />
            </Campo>

            <Campo label="Assinatura padrão dos relatórios">
              <input
                value={preferencias.assinaturaRelatorios}
                onChange={(e) =>
                  setPreferencias({
                    ...preferencias,
                    assinaturaRelatorios: e.target.value
                  })
                }
                style={styles.input}
              />
            </Campo>

            <Campo label="Formato de data">
              <select
                value={preferencias.formatoData}
                onChange={(e) =>
                  setPreferencias({
                    ...preferencias,
                    formatoData: e.target.value
                  })
                }
                style={styles.input}
              >
                <option value="pt-BR">Brasil</option>
                <option value="en-US">Estados Unidos</option>
              </select>
            </Campo>
          </div>

          <div style={styles.preferenceGrid}>
            <ToggleCard
              title="Notificações gerais"
              description="Ativa alertas internos do sistema."
              checked={preferencias.notificacoes}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, notificacoes: valor })
              }
            />

            <ToggleCard
              title="Notificar reservas"
              description="Registra alertas sobre reservas dos moradores."
              checked={preferencias.notificarReserva}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, notificarReserva: valor })
              }
            />

            <ToggleCard
              title="Notificar encomendas"
              description="Prepara avisos de encomendas para sistema e WhatsApp."
              checked={preferencias.notificarEncomenda}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, notificarEncomenda: valor })
              }
            />

            <ToggleCard
              title="Notificar ocorrências"
              description="Alertas de ocorrências registradas pela portaria."
              checked={preferencias.notificarOcorrencia}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, notificarOcorrencia: valor })
              }
            />

            <ToggleCard
              title="Notificar visitantes"
              description="Alertas sobre entrada, autorização e saída de visitantes."
              checked={preferencias.notificarVisitante}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, notificarVisitante: valor })
              }
            />

            <ToggleCard
              title="Notificar sugestões"
              description="Alertas de sugestões e reclamações enviadas por moradores."
              checked={preferencias.notificarSugestao}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, notificarSugestao: valor })
              }
            />

            <ToggleCard
              title="Confirmar exclusões"
              description="Exibe confirmação antes de apagar registros."
              checked={preferencias.confirmacaoExclusao}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, confirmacaoExclusao: valor })
              }
            />

            <ToggleCard
              title="Backup automático"
              description="Reservado para uso futuro com backend."
              checked={preferencias.backupAutomatico}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, backupAutomatico: valor })
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div style={styles.group}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div style={styles.infoCard}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ToggleCard({ title, description, checked, onChange }) {
  return (
    <label style={styles.toggleCard}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
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
    background: "linear-gradient(135deg,#ffffff,#faf5ff)",
    border: "1px solid #f3e8ff",
    color: "#111827",
    borderRadius: "28px",
    padding: "34px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "center",
    boxShadow: "0 18px 45px rgba(88,28,135,0.09)",
    marginBottom: "22px"
  },

  heroBadge: {
    display: "inline-block",
    background: "#f3e8ff",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "14px"
  },

  title: {
    margin: 0,
    fontSize: "42px",
    letterSpacing: "-1px",
    color: "#111827"
  },

  subtitle: {
    color: "#6b7280",
    maxWidth: "760px",
    lineHeight: "1.6"
  },

  heroInfo: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },

  heroCard: {
    minWidth: "150px",
    background: "#ffffff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "16px"
  },

  heroCardGold: {
    minWidth: "150px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    borderRadius: "18px",
    padding: "16px"
  },

  tabs: {
    background: "white",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "12px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
    boxShadow: "0 14px 35px rgba(88,28,135,0.07)"
  },

  tab: {
    flex: 1,
    minWidth: "145px",
    background: "#fbfaff",
    color: "#7c3aed",
    border: "1px solid #c4b5fd",
    borderRadius: "15px",
    padding: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  activeTab: {
    background: "#8b5cf6",
    color: "white",
    border: "1px solid #8b5cf6"
  },

  success: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "14px",
    borderRadius: "16px",
    fontWeight: "900",
    marginBottom: "18px"
  },

  panel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ede9fe",
    borderRadius: "26px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(88,28,135,0.08)"
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "22px",
    flexWrap: "wrap"
  },

  panelBadge: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  panelBadgeGold: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "#111827",
    fontSize: "26px"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(240px,100%),1fr))",
    gap: "16px"
  },

  group: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  groupFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  label: {
    color: "#374151",
    fontSize: "13px",
    fontWeight: "900"
  },

  input: {
    padding: "14px",
    border: "1px solid #c4b5fd",
    borderRadius: "14px",
    outline: "none",
    fontSize: "14px",
    background: "#ffffff"
  },

  colorRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "12px",
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "14px",
    padding: "10px"
  },

  colorInput: {
    width: "64px",
    height: "44px",
    border: "none",
    background: "none",
    cursor: "pointer"
  },

  colorPreview: {
    marginTop: "10px",
    border: "1px solid #8b5cf6",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#ffffff"
  },

  colorPreviewHeader: {
    color: "white",
    padding: "12px",
    fontWeight: "900",
    fontSize: "13px"
  },

  colorPreviewBody: {
    padding: "12px",
    display: "grid",
    gap: "6px",
    color: "#374151",
    fontSize: "13px"
  },

  planInfo: {
    marginTop: "8px",
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
    borderRadius: "12px",
    padding: "10px",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1.4"
  },

  primaryButton: {
    background: "#8b5cf6",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  warningBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "15px",
    borderRadius: "16px",
    marginBottom: "18px",
    fontWeight: "700"
  },

  safeBox: {
    background: "#f3e8ff",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
    padding: "15px",
    borderRadius: "16px",
    marginBottom: "18px",
    fontWeight: "700"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(220px,100%),1fr))",
    gap: "14px",
    marginBottom: "18px"
  },

  infoCard: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "18px",
    display: "grid",
    gap: "8px"
  },

  userGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))",
    gap: "16px",
    marginBottom: "24px"
  },

  userCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ede9fe",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 12px 28px rgba(88,28,135,0.07)"
  },

  userTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center"
  },

  userAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    background: "#8b5cf6",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px"
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  userName: {
    margin: "16px 0 8px",
    color: "#111827"
  },

  userText: {
    margin: "6px 0",
    color: "#6b7280"
  },

  userActions: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
    flexWrap: "wrap"
  },

  editButton: {
    background: "#ede9fe",
    color: "#6d28d9",
    border: "none",
    padding: "10px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "900"
  },

  neutralButton: {
    background: "#fef3c7",
    color: "#92400e",
    border: "none",
    padding: "10px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "10px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "900"
  },

  subPanel: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "22px",
    padding: "22px"
  },

  subTitle: {
    marginTop: 0,
    color: "#111827"
  },

  backupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))",
    gap: "18px"
  },

  backupCard: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
    borderRadius: "22px",
    padding: "22px"
  },

  backupCardGold: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    borderRadius: "22px",
    padding: "22px"
  },

  restoreButton: {
    display: "inline-block",
    background: "#f59e0b",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900",
    marginTop: "18px"
  },

  preferenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
    gap: "14px",
    marginTop: "18px"
  },

  toggleCard: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    cursor: "pointer"
  }
};

export default Configuracoes;