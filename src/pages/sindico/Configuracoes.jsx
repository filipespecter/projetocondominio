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
    corTema: "#16a34a"
  });

  const [preferencias, setPreferencias] = useState({
    nomeSistema: "GreenCondo",
    assinaturaRelatorios: "Síndico / Administração",
    formatoData: "pt-BR",
    notificacoes: true,
    confirmacaoExclusao: true,
    backupAutomatico: false
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

  function lerStorage(chave) {
    try {
      const valor = localStorage.getItem(chave);
      if (!valor) return [];
      return JSON.parse(valor);
    } catch {
      return [];
    }
  }

  function carregarTudo() {
    const dadosConfig = localStorage.getItem("configuracoes");
    const dadosPreferencias = localStorage.getItem("preferenciasSistema");

    if (dadosConfig) {
      setConfig(JSON.parse(dadosConfig));
    }

    if (dadosPreferencias) {
      setPreferencias(JSON.parse(dadosPreferencias));
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
    localStorage.setItem("configuracoes", JSON.stringify(config));
    feedback("Dados do condomínio salvos com sucesso.");
  }

  function salvarPreferencias() {
    localStorage.setItem("preferenciasSistema", JSON.stringify(preferencias));
    feedback("Preferências salvas com sucesso.");
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
            status: u.status === "Ativo" ? "Inativo" : "Ativo"
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
      "preferenciasSistema",
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
      "sugestoesMorador",
      "historico_relatorios_greencondo"
    ];

    const dados = {};

    chaves.forEach((chave) => {
      dados[chave] = lerStorage(chave);
    });

    const backup = {
      sistema: preferencias.nomeSistema || "GreenCondo",
      tipo: "backup-configuracoes",
      geradoEm: new Date().toISOString(),
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
          localStorage.setItem(chave, JSON.stringify(conteudo.dados[chave]));
        });

        carregarTudo();
        feedback("Backup restaurado com sucesso.");
      } catch {
        alert("Erro ao restaurar backup.");
      }
    };

    leitor.readAsText(arquivo);
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>⚙️ Central administrativa</span>

          <h1 style={styles.title}>Configurações</h1>

          <p style={styles.subtitle}>
            Gerencie dados do condomínio, usuários, segurança, backup e
            preferências gerais do sistema.
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
                  onChange={(e) => setConfig({ ...config, corTema: e.target.value })}
                  style={styles.colorInput}
                />

                <strong>{config.corTema}</strong>
              </div>
            </Campo>

            <div style={styles.groupFull}>
              <label style={styles.label}>Endereço</label>

              <input
                value={config.endereco}
                onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
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
                      background: u.status === "Ativo" ? "#dcfce7" : "#fee2e2",
                      color: u.status === "Ativo" ? "#166534" : "#dc2626"
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
              <h2 style={styles.panelTitle}>Credenciais do Síndico Mestre</h2>
            </div>
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
          </div>

          <div style={styles.backupGrid}>
            <div style={styles.backupCard}>
              <h3>💾 Gerar Backup</h3>
              <p>Baixe um arquivo JSON com os principais dados do sistema.</p>

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
              <p>Restaure dados a partir de um arquivo gerado anteriormente.</p>

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
              title="Notificações"
              description="Preparado para alertas futuros do sistema."
              checked={preferencias.notificacoes}
              onChange={(valor) =>
                setPreferencias({ ...preferencias, notificacoes: valor })
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
    color: "#111827"
  },

  hero: {
    background: "linear-gradient(135deg,#ffffff,#f0fdf4)",
    border: "1px solid #dcfce7",
    color: "#111827",
    borderRadius: "28px",
    padding: "34px",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "center",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
    marginBottom: "22px"
  },

  heroBadge: {
    display: "inline-block",
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
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
    border: "1px solid #e5e7eb",
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
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "12px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.06)"
  },

  tab: {
    flex: 1,
    minWidth: "145px",
    background: "#f8fafc",
    color: "#166534",
    border: "1px solid #d1d5db",
    borderRadius: "15px",
    padding: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  activeTab: {
    background: "#16a34a",
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
    borderRadius: "26px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.07)"
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
    color: "#111827",
    fontSize: "26px"
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
    borderRadius: "14px",
    outline: "none",
    fontSize: "14px",
    background: "#ffffff"
  },

  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
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

  primaryButton: {
    background: "#16a34a",
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
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "15px",
    borderRadius: "16px",
    marginBottom: "18px",
    fontWeight: "700"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "14px",
    marginBottom: "18px"
  },

  infoCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    display: "grid",
    gap: "8px"
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
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 12px 28px rgba(15,23,42,0.06)"
  },

  userTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  userAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    background: "#16a34a",
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
    borderRadius: "22px",
    padding: "22px"
  },

  subTitle: {
    marginTop: 0,
    color: "#111827"
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
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: "14px",
    marginTop: "18px"
  },

  toggleCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    cursor: "pointer"
  }
};

export default Configuracoes;