import { confirmDialog } from "../../components/GlobalDialogs.jsx";
import { useEffect, useState } from "react";
import configurationApi from "../../Services/configurationApi.js";
import { applyCondominiumTheme } from "../../utils/condominiumTheme.js";

function Configuracoes() {
  const [abaAtiva, setAbaAtiva] = useState("dados");
  const [salvo, setSalvo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [, setCarregando] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [config, setConfig] = useState({
    nomeCondominio: "", cnpj: "", endereco: "", telefone: "", sindico: "", email: "",
    corTema: "#8b5cf6", tema: { corPrincipal: "#8b5cf6", corSecundaria: "#5b21b6", aplicarTemaPersonalizado: false, logoUrl: "", atualizadoEm: "" },
    logoUrl: "", plano: "Completo", statusComercial: "Ativo", quantidadeUnidades: "", responsavelTecnico: "", observacoesComerciais: ""
  });

  const [preferencias, setPreferencias] = useState({
    nomeSistema: "InfinityCondo", assinaturaRelatorios: "Síndico / Administração", formatoData: "pt-BR",
    notificacoes: true, confirmacaoExclusao: true, backupAutomatico: true,
    notificarReserva: true, notificarEncomenda: true, notificarOcorrencia: true, notificarVisitante: true, notificarSugestao: true, notificarReclamacao: true
  });

  const [whatsappConfig, setWhatsappConfig] = useState({ ativo: false, provider: "Evolution", token: "", numeroEmpresa: "", webhook: "" });
  const [biConfig, setBiConfig] = useState({ periodoPadrao: "30dias", exportacaoAutomatica: false, retencaoHistorico: "12 meses", dashboardExecutivo: true });
  const [segurancaConfig, setSegurancaConfig] = useState({ jwtAtivo: true, tempoSessao: 60, refreshToken: true, loginPorPerfil: true });

  const usuarioInicial = { nome: "", usuario: "", senha: "", perfil: "sub", status: "Ativo" };
  const [usuariosSindico, setUsuariosSindico] = useState([]);
  const [novoUsuario, setNovoUsuario] = useState(usuarioInicial);
  const [editId, setEditId] = useState(null);
  const [credenciaisMestre, setCredenciaisMestre] = useState({ usuario: "", senha: "", confirmarSenha: "" });
  const [ultimoBackup, setUltimoBackup] = useState("Backup operacional gerenciado pelo servidor");

  const isMestre = currentUser?.role === "CONDOMINIUM_ADMIN" || currentUser?.perfil === "mestre";
  const usandoPadrao = false;
  const totalUsuarios = usuariosSindico.length;

  useEffect(() => { carregarTudo(); }, []);

  function feedback(texto) {
    setMensagem(texto); setSalvo(true);
    setTimeout(() => { setSalvo(false); setMensagem(""); }, 3000);
  }

  async function executar(acao, sucesso) {
    try { await acao(); if (sucesso) feedback(sucesso); }
    catch (error) { console.error(error); alert(error?.message || "Não foi possível concluir a operação."); }
  }

  async function carregarTudo() {
    setCarregando(true);
    try {
      const data = await configurationApi.getAll();
      if (data?.condominium) setConfig((prev) => ({ ...prev, ...data.condominium, tema: { ...prev.tema, ...(data.condominium.tema || {}) } }));
      if (data?.preferences) setPreferencias((prev) => ({ ...prev, ...data.preferences }));
      if (data?.whatsapp) setWhatsappConfig((prev) => ({ ...prev, ...data.whatsapp }));
      if (data?.bi) setBiConfig((prev) => ({ ...prev, ...data.bi }));
      if (data?.security) setSegurancaConfig((prev) => ({ ...prev, ...data.security, jwtAtivo: true, refreshToken: true, loginPorPerfil: true }));
      setUsuariosSindico(Array.isArray(data?.users) ? data.users : []);
      setCurrentUser(data?.currentUser || null);
      const master = (data?.users || []).find((u) => u.perfil === "mestre");
      setCredenciaisMestre({ usuario: master?.usuario || data?.currentUser?.usuario || "", senha: "", confirmarSenha: "" });
    } catch (error) {
      console.error(error); alert(error?.message || "Não foi possível carregar as configurações.");
    } finally { setCarregando(false); }
  }

  async function salvarDadosCondominio() {
    await executar(async () => {
      const aplicarTemaPersonalizado = Boolean(config.tema?.aplicarTemaPersonalizado);

      await configurationApi.updateCondominium({
        ...config,
        tema: {
          ...(config.tema || {}),
          corPrincipal: config.corTema,
          aplicarTemaPersonalizado,
          atualizadoEm: new Date().toISOString(),
        },
      });

      applyCondominiumTheme({
        corPrincipal: config.corTema,
        aplicarTemaPersonalizado,
      });

      await carregarTudo();
    }, "Dados do condomínio salvos com sucesso.");
  }

  async function salvarPreferencias() {
    await executar(async () => { await configurationApi.updateSettings("preferences", preferencias); }, "Preferências salvas com sucesso.");
  }

  async function salvarWhatsapp() {
    await executar(async () => { await configurationApi.updateSettings("whatsapp", whatsappConfig); }, "Configurações de WhatsApp salvas com sucesso.");
  }

  async function salvarBI() {
    await executar(async () => { await configurationApi.updateSettings("bi", biConfig); }, "Configurações do BI salvas com sucesso.");
  }

  async function salvarSeguranca() {
    await executar(async () => {
      const updated = await configurationApi.updateSettings("security", { tempoSessao: segurancaConfig.tempoSessao });
      setSegurancaConfig((prev) => ({ ...prev, ...updated, jwtAtivo: true, refreshToken: true, loginPorPerfil: true }));
    }, "Preferência de sessão salva. JWT e refresh token permanecem protegidos pelo servidor.");
  }

  async function salvarUsuarioAdministrativo() {
    if (!isMestre) return alert("Apenas o Síndico Mestre pode gerenciar usuários.");
    if (!novoUsuario.nome || !novoUsuario.usuario || (!editId && !novoUsuario.senha)) return alert("Preencha nome, usuário e senha.");
    if (novoUsuario.senha && novoUsuario.senha.length < 8) return alert("A senha deve possuir pelo menos 8 caracteres.");

    await executar(async () => {
      if (editId) await configurationApi.updateUser(editId, novoUsuario);
      else await configurationApi.createUser(novoUsuario);
      setNovoUsuario(usuarioInicial); setEditId(null); await carregarTudo();
    }, "Usuário salvo com sucesso.");
  }

  function editarUsuario(usuario) {
    if (usuario.perfil === "mestre") { setAbaAtiva("seguranca"); return; }
    setNovoUsuario({ nome: usuario.nome || "", usuario: usuario.usuario || "", senha: "", perfil: "sub", status: usuario.status || "Ativo" });
    setEditId(usuario.id);
  }

  async function excluirUsuario(id) {
    if (!isMestre) return alert("Apenas o Síndico Mestre pode excluir usuários.");
    const usuario = usuariosSindico.find((u) => u.id === id);
    if (usuario?.perfil === "mestre") return alert("O usuário mestre não pode ser excluído.");
    if (!await confirmDialog("Deseja excluir este usuário administrativo?")) return;
    await executar(async () => { await configurationApi.removeUser(id); await carregarTudo(); }, "Usuário excluído com sucesso.");
  }

  async function alterarStatusUsuario(id) {
    if (!isMestre) return alert("Apenas o Síndico Mestre pode alterar status.");
    await executar(async () => { await configurationApi.toggleUser(id); await carregarTudo(); }, "Status atualizado com sucesso.");
  }

  async function alterarCredenciaisMestre() {
    if (!isMestre) return alert("Apenas o Síndico Mestre pode alterar estas credenciais.");
    if (!credenciaisMestre.usuario) return alert("Informe o novo usuário.");
    if (credenciaisMestre.senha && credenciaisMestre.senha.length < 8) return alert("A senha deve possuir pelo menos 8 caracteres.");
    if (credenciaisMestre.senha && credenciaisMestre.senha !== credenciaisMestre.confirmarSenha) return alert("As senhas não conferem.");

    await executar(async () => {
      await configurationApi.updateMasterCredentials({ usuario: credenciaisMestre.usuario, senha: credenciaisMestre.senha || undefined });
      setCredenciaisMestre((prev) => ({ ...prev, senha: "", confirmarSenha: "" }));
      await carregarTudo();
    }, "Credenciais atualizadas com sucesso. No próximo login use o novo usuário.");
  }

  function gerarBackup() {
    if (!isMestre) return alert("Apenas o Síndico Mestre pode exportar configurações.");
    const exportacao = { sistema: "InfinityCondo", tipo: "exportacao-configuracoes", geradoEm: new Date().toISOString(), config, preferencias, whatsappConfig: { ...whatsappConfig, token: whatsappConfig.token ? "[PROTEGIDO]" : "" }, biConfig, segurancaConfig: { tempoSessao: segurancaConfig.tempoSessao } };
    const blob = new Blob([JSON.stringify(exportacao, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `infinitycondo-config-${Date.now()}.json`; link.click(); URL.revokeObjectURL(url);
    const agora = new Date().toLocaleString("pt-BR"); setUltimoBackup(agora); feedback("Exportação das configurações gerada. O backup real do PostgreSQL é feito no servidor.");
  }

  function restaurarBackup(event) {
    event.target.value = "";
    alert("A restauração direta pelo navegador foi desativada. Os dados reais estão no PostgreSQL e a restauração de backup deve ser feita pelo processo seguro do servidor.");
  }

  const temaPersonalizadoAtivo = Boolean(config.tema?.aplicarTemaPersonalizado);
  const corPadraoInfinityCondo = "#7c3aed";
  const corPreview = temaPersonalizadoAtivo ? config.corTema : corPadraoInfinityCondo;

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

            <Campo label="Personalização visual">
              <ToggleCard
                title="Personalizar cores do condomínio"
                description="Ative somente se quiser substituir o roxo padrão do InfinityCondo pela identidade visual deste condomínio."
                checked={temaPersonalizadoAtivo}
                onChange={(checked) =>
                  setConfig((prev) => ({
                    ...prev,
                    tema: {
                      ...(prev.tema || {}),
                      aplicarTemaPersonalizado: checked,
                    },
                  }))
                }
              />

              <div style={{ ...styles.colorSelectorBox, opacity: temaPersonalizadoAtivo ? 1 : 0.55 }}>
                <div style={styles.colorSelectorHeader}>
                  <div>
                    <strong>Cor principal do condomínio</strong>
                    <p style={styles.colorHelp}>
                      {temaPersonalizadoAtivo
                        ? "Escolha a cor e salve os dados do condomínio para aplicá-la aos portais do síndico, porteiro e morador."
                        : "A personalização está desativada. O sistema continuará usando o roxo padrão do InfinityCondo."}
                    </p>
                  </div>

                  <div style={styles.colorRow}>
                    <input
                      type="color"
                      value={config.corTema}
                      disabled={!temaPersonalizadoAtivo}
                      onChange={(e) => {
                        const cor = e.target.value;
                        setConfig((prev) => ({
                          ...prev,
                          corTema: cor,
                          tema: {
                            ...(prev.tema || {}),
                            corPrincipal: cor,
                          },
                        }));
                      }}
                      style={{
                        ...styles.colorInput,
                        cursor: temaPersonalizadoAtivo ? "pointer" : "not-allowed",
                      }}
                    />

                    <strong>{temaPersonalizadoAtivo ? config.corTema : corPadraoInfinityCondo}</strong>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.colorPreview,
                    borderColor: corPreview
                  }}
                >
                  <div
                    style={{
                      ...styles.colorPreviewHeader,
                      background: corPreview
                    }}
                  >
                    Preview do condomínio
                  </div>

                  <div style={styles.colorPreviewBody}>
                    <strong>{config.nomeCondominio || "Nome do condomínio"}</strong>
                    <span>
                      {temaPersonalizadoAtivo
                        ? "Esta cor será aplicada após salvar."
                        : "Usando a identidade roxa padrão do InfinityCondo."}
                    </span>
                  </div>
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
                      background: u.status === "Ativo" ? "var(--ic-primary-soft)" : "#fee2e2",
                      color: u.status === "Ativo" ? "var(--ic-primary)" : "#dc2626"
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

            <Campo label="Sessão autenticada ativa">
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

            <Campo label="Renovação segura de sessão">
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
              <span style={styles.panelBadgeGold}>Integração WhatsApp</span>
              <h2 style={styles.panelTitle}>WhatsApp Business</h2>
            </div>

            <button style={styles.primaryButton} onClick={salvarWhatsapp}>
              Salvar WhatsApp
            </button>
          </div>

          <div style={styles.warningBox}>
            Configure as preferências de comunicação do condomínio pelo WhatsApp.
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
              description="Mantém cópias periódicas conforme a política de backup configurada."
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
    background: "linear-gradient(135deg,#ffffff,var(--ic-primary-soft-3))",
    border: "1px solid var(--ic-primary-soft)",
    color: "#111827",
    borderRadius: "28px",
    padding: "34px",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "center",
    boxShadow: "0 18px 45px rgba(88,28,135,0.09)",
    marginBottom: "22px"
  },

  heroBadge: {
    display: "inline-block",
    background: "var(--ic-primary-soft)",
    border: "1px solid var(--ic-primary-border-soft)",
    color: "var(--ic-primary)",
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
    border: "1px solid var(--ic-primary-border-soft)",
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
    border: "1px solid var(--ic-primary-border-soft)",
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
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border)",
    borderRadius: "15px",
    padding: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  activeTab: {
    background: "var(--ic-primary-light)",
    color: "white",
    border: "1px solid var(--ic-primary-light)"
  },

  success: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    padding: "14px",
    borderRadius: "16px",
    fontWeight: "900",
    marginBottom: "18px"
  },

  panel: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid var(--ic-primary-soft-2)",
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
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
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
    border: "1px solid var(--ic-primary-border)",
    borderRadius: "14px",
    outline: "none",
    fontSize: "14px",
    background: "#ffffff"
  },

  colorSelectorBox: {
    marginTop: "12px",
    display: "grid",
    gap: "14px",
    transition: "opacity .2s ease"
  },

  colorSelectorHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap"
  },

  colorHelp: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: "1.45"
  },

  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border-soft)",
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
    border: "1px solid var(--ic-primary-light)",
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
    background: "var(--ic-primary-soft-3)",
    border: "1px solid var(--ic-primary-border-soft)",
    color: "var(--ic-primary)",
    borderRadius: "12px",
    padding: "10px",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1.4"
  },

  primaryButton: {
    background: "var(--ic-primary-light)",
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
    background: "var(--ic-primary-soft)",
    border: "1px solid var(--ic-primary-border-soft)",
    color: "var(--ic-primary)",
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
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border-soft)",
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
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 12px 28px rgba(88,28,135,0.07)"
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
    background: "var(--ic-primary-light)",
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
    background: "var(--ic-primary-soft-2)",
    color: "var(--ic-primary-strong)",
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
    border: "1px solid var(--ic-primary-border-soft)",
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
    background: "var(--ic-primary-soft-3)",
    border: "1px solid var(--ic-primary-border-soft)",
    color: "var(--ic-primary)",
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
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border-soft)",
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