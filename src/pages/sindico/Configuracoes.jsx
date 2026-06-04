import { useEffect, useState } from "react";

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
    corTema: "#14532d"
  });

  const usuarioLogado =
    JSON.parse(localStorage.getItem("usuarioSindico")) ||
    JSON.parse(sessionStorage.getItem("usuarioSindico")) ||
    {};

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

  function carregarTudo() {
    const dadosConfig = localStorage.getItem("configuracoes");

    if (dadosConfig) {
      setConfig(JSON.parse(dadosConfig));
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

      localStorage.setItem(
        "usuariosSindico",
        JSON.stringify(usuarios)
      );
    }

    setUsuariosSindico(usuarios);

    const mestre = usuarios.find(
      (u) => u.perfil === "mestre"
    );

    if (mestre) {
      setCredenciaisMestre({
        usuario: mestre.usuario || "",
        senha: "",
        confirmarSenha: ""
      });
    }
  }

  function feedback(texto) {
    setMensagem(texto);
    setSalvo(true);

    setTimeout(() => {
      setSalvo(false);
      setMensagem("");
    }, 3000);
  }

  function salvarDadosCondominio() {
    localStorage.setItem(
      "configuracoes",
      JSON.stringify(config)
    );

    feedback("Configurações do condomínio salvas com sucesso.");
  }

  function salvarUsuarios(lista) {
    setUsuariosSindico(lista);

    localStorage.setItem(
      "usuariosSindico",
      JSON.stringify(lista)
    );
  }

  function salvarUsuarioAdministrativo() {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode gerenciar usuários.");
      return;
    }

    if (
      !novoUsuario.nome ||
      !novoUsuario.usuario ||
      !novoUsuario.senha
    ) {
      alert("Preencha nome, usuário e senha.");
      return;
    }

    const usuarioRepetido = usuariosSindico.find(
      (u) =>
        u.usuario?.toLowerCase() ===
          novoUsuario.usuario.toLowerCase() &&
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

    setNovoUsuario(usuarioInicial);
    setEditId(null);

    feedback("Usuário administrativo salvo com sucesso.");
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

    const listaAtualizada = usuariosSindico.filter(
      (u) => u.id !== id
    );

    salvarUsuarios(listaAtualizada);
    feedback("Usuário excluído com sucesso.");
  }

  function alterarStatusUsuario(id) {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode alterar status.");
      return;
    }

    const listaAtualizada = usuariosSindico.map((u) =>
      u.id === id && u.perfil !== "mestre"
        ? {
            ...u,
            status:
              u.status === "Ativo"
                ? "Inativo"
                : "Ativo"
          }
        : u
    );

    salvarUsuarios(listaAtualizada);
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

    const mestre = usuariosSindico.find(
      (u) => u.perfil === "mestre"
    );

    if (!mestre) return;

    const usuarioRepetido = usuariosSindico.find(
      (u) =>
        u.usuario?.toLowerCase() ===
          credenciaisMestre.usuario.toLowerCase() &&
        u.id !== mestre.id
    );

    if (usuarioRepetido) {
      alert("Este usuário já está em uso.");
      return;
    }

    const listaAtualizada = usuariosSindico.map((u) =>
      u.id === mestre.id
        ? {
            ...u,
            usuario: credenciaisMestre.usuario,
            senha: credenciaisMestre.senha
              ? credenciaisMestre.senha
              : u.senha,
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

    localStorage.setItem(
      "usuarioSindico",
      JSON.stringify(sessaoAtualizada)
    );

    sessionStorage.setItem(
      "usuarioSindico",
      JSON.stringify(sessaoAtualizada)
    );

    localStorage.setItem(
      "sessaoSindico",
      JSON.stringify(sessaoAtualizada)
    );

    sessionStorage.setItem(
      "sessaoSindico",
      JSON.stringify(sessaoAtualizada)
    );

    setCredenciaisMestre({
      usuario: credenciaisMestre.usuario,
      senha: "",
      confirmarSenha: ""
    });

    feedback("Credenciais do Síndico Mestre atualizadas com sucesso.");
  }

  function gerarBackup() {
    if (!isMestre) {
      alert("Apenas o Síndico Mestre pode gerar backup.");
      return;
    }

    const chaves = [
      "configuracoes",
      "usuariosSindico",
      "moradores",
      "apartamentos",
      "porteiros",
      "visitantes",
      "encomendas",
      "reservas",
      "areasComuns",
      "avisos",
      "condominio_prestadores",
      "prestadores_particulares_v2",
      "operacional_condominio_v2",
      "ocorrencias",
      "sugestoesMorador"
    ];

    const dados = {};

    chaves.forEach((chave) => {
      dados[chave] =
        JSON.parse(localStorage.getItem(chave)) || [];
    });

    const backup = {
      sistema: "Infinity Condo",
      tipo: "backup-configuracoes",
      geradoEm: new Date().toISOString(),
      dados
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-infinity-condo-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);

    localStorage.setItem(
      "ultimoBackupInfinity",
      new Date().toLocaleString("pt-BR")
    );

    feedback("Backup gerado com sucesso.");
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
          localStorage.setItem(
            chave,
            JSON.stringify(conteudo.dados[chave])
          );
        });

        carregarTudo();
        feedback("Backup restaurado com sucesso.");
      } catch (error) {
        alert("Erro ao restaurar backup.");
      }
    };

    leitor.readAsText(arquivo);
  }

  const mestre =
    usuariosSindico.find((u) => u.perfil === "mestre") || {};

  const usandoPadrao =
    mestre.usuario === "admin" &&
    mestre.senha === "1234";

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            ⚙️ Central administrativa
          </span>

          <h1 style={styles.title}>
            Configurações
          </h1>

          <p style={styles.subtitle}>
            Gerencie dados do condomínio, usuários administrativos,
            segurança, senhas e backups do Infinity Condo.
          </p>
        </div>

        <div style={styles.heroInfo}>
          <div style={styles.heroCard}>
            <span>Perfil atual</span>
            <strong>
              {isMestre ? "Síndico Mestre" : "Subsíndico"}
            </strong>
          </div>

          <div style={styles.heroCardGold}>
            <span>Segurança</span>
            <strong>
              {usandoPadrao ? "Atenção" : "Protegido"}
            </strong>
          </div>
        </div>
      </section>

      <section style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "dados" ? styles.activeTab : {})
          }}
          onClick={() => setAbaAtiva("dados")}
        >
          🏢 Dados
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "usuarios" ? styles.activeTab : {})
          }}
          onClick={() => setAbaAtiva("usuarios")}
        >
          👥 Usuários
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "seguranca" ? styles.activeTab : {})
          }}
          onClick={() => setAbaAtiva("seguranca")}
        >
          🔐 Segurança
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "backup" ? styles.activeTab : {})
          }}
          onClick={() => setAbaAtiva("backup")}
        >
          💾 Backup
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "futuro" ? styles.activeTab : {})
          }}
          onClick={() => setAbaAtiva("futuro")}
        >
          🚀 Futuro
        </button>
      </section>

      {salvo && (
        <div style={styles.success}>
          ✅ {mensagem}
        </div>
      )}

      {abaAtiva === "dados" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>
                Dados institucionais
              </span>

              <h2 style={styles.panelTitle}>
                Informações do condomínio
              </h2>
            </div>

            <button
              style={styles.primaryButton}
              onClick={salvarDadosCondominio}
            >
              Salvar dados
            </button>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.group}>
              <label style={styles.label}>
                Nome do condomínio
              </label>

              <input
                value={config.nomeCondominio}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    nomeCondominio: e.target.value
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>
                CNPJ
              </label>

              <input
                value={config.cnpj}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cnpj: e.target.value
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>
                Nome do síndico
              </label>

              <input
                value={config.sindico}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sindico: e.target.value
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>
                Telefone
              </label>

              <input
                value={config.telefone}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    telefone: e.target.value
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>
                E-mail
              </label>

              <input
                type="email"
                value={config.email}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    email: e.target.value
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>
                Cor principal
              </label>

              <div style={styles.colorRow}>
                <input
                  type="color"
                  value={config.corTema}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      corTema: e.target.value
                    })
                  }
                  style={styles.colorInput}
                />

                <strong>{config.corTema}</strong>
              </div>
            </div>

            <div style={styles.groupFull}>
              <label style={styles.label}>
                Endereço
              </label>

              <input
                value={config.endereco}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco: e.target.value
                  })
                }
                style={styles.input}
              />
            </div>
          </div>
        </section>
      )}

      {abaAtiva === "usuarios" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>
                Usuários administrativos
              </span>

              <h2 style={styles.panelTitle}>
                Síndico Mestre e Subsíndico
              </h2>
            </div>
          </div>

          {!isMestre && (
            <div style={styles.warningBox}>
              Você está logado como Subsíndico. Apenas o Síndico Mestre
              pode criar, editar ou excluir usuários administrativos.
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
                      background:
                        u.status === "Ativo"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        u.status === "Ativo"
                          ? "#166534"
                          : "#dc2626"
                    }}
                  >
                    {u.status}
                  </span>
                </div>

                <h3 style={styles.userName}>
                  {u.nome}
                </h3>

                <p style={styles.userText}>
                  Usuário: <strong>{u.usuario}</strong>
                </p>

                <p style={styles.userText}>
                  Perfil:{" "}
                  <strong>
                    {u.perfil === "mestre"
                      ? "Síndico Mestre"
                      : "Subsíndico"}
                  </strong>
                </p>

                <div style={styles.userActions}>
                  <button
                    style={styles.editButton}
                    onClick={() => editarUsuario(u)}
                  >
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
              <div style={styles.group}>
                <label style={styles.label}>Nome</label>

                <input
                  value={novoUsuario.nome}
                  onChange={(e) =>
                    setNovoUsuario({
                      ...novoUsuario,
                      nome: e.target.value
                    })
                  }
                  style={styles.input}
                  disabled={!isMestre}
                />
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Usuário</label>

                <input
                  value={novoUsuario.usuario}
                  onChange={(e) =>
                    setNovoUsuario({
                      ...novoUsuario,
                      usuario: e.target.value
                    })
                  }
                  style={styles.input}
                  disabled={!isMestre}
                />
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Senha</label>

                <input
                  value={novoUsuario.senha}
                  onChange={(e) =>
                    setNovoUsuario({
                      ...novoUsuario,
                      senha: e.target.value
                    })
                  }
                  style={styles.input}
                  disabled={!isMestre}
                />
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Status</label>

                <select
                  value={novoUsuario.status}
                  onChange={(e) =>
                    setNovoUsuario({
                      ...novoUsuario,
                      status: e.target.value
                    })
                  }
                  style={styles.input}
                  disabled={!isMestre}
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>
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
              <span style={styles.panelBadgeGold}>
                Segurança e senhas
              </span>

              <h2 style={styles.panelTitle}>
                Credenciais do Síndico Mestre
              </h2>
            </div>
          </div>

          {usandoPadrao ? (
            <div style={styles.warningBox}>
              ⚠️ O sistema ainda está usando o acesso padrão
              <strong> admin / 1234</strong>. Recomendamos alterar.
            </div>
          ) : (
            <div style={styles.safeBox}>
              🟢 Credenciais personalizadas em uso. O aviso do login
              não será mais exibido.
            </div>
          )}

          <div style={styles.formGrid}>
            <div style={styles.group}>
              <label style={styles.label}>
                Usuário mestre
              </label>

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
            </div>

            <div style={styles.group}>
              <label style={styles.label}>
                Nova senha
              </label>

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
            </div>

            <div style={styles.group}>
              <label style={styles.label}>
                Confirmar senha
              </label>

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
            </div>
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
              <span style={styles.panelBadge}>
                Backup e restauração
              </span>

              <h2 style={styles.panelTitle}>
                Proteção dos dados locais
              </h2>
            </div>
          </div>

          <div style={styles.backupGrid}>
            <div style={styles.backupCard}>
              <h3>💾 Gerar Backup</h3>

              <p>
                Baixe um arquivo JSON com os principais dados do sistema.
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

          {!isMestre && (
            <div style={styles.warningBox}>
              Apenas o Síndico Mestre pode gerar ou restaurar backups.
            </div>
          )}
        </section>
      )}

      {abaAtiva === "futuro" && (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadgeGold}>
                Próximas áreas
              </span>

              <h2 style={styles.panelTitle}>
                Preparado para evolução
              </h2>
            </div>
          </div>

          <div style={styles.futureGrid}>
            <div style={styles.futureCard}>📊 Preferências BI</div>
            <div style={styles.futureCard}>🔔 Notificações</div>
            <div style={styles.futureCard}>📜 Auditoria</div>
            <div style={styles.futureCard}>🎨 Aparência</div>
            <div style={styles.futureCard}>📄 Plano e licença</div>
            <div style={styles.futureCard}>🌐 Integrações</div>
          </div>
        </section>
      )}
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
      "radial-gradient(circle at top right,rgba(250,204,21,0.20),transparent 34%), linear-gradient(135deg,#020617,#052e16 55%,#064e3b)",
    color: "white",
    borderRadius: "38px",
    padding: "34px",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "center",
    boxShadow: "0 28px 80px rgba(5,46,22,0.32)",
    marginBottom: "22px"
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(34,197,94,0.14)",
    border: "1px solid rgba(34,197,94,0.30)",
    color: "#bbf7d0",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "14px"
  },

  title: {
    margin: 0,
    fontSize: "42px",
    letterSpacing: "-1px"
  },

  subtitle: {
    color: "rgba(255,255,255,0.72)",
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
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "20px",
    padding: "16px"
  },

  heroCardGold: {
    minWidth: "150px",
    background: "rgba(250,204,21,0.14)",
    border: "1px solid rgba(250,204,21,0.30)",
    color: "#fef3c7",
    borderRadius: "20px",
    padding: "16px"
  },

  tabs: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "12px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.06)"
  },

  tab: {
    flex: 1,
    minWidth: "150px",
    background: "#f8fafc",
    color: "#166534",
    border: "1px solid #d1d5db",
    borderRadius: "17px",
    padding: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  activeTab: {
    background: "linear-gradient(135deg,#064e3b,#16a34a)",
    color: "white",
    border: "1px solid #16a34a"
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "14px",
    borderRadius: "16px",
    fontWeight: "900",
    marginBottom: "18px"
  },

  panel: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(15,23,42,0.08)"
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "22px"
  },

  panelBadge: {
    background: "#dcfce7",
    color: "#166534",
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
    color: "#052e16",
    fontSize: "28px"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
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
    border: "1px solid #d1d5db",
    borderRadius: "15px",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb"
  },

  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  colorInput: {
    width: "64px",
    height: "44px",
    border: "none",
    background: "none",
    cursor: "pointer"
  },

  primaryButton: {
    background: "linear-gradient(135deg,#064e3b,#16a34a)",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900",
    marginTop: "18px"
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
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "15px",
    borderRadius: "16px",
    marginBottom: "18px",
    fontWeight: "700"
  },

  userGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: "16px",
    marginBottom: "24px"
  },

  userCard: {
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    border: "1px solid #eef2f7",
    borderRadius: "26px",
    padding: "20px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)"
  },

  userTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  userAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#052e16,#16a34a)",
    color: "white",
    display: "flex",
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
    background: "#dbeafe",
    color: "#1d4ed8",
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
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "26px",
    padding: "22px"
  },

  subTitle: {
    marginTop: 0,
    color: "#052e16"
  },

  backupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: "18px"
  },

  backupCard: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "24px",
    padding: "22px"
  },

  backupCardGold: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    borderRadius: "24px",
    padding: "22px"
  },

  restoreButton: {
    display: "inline-block",
    background: "linear-gradient(135deg,#92400e,#facc15)",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900",
    marginTop: "18px"
  },

  futureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "14px"
  },

  futureCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "18px",
    color: "#052e16",
    fontWeight: "900"
  }
};

export default Configuracoes;