import { useParams, useNavigate } from "react-router-dom";

import {
  FaShieldAlt,
  FaIdBadge,
  FaUserCircle,
  FaArrowLeft,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaKey,
} from "react-icons/fa";

import { useState } from "react";


import authApi, {
  roleParaTipoFrontend,
  tipoFrontendAceitaRole,
} from "../Services/authApi.js";

/**
 * =====================================================
 * LOGIN - INFINITYCONDO
 * =====================================================
 *
 * REGRAS IMPORTANTES DESTA VERSÃO:
 *
 * 1. NÃO alterar o design aprovado.
 * 2. NÃO alterar a responsividade.
 * 3. NÃO remover funcionalidades visuais existentes.
 * 4. Substituir somente a autenticação local pela API.
 * 5. Manter compatibilidade temporária com as chaves
 *    antigas de sessão enquanto o restante do frontend
 *    é migrado módulo por módulo.
 */
function Login() {
  const { tipo } = useParams();
  const navigate = useNavigate();

  /**
   * =====================================================
   * ESTADOS DA TELA
   * =====================================================
   */
  const [usuario, setUsuario] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [avisoPadrao, setAvisoPadrao] =
    useState(null);

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    recuperarSenha,
    setRecuperarSenha,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [recuperacaoEtapa, setRecuperacaoEtapa] = useState(1);
  const [recuperacaoEmail, setRecuperacaoEmail] = useState("");
  const [recuperacaoCodigo, setRecuperacaoCodigo] = useState("");
  const [recuperacaoNovaSenha, setRecuperacaoNovaSenha] = useState("");
  const [recuperacaoConfirmacao, setRecuperacaoConfirmacao] = useState("");
  const [recuperacaoMensagem, setRecuperacaoMensagem] = useState("");
  const [recuperacaoCarregando, setRecuperacaoCarregando] = useState(false);

  const [trocaObrigatoria, setTrocaObrigatoria] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoNovaSenha, setConfirmacaoNovaSenha] = useState("");
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  /**
   * =====================================================
   * CONFIGURAÇÃO VISUAL DOS PERFIS
   * =====================================================
   *
   * Mantida exatamente no mesmo padrão da versão atual.
   */
  const perfis = {
    platform: {
      titulo:
        "Central Star Infinity Code",

      subtitulo:
        "Acesso restrito à administração global da plataforma.",

      gradient:
        "linear-gradient(135deg,#130c24,var(--ic-primary-deep),var(--ic-primary))",

      icon:
        <FaShieldAlt
          size={42}
          color="white"
        />,

      chamada:
        "Administração da plataforma",

      recursos: [
        "Condomínios e solicitações",
        "Planos, usuários e financeiro",
        "Auditoria e suporte",
        "Jobs, backups e operações",
      ],
    },

    sindico: {
      titulo:
        "Síndico / Administrador",

      subtitulo:
        "Acesso executivo para gestão completa do condomínio.",

      gradient:
        "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary),var(--ic-primary-bright))",

      icon:
        <FaShieldAlt
          size={42}
          color="white"
        />,

      chamada:
        "Gestão completa",

      recursos: [
        "Dashboard executivo",
        "Moradores e apartamentos",
        "Reservas e áreas comuns",
        "Relatórios e operações",
      ],
    },

    porteiro: {
      titulo:
        "Porteiro",

      subtitulo:
        "Controle operacional de visitantes, encomendas e ocorrências.",

      gradient:
        "linear-gradient(135deg,#312e81,var(--ic-primary-strong),var(--ic-primary-light))",

      icon:
        <FaIdBadge
          size={42}
          color="white"
        />,

      chamada:
        "Controle de portaria",

      recursos: [
        "Visitantes",
        "Encomendas",
        "Moradores",
        "Ocorrências",
      ],
    },

    morador: {
      titulo:
        "Morador",

      subtitulo:
        "Acompanhe avisos, reservas, encomendas e solicitações.",

      gradient:
        "linear-gradient(135deg,#1e1b4b,var(--ic-primary),#c084fc)",

      icon:
        <FaUserCircle
          size={42}
          color="white"
        />,

      chamada:
        "Portal do morador",

      recursos: [
        "Avisos",
        "Reservas",
        "Encomendas",
        "Sugestões",
      ],
    },
  };

  const perfil =
    perfis[tipo];

  /**
   * Proteção contra rota inválida.
   */
  if (!perfil) {
    navigate("/");
    return null;
  }

  /**
   * =====================================================
   * CHAVE DE SESSÃO LEGADA
   * =====================================================
   *
   * Mantemos as mesmas chaves porque outras partes
   * do frontend ainda dependem delas.
   */

  /**
   * =====================================================
   * DESTINO APÓS LOGIN
   * =====================================================
   */
  function obterRotaDestino() {
    if (tipo === "platform") {
      return "/platform";
    }

    if (tipo === "sindico") {
      return "/dashboard/sindico";
    }

    if (tipo === "porteiro") {
      return "/dashboard/porteiro";
    }

    if (tipo === "morador") {
      return "/dashboard/morador";
    }

    return "/";
  }

  /**
   * =====================================================
   * LIMPEZA DE SESSÕES ANTIGAS
   * =====================================================
   *
   * Importante:
   * não removemos os tokens da API aqui, porque eles
   * são gerenciados pelo authApi/api.js.
   */

  /**
   * =====================================================
   * CONVERSÃO DE USUÁRIO DO BACKEND
   * =====================================================
   *
   * O backend devolve campos em inglês e roles próprias.
   *
   * Aqui adaptamos para o formato que o frontend atual
   * já conhece, evitando quebrar layouts e módulos.
   */
  function montarDadosSessao(
    dadosUsuario
  ) {
    const tipoFrontend =
      roleParaTipoFrontend(
        dadosUsuario?.role
      ) || tipo;

    /**
     * Dados base compartilhados.
     */
    const dadosBase = {
      tipo:
        tipoFrontend,

      id:
        dadosUsuario?.id ?? null,

      nome:
        dadosUsuario?.name ??
        dadosUsuario?.nome ??
        "",

      usuario:
        dadosUsuario?.username ??
        dadosUsuario?.usuario ??
        "",

      email:
        dadosUsuario?.email ??
        "",

      telefone:
        dadosUsuario?.phone ??
        dadosUsuario?.telefone ??
        "",

      status:
        dadosUsuario?.status ??
        "ACTIVE",

      role:
        dadosUsuario?.role ??
        "",

      condominioId:
        dadosUsuario?.condominiumId ??
        null,

      loginEm:
        new Date().toISOString(),
    };

    /**
     * Dados adicionais do perfil de morador.
     *
     * Mantemos fallbacks porque nem todos esses campos
     * necessariamente virão diretamente do /auth/login.
     */
    if (
      tipoFrontend ===
      "morador"
    ) {
      return {
        ...dadosBase,

        apartamento:
          dadosUsuario?.apartmentLabel ??
          dadosUsuario?.apartment ??
          "",

        apto:
          dadosUsuario?.apartmentLabel ??
          dadosUsuario?.apartment ??
          "",

        apartamentoId:
          dadosUsuario?.apartmentId ??
          null,

        bloco:
          dadosUsuario?.block ??
          dadosUsuario?.bloco ??
          "",

        tipoMorador:
          dadosUsuario?.residentType ??
          dadosUsuario?.tipoMorador ??
          "Morador",

        moradorPrincipal:
          Boolean(
            dadosUsuario?.isPrimaryResident ??
            dadosUsuario?.moradorPrincipal
          ),

        perfilMorador:
          dadosUsuario?.residentProfile ??
          dadosUsuario?.perfilMorador ??
          "",

        permissoesMorador:
          dadosUsuario?.residentPermissions ??
          dadosUsuario?.permissoesMorador ??
          {
            podeReservar: true,
            podeAbrirSugestao: true,
            podeVisualizarEncomendas:
              true,
          },

        nomeCondominio:
          dadosUsuario?.condominiumName ??
          dadosUsuario?.nomeCondominio ??
          "",
      };
    }

    /**
     * Dados adicionais da Central Star.
     */
    if (
      tipoFrontend ===
      "platform"
    ) {
      return {
        ...dadosBase,

        perfilPlataforma:
          dadosUsuario?.role ??
          "",

        isPlatformOwner:
          dadosUsuario?.role ===
          "PLATFORM_OWNER",
      };
    }

    /**
     * Dados adicionais do porteiro.
     */
    if (
      tipoFrontend ===
      "porteiro"
    ) {
      return {
        ...dadosBase,

        turno:
          dadosUsuario?.shift ??
          dadosUsuario?.turno ??
          "",

        codigoPorteiro:
          dadosUsuario?.doormanCode ??
          dadosUsuario?.codigoPorteiro ??
          "",
      };
    }

    /**
     * Dados adicionais do síndico.
     */
    return {
      ...dadosBase,

      perfilAdmin:
        dadosUsuario?.role ===
        "CONDOMINIUM_ADMIN"
          ? "mestre"
          : "sub",

      usuarioPadrao: false,
    };
  }

  /**
   * =====================================================
   * SALVAR SESSÃO DE COMPATIBILIDADE
   * =====================================================
   *
   * Esta sessão NÃO substitui o JWT.
   *
   * Ela existe temporariamente porque telas antigas
   * ainda consultam essas chaves diretamente.
   */
  function salvarSessao(
    dadosUsuario
  ) {
    /**
     * Compatibilidade visual apenas.
     *
     * O usuário real é obtido de /auth/me.
     * Nenhum perfil é salvo como banco no navegador.
     */
    return dadosUsuario;
  }

  /**
   * =====================================================
   * LOGIN REAL VIA BACKEND
   * =====================================================
   */
  async function fazerLogin() {
    if (carregando) {
      return;
    }

    setErro("");
    setAvisoPadrao(null);

    const usuarioDigitado =
      usuario
        .trim()
        .toLowerCase();

    const senhaDigitada =
      senha;

    if (
      !usuarioDigitado ||
      !senhaDigitada
    ) {
      setErro(
        "Informe usuário e senha"
      );

      return;
    }

    setCarregando(true);

    try {
      /**
       * 1. Login no backend.
       */
      const resultadoLogin =
        await authApi.login({
          portalType: tipo,
          username: usuarioDigitado,
          password: senhaDigitada,
        });

      const usuarioBackend =
        resultadoLogin.user;

      /**
       * 2. Segurança adicional:
       * impede um usuário de entrar pelo portal visual
       * correspondente a outro perfil.
       */
      if (
        !tipoFrontendAceitaRole(
          tipo,
          usuarioBackend?.role
        )
      ) {
        /**
         * Remove os tokens gerados pelo login,
         * pois o usuário tentou entrar pelo portal errado.
         */
        authApi.clearAuthTokens();

        setErro(
          "Este usuário não possui permissão para acessar este perfil."
        );

        return;
      }

      if (usuarioBackend?.mustChangePassword === true) {
        setTrocaObrigatoria(true);
        setErro("");
        return;
      }

      /**
       * 3. Confirma o token usando /auth/me.
       *
       * Isso garante que o accessToken realmente funciona
       * antes de liberar o dashboard.
       */
      let usuarioConfirmado =
        null;

      try {
        usuarioConfirmado =
          await authApi.me();
      } catch {
        /**
         * Se /me falhar por qualquer incompatibilidade
         * de formato, não liberamos uma sessão duvidosa.
         */
        authApi.clearAuthTokens();

        throw new Error(
          "Não foi possível validar a sessão autenticada."
        );
      }

      /**
       * Alguns backends retornam o usuário diretamente
       * em data, outros dentro de data.user.
       *
       * authApi.me já normaliza isso, mas mantemos
       * fallback para segurança.
       */
      const usuarioFinal =
        usuarioConfirmado ||
        usuarioBackend;

      /**
       * 4. Monta o formato legado esperado pelo frontend.
       */
      const dadosSessao =
        montarDadosSessao(
          usuarioFinal
        );

      /**
       * 5. Salva compatibilidade temporária.
       */
      salvarSessao(
        dadosSessao
      );

      /**
       * 6. Redireciona para o dashboard correspondente.
       */
      navigate(
        obterRotaDestino(),
        {
          replace: true,
        }
      );
    } catch (error) {
      /**
       * =================================================
       * TRATAMENTO DE ERROS
       * =================================================
       */

      if (
        error?.status === 401
      ) {
        setErro(
          tipo === "platform"
            ? "Usuário ou senha inválidos"
            : "Usuário, senha ou código do condomínio inválidos"
        );

        return;
      }

      if (
        error?.status === 403
      ) {
        setErro(
          error?.message ||
          "Acesso não autorizado"
        );

        return;
      }

      if (
        error?.status === 422
      ) {
        setErro(
          error?.message ||
          "Verifique os dados informados"
        );

        return;
      }

      if (
        error?.status === 0
      ) {
        setErro(
          "Não foi possível conectar ao servidor do InfinityCondo"
        );

        return;
      }

      setErro(
        error?.message ||
        "Não foi possível realizar o login"
      );
    } finally {
      setCarregando(false);
    }
  }

  async function concluirTrocaObrigatoria() {
    if (trocandoSenha) return;
    setErro("");

    if (novaSenha.length < 8) {
      setErro("A nova senha deve possuir pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmacaoNovaSenha) {
      setErro("A confirmação da nova senha não corresponde.");
      return;
    }

    setTrocandoSenha(true);
    try {
      await authApi.changePassword({
        currentPassword: senha,
        newPassword: novaSenha,
        newPasswordConfirmation: confirmacaoNovaSenha,
      });
      const usuarioConfirmado = await authApi.me();
      const dadosSessao = montarDadosSessao(usuarioConfirmado);
      salvarSessao(dadosSessao);
      setTrocaObrigatoria(false);
      navigate(obterRotaDestino(), { replace: true });
    } catch (error) {
      setErro(error?.message ?? "Não foi possível alterar a senha.");
    } finally {
      setTrocandoSenha(false);
    }
  }

  /**
   * =====================================================
   * MODAL DE RECUPERAÇÃO DE SENHA
   * =====================================================
   *
   * Mantido visualmente como na versão atual.
   */
  function abrirRecuperacaoSenha() {
    setRecuperarSenha(true); setErro(""); setRecuperacaoEtapa(1); setRecuperacaoMensagem("");
    setRecuperacaoEmail(""); setRecuperacaoCodigo(""); setRecuperacaoNovaSenha(""); setRecuperacaoConfirmacao("");
  }

  function fecharRecuperacaoSenha() { setRecuperarSenha(false); setRecuperacaoMensagem(""); }

  async function enviarCodigoRecuperacao() {
    if (!recuperacaoEmail.trim()) return setRecuperacaoMensagem("Informe o e-mail cadastrado.");
    setRecuperacaoCarregando(true); setRecuperacaoMensagem("");
    try {
      await authApi.requestPasswordReset({ portalType: tipo, email: recuperacaoEmail.trim().toLowerCase() });
      setRecuperacaoEtapa(2); setRecuperacaoMensagem("Código enviado. Confira o e-mail cadastrado. Ele expira em 10 minutos.");
    } catch (error) { setRecuperacaoMensagem(error?.message ?? "Não foi possível enviar o código."); }
    finally { setRecuperacaoCarregando(false); }
  }

  async function redefinirSenhaRecuperacao() {
    setRecuperacaoCarregando(true); setRecuperacaoMensagem("");
    try {
      await authApi.confirmPasswordReset({ portalType: tipo, email: recuperacaoEmail.trim().toLowerCase(), code: recuperacaoCodigo.trim(), newPassword: recuperacaoNovaSenha, newPasswordConfirmation: recuperacaoConfirmacao });
      setRecuperacaoMensagem("Senha redefinida com sucesso. Você já pode entrar com a nova senha.");
      setTimeout(() => fecharRecuperacaoSenha(), 1200);
    } catch (error) { setRecuperacaoMensagem(error?.message ?? "Não foi possível redefinir a senha."); }
    finally { setRecuperacaoCarregando(false); }
  }

  /**
   * Permite login ao pressionar ENTER.
   */
  function handleKeyPress(e) {
    if (
      e.key === "Enter" &&
      !carregando
    ) {
      fazerLogin();
    }
  }

  if (trocaObrigatoria) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.formSide, width: "min(520px, 100%)", borderRadius: "32px", boxShadow: "0 30px 80px rgba(88,28,135,0.16)", zIndex: 2 }}>
          <div style={{ ...styles.iconCircle, background: perfil.gradient }}><FaKey size={38} color="white" /></div>
          <span style={styles.profileBadge}>Primeiro acesso</span>
          <h1 style={styles.title}>Crie sua nova senha</h1>
          <p style={styles.subtitle}>Por segurança, a senha temporária precisa ser alterada antes de acessar o sistema.</p>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nova senha</label>
            <input type="password" style={styles.input} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoFocus />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirmar nova senha</label>
            <input type="password" style={styles.input} value={confirmacaoNovaSenha} onChange={(e) => setConfirmacaoNovaSenha(e.target.value)} />
          </div>
          {erro ? <div style={styles.errorBox}>{erro}</div> : null}
          <button type="button" style={{ ...styles.button, background: perfil.gradient }} disabled={trocandoSenha} onClick={concluirTrocaObrigatoria}>
            {trocandoSenha ? "Alterando senha..." : "Salvar nova senha e entrar"}
          </button>
        </div>
      </div>
    );
  }

  /**
   * =====================================================
   * INTERFACE
   * =====================================================
   *
   * O design original foi preservado.
   *
   * A única inclusão visual necessária para a
   * autenticação multi-condomínio é o campo
   * O acesso é identificado pelo usuário ou e-mail e pelo perfil do portal.
   */
  return (
    <div style={styles.container}>
      <div style={styles.glowGreen}></div>
      <div style={styles.glowGold}></div>
      <div style={styles.gridOverlay}></div>

      <div style={styles.codeRain}>
        {
          "010101 110010 101101 001011 111000 010110 100101"
        }
      </div>

      <div style={styles.loginShell}>
        <div style={styles.formSide}>
          <button
            style={styles.backButton}
            onClick={() =>
              navigate("/")
            }
          >
            <FaArrowLeft />
            Voltar
          </button>

          <div
            style={{
              ...styles.iconCircle,
              background:
                perfil.gradient,
            }}
          >
            {perfil.icon}
          </div>

          <span
            style={
              styles.profileBadge
            }
          >
            Acesso seguro
          </span>

          <h1 style={styles.title}>
            {perfil.titulo}
          </h1>

          <p style={styles.subtitle}>
            {perfil.subtitulo}
          </p>

          <div
            style={
              styles.inputGroup
            }
          >
            <label
              style={styles.label}
            >
              Usuário
            </label>

            <input
              style={styles.input}
              placeholder="Digite seu usuário ou e-mail"
              value={usuario}
              onChange={(e) =>
                setUsuario(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyPress
              }
              autoComplete="username"
            />
          </div>

          <div
            style={
              styles.inputGroup
            }
          >
            <label
              style={styles.label}
            >
              Senha
            </label>

            <div
              style={
                styles.passwordWrap
              }
            >
              <input
                style={
                  styles.passwordInput
                }
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) =>
                  setSenha(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyPress
                }
                autoComplete="current-password"
              />

              <button
                type="button"
                style={
                  styles.eyeButton
                }
                onClick={() =>
                  setMostrarSenha(
                    !mostrarSenha
                  )
                }
                title={
                  mostrarSenha
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {mostrarSenha
                  ? <FaEyeSlash />
                  : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="button"
            style={
              styles.forgotButton
            }
            onClick={
              abrirRecuperacaoSenha
            }
          >
            <FaKey />
            Esqueci minha senha
          </button>

          {erro && (
            <div
              style={
                styles.errorBox
              }
            >
              {erro}
            </div>
          )}

          <button
            style={{
              ...styles.button,

              /**
               * Mantemos o mesmo botão.
               * Apenas damos feedback visual mínimo
               * durante a requisição.
               */
              opacity:
                carregando
                  ? 0.72
                  : 1,

              cursor:
                carregando
                  ? "wait"
                  : "pointer",
            }}
            onClick={fazerLogin}
            disabled={carregando}
          >
            {carregando
              ? "Entrando..."
              : "Entrar no InfinityCondo →"}
          </button>

          {/**
           * =============================================
           * CADASTRO DE NOVO CONDOMÍNIO
           * =============================================
           *
           * Exibido somente no portal do síndico/
           * administrador, pois é o ponto de entrada
           * comercial para um novo condomínio.
           */}
          {tipo === "sindico" && (
            <div
              style={
                styles.registrationBox
              }
            >
              <span
                style={
                  styles.registrationText
                }
              >
                Seu condomínio ainda não usa o InfinityCondo?
              </span>

              <button
                type="button"
                style={
                  styles.registrationButton
                }
                onClick={() =>
                  navigate(
                    "/cadastro-condominio"
                  )
                }
              >
                Cadastre seu condomínio
              </button>
            </div>
          )}

          <p
            style={
              styles.footerText
            }
          >
            InfinityCondo • Star Infinity Code © 2026
          </p>
        </div>

        <div style={styles.infoSide}>
          <div>
            <div
              style={
                styles.infoLogoMark
              }
            >
              ✦
            </div>

            <span
              style={
                styles.systemBadge
              }
            >
              InfinityCondo
            </span>

            <h2
              style={
                styles.infoTitle
              }
            >
              {perfil.chamada}
            </h2>

            <p
              style={
                styles.infoText
              }
            >
              Plataforma inteligente para gestão condominial,
              segurança operacional e experiência integrada.
            </p>
          </div>

          <div
            style={
              styles.featureList
            }
          >
            {perfil.recursos.map(
              (item) => (
                <div
                  key={item}
                  style={
                    styles.featureItem
                  }
                >
                  <FaCheckCircle
                    color="#facc15"
                  />

                  <span>
                    {item}
                  </span>
                </div>
              )
            )}
          </div>

          <div
            style={
              styles.secureBox
            }
          >
            <strong>
              Ambiente protegido
            </strong>

            <p>
              Cada perfil acessa somente as funcionalidades
              correspondentes ao seu tipo de usuário.
            </p>
          </div>
        </div>
      </div>

      {/**
       * =================================================
       * RECUPERAÇÃO DE SENHA
       * =================================================
       */}
      {recuperarSenha && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.warningModal, width: "min(480px, calc(100vw - 32px))" }}>
            <div style={styles.warningIcon}>🔐</div>
            <h2 style={styles.warningTitle}>Recuperar acesso</h2>
            <p style={styles.warningText}>O código será enviado somente para o e-mail cadastrado no InfinityCondo.</p>
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail cadastrado</label>
              <input type="email" style={styles.input} value={recuperacaoEmail} disabled={recuperacaoEtapa === 2} onChange={(e)=>setRecuperacaoEmail(e.target.value)} placeholder="seuemail@exemplo.com" />
            </div>
            {recuperacaoEtapa === 2 && (<>
              <div style={styles.inputGroup}><label style={styles.label}>Código de 6 dígitos</label><input inputMode="numeric" maxLength={6} style={styles.input} value={recuperacaoCodigo} onChange={(e)=>setRecuperacaoCodigo(e.target.value.replace(/\D/g, ""))} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>Nova senha</label><input type="password" style={styles.input} value={recuperacaoNovaSenha} onChange={(e)=>setRecuperacaoNovaSenha(e.target.value)} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>Confirmar nova senha</label><input type="password" style={styles.input} value={recuperacaoConfirmacao} onChange={(e)=>setRecuperacaoConfirmacao(e.target.value)} /></div>
            </>)}
            {recuperacaoMensagem && <div style={{...styles.errorBox,background:"var(--ic-primary-soft-4)",color:"var(--ic-primary-dark)",borderColor:"var(--ic-primary-border-soft)"}}>{recuperacaoMensagem}</div>}
            <div style={{...styles.warningActions,gap:"10px"}}>
              <button type="button" style={styles.changeNowButton} onClick={fecharRecuperacaoSenha}>Cancelar</button>
              <button type="button" style={{...styles.changeNowButton,background:perfil.gradient,color:"white"}} disabled={recuperacaoCarregando} onClick={recuperacaoEtapa===1?enviarCodigoRecuperacao:redefinirSenhaRecuperacao}>
                {recuperacaoCarregando ? "Processando..." : recuperacaoEtapa===1 ? "Enviar código" : "Criar nova senha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/**
       * Mantemos a estrutura do modal antigo na página
       * para não interferir no restante do design.
       *
       * A autenticação mestre padrão admin/1234 foi
       * removida da lógica porque agora o backend é a
       * fonte oficial de autenticação.
       */}
      {avisoPadrao && (
        <div
          style={
            styles.modalOverlay
          }
        >
          <div
            style={
              styles.warningModal
            }
          >
            <div
              style={
                styles.warningIcon
              }
            >
              ⚠️
            </div>

            <h2
              style={
                styles.warningTitle
              }
            >
              Aviso de segurança
            </h2>

            <p
              style={
                styles.warningText
              }
            >
              A sessão foi autenticada pelo servidor do InfinityCondo.
            </p>

            <div
              style={
                styles.warningActions
              }
            >
              <button
                style={
                  styles.changeNowButton
                }
                onClick={() => {
                  setAvisoPadrao(
                    null
                  );

                  navigate(
                    obterRotaDestino(),
                    {
                      replace: true,
                    }
                  );
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * =====================================================
 * ESTILOS
 * =====================================================
 *
 * Estes estilos foram preservados da versão enviada
 * pelo usuário para manter o design aprovado.
 */
const styles = {
  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left,rgb(var(--ic-primary-rgb) / 0.22),transparent 32%), radial-gradient(circle at bottom right,rgb(var(--ic-primary-bright-rgb) / 0.16),transparent 28%), radial-gradient(circle at center,rgba(59,130,246,0.08),transparent 38%), linear-gradient(135deg,#ffffff,#f8f5ff 48%,#ffffff)",
    display: "flex",
    justifyContent:
      "center",
    alignItems:
      "center",
    padding: "32px",
    fontFamily: "Arial",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  glowGreen: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background:
      "rgb(var(--ic-primary-rgb) / 0.15)",
    filter: "blur(80px)",
    top: "-120px",
    left: "-100px",
  },

  glowGold: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background:
      "rgb(var(--ic-primary-bright-rgb) / 0.12)",
    filter: "blur(85px)",
    bottom: "-110px",
    right: "-90px",
  },

  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgb(var(--ic-primary-rgb) / 0.08) 1px, transparent 1px), linear-gradient(90deg,rgb(var(--ic-primary-rgb) / 0.08) 1px, transparent 1px)",
    backgroundSize:
      "44px 44px",
    maskImage:
      "linear-gradient(to bottom,transparent,black 24%,black 76%,transparent)",
    opacity: 0.55,
  },

  codeRain: {
    position: "absolute",
    left: "50%",
    bottom: "7%",
    transform:
      "translateX(-50%)",
    width: "900px",
    maxWidth: "86%",
    color:
      "rgb(var(--ic-primary-strong-rgb) / 0.13)",
    fontSize: "18px",
    fontWeight: "900",
    letterSpacing: "12px",
    textAlign: "center",
    userSelect: "none",
    pointerEvents: "none",
    filter: "blur(0.2px)",
  },

  loginShell: {
    width: "980px",
    minHeight: "610px",
    display: "grid",
    gridTemplateColumns:
      "1fr 0.95fr",
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.13),transparent 35%), linear-gradient(180deg,rgba(255,255,255,0.95),rgba(251,250,255,0.88))",
    border:
      "1px solid rgb(var(--ic-primary-rgb) / 0.18)",
    borderRadius: "40px",
    boxShadow:
      "0 35px 90px rgba(88,28,135,0.16), inset 0 0 0 1px rgba(255,255,255,0.75)",
    backdropFilter:
      "blur(22px)",
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
  },

  formSide: {
    padding: "48px",
    display: "flex",
    flexDirection:
      "column",
    justifyContent:
      "center",
    position: "relative",
    background:
      "radial-gradient(circle at top left,rgb(var(--ic-primary-rgb) / 0.08),transparent 32%), rgba(255,255,255,0.94)",
  },

  infoSide: {
    padding: "48px",
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.20),transparent 34%), radial-gradient(circle at bottom left,rgb(var(--ic-primary-bright-rgb) / 0.24),transparent 38%), linear-gradient(145deg,var(--ic-primary-deepest),var(--ic-primary-deep),var(--ic-primary))",
    borderLeft:
      "1px solid rgba(255,255,255,0.18)",
    color: "white",
    display: "flex",
    flexDirection:
      "column",
    justifyContent:
      "space-between",
    position: "relative",
    overflow: "hidden",
  },

  backButton: {
    position: "absolute",
    top: "24px",
    left: "24px",
    border:
      "1px solid var(--ic-primary-border-soft)",
    background: "#ffffff",
    padding:
      "10px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "800",
    color: "var(--ic-primary-strong)",
    boxShadow:
      "0 10px 24px rgb(var(--ic-primary-rgb) / 0.10)",
  },

  logoBox: {
    width: "230px",
    maxWidth: "78%",
    margin:
      "18px 0 18px",
  },

  logoImage: {
    width: "100%",
    display: "block",
    filter:
      "drop-shadow(0 0 24px rgb(var(--ic-primary-rgb) / 0.30))",
  },

  iconCircle: {
    width: "98px",
    height: "98px",
    borderRadius: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    margin:
      "4px 0 16px",
    boxShadow:
      "0 18px 40px rgb(var(--ic-primary-rgb) / 0.24), 0 0 35px rgb(var(--ic-primary-bright-rgb) / 0.18)",
  },

  profileBadge: {
    width: "fit-content",
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary-strong)",
    border:
      "1px solid var(--ic-primary-border-soft)",
    padding:
      "8px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "14px",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    color: "#111827",
    letterSpacing:
      "-0.6px",
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: "28px",
    color: "#6b7280",
    lineHeight: "1.5",
  },

  inputGroup: {
    width: "100%",
    marginBottom: "15px",
  },

  label: {
    display: "block",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "17px",
    border:
      "1px solid var(--ic-primary-border-soft)",
    fontSize: "15px",
    outline: "none",
    background: "#ffffff",
    color: "#111827",
    boxSizing: "border-box",
    boxShadow:
      "0 10px 26px rgb(var(--ic-primary-rgb) / 0.06)",
  },

  passwordWrap: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    borderRadius: "17px",
    border:
      "1px solid var(--ic-primary-border-soft)",
    background: "#ffffff",
    boxSizing: "border-box",
    overflow: "hidden",
    boxShadow:
      "0 10px 26px rgb(var(--ic-primary-rgb) / 0.06)",
  },

  passwordInput: {
    flex: 1,
    padding: "16px",
    border: "none",
    fontSize: "15px",
    outline: "none",
    background:
      "transparent",
    color: "#111827",
    boxSizing: "border-box",
  },

  eyeButton: {
    width: "52px",
    height: "52px",
    border: "none",
    background:
      "transparent",
    color: "var(--ic-primary-strong)",
    cursor: "pointer",
    fontSize: "18px",
  },

  forgotButton: {
    border: "none",
    background:
      "transparent",
    color: "var(--ic-primary-strong)",
    cursor: "pointer",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin:
      "-3px 0 15px",
    padding: 0,
  },

  errorBox: {
    width: "100%",
    background: "rgba(254,226,226,0.96)",
    color: "#dc2626",
    padding: "13px",
    borderRadius: "14px",
    marginBottom: "16px",
    textAlign: "center",
    fontWeight: "800",
    boxSizing: "border-box",
    border:
      "1px solid #fecaca",
  },

  button: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "17px",
    color: "white",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "8px",
    background:
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-bright))",
    boxShadow:
      "0 18px 38px rgb(var(--ic-primary-rgb) / 0.28), 0 0 32px rgb(var(--ic-primary-bright-rgb) / 0.18)",
  },

  registrationBox: {
    width: "100%",
    marginTop: "16px",
    padding: "15px",
    border:
      "1px solid var(--ic-primary-border-soft)",
    borderRadius: "17px",
    background:
      "linear-gradient(180deg,#faf7ff,#ffffff)",
    textAlign: "center",
    boxSizing: "border-box",
  },

  registrationText: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1.5",
    marginBottom: "8px",
  },

  registrationButton: {
    border: "none",
    background: "transparent",
    color: "var(--ic-primary-strong)",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "13px",
    padding: "4px 6px",
  },

  footerText: {
    margin:
      "22px 0 0",
    color: "var(--ic-primary)",
    fontSize: "12px",
    fontWeight: "800",
  },

  infoLogoMark: {
    width: "74px",
    height: "74px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))",
    border:
      "1px solid rgba(255,255,255,0.20)",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: "44px",
    marginBottom: "18px",
    boxShadow:
      "0 20px 45px rgba(0,0,0,0.18)",
  },

  systemBadge: {
    display:
      "inline-block",
    width: "fit-content",
    background:
      "rgba(255,255,255,0.12)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    padding:
      "9px 13px",
    borderRadius: "999px",
    color: "#dcfce7",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "18px",
  },

  infoTitle: {
    margin: 0,
    fontSize: "38px",
    letterSpacing:
      "-0.8px",
    color: "white",
  },

  infoText: {
    color:
      "rgba(255,255,255,0.72)",
    lineHeight: "1.6",
    marginTop: "12px",
  },

  featureList: {
    display: "flex",
    flexDirection:
      "column",
    gap: "14px",
    margin:
      "34px 0",
  },

  featureItem: {
    background:
      "rgba(255,255,255,0.10)",
    border:
      "1px solid rgba(255,255,255,0.14)",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: "800",
    boxShadow:
      "inset 0 0 0 1px rgba(255,255,255,0.04)",
  },

  secureBox: {
    background:
      "rgba(255,255,255,0.11)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    borderRadius: "22px",
    padding: "18px",
    color: "var(--ic-primary-soft-4)",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(2,6,23,0.72)",
    backdropFilter:
      "blur(10px)",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    zIndex: 20,
    padding: "20px",
  },

  warningModal: {
    width: "460px",
    background:
      "linear-gradient(180deg,#ffffff,#fbfaff)",
    border:
      "1px solid var(--ic-primary-border-soft)",
    borderRadius: "32px",
    padding: "34px",
    color: "#111827",
    textAlign: "center",
    boxShadow:
      "0 35px 90px rgba(88,28,135,0.26), 0 0 40px rgb(var(--ic-primary-bright-rgb) / 0.14)",
  },

  warningIcon: {
    width: "74px",
    height: "74px",
    borderRadius: "24px",
    margin:
      "0 auto 18px",
    background:
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-bright))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: "34px",
  },

  warningTitle: {
    margin:
      "0 0 12px",
    fontSize: "28px",
    color: "#111827",
  },

  warningText: {
    color: "#4b5563",
    lineHeight: "1.6",
  },

  warningActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },

  changeNowButton: {
    flex: 1,
    background:
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-bright))",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "900",
  },

  continueButton: {
    flex: 1,
    background: "#ffffff",
    color: "var(--ic-primary-strong)",
    border:
      "1px solid var(--ic-primary-border)",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "900",
  },
};

export default Login;
