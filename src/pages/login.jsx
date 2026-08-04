import { useParams, useNavigate } from "react-router-dom";

import {
  FaShieldAlt,
  FaIdBadge,
  FaUserCircle,
  FaArrowLeft,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaKey
} from "react-icons/fa";

import { useState } from "react";

function Login() {
  const { tipo } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [avisoPadrao, setAvisoPadrao] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [recuperarSenha, setRecuperarSenha] = useState(false);

  const perfis = {
    sindico: {
      titulo: "Síndico / Administrador",
      subtitulo: "Acesso executivo para gestão completa do condomínio.",
      gradient: "linear-gradient(135deg,#4c1d95,#7c3aed,#a855f7)",
      icon: <FaShieldAlt size={42} color="white" />,
      chamada: "Gestão completa",
      recursos: [
        "Dashboard executivo",
        "Moradores e apartamentos",
        "Reservas e áreas comuns",
        "Relatórios e operações"
      ]
    },

    porteiro: {
      titulo: "Porteiro",
      subtitulo: "Controle operacional de visitantes, encomendas e ocorrências.",
      gradient: "linear-gradient(135deg,#312e81,#6d28d9,#8b5cf6)",
      icon: <FaIdBadge size={42} color="white" />,
      chamada: "Controle de portaria",
      recursos: [
        "Visitantes",
        "Encomendas",
        "Moradores",
        "Ocorrências"
      ]
    },

    morador: {
      titulo: "Morador",
      subtitulo: "Acompanhe avisos, reservas, encomendas e solicitações.",
      gradient: "linear-gradient(135deg,#1e1b4b,#7c3aed,#c084fc)",
      icon: <FaUserCircle size={42} color="white" />,
      chamada: "Portal do morador",
      recursos: [
        "Avisos",
        "Reservas",
        "Encomendas",
        "Sugestões"
      ]
    }
  };

  const perfil = perfis[tipo];

  if (!perfil) {
    navigate("/");
    return null;
  }

  function obterChaveSessao() {
    if (tipo === "sindico") return "sessaoSindico";
    if (tipo === "porteiro") return "sessaoPorteiro";
    if (tipo === "morador") return "sessaoMorador";
    return "sessao";
  }

  function obterRotaDestino() {
    if (tipo === "sindico") return "/dashboard/sindico";
    if (tipo === "porteiro") return "/dashboard/porteiro";
    if (tipo === "morador") return "/dashboard/morador";
    return "/";
  }

  function limparSessoes() {
    localStorage.removeItem("sessaoSindico");
    localStorage.removeItem("sessaoPorteiro");
    localStorage.removeItem("sessaoMorador");

    sessionStorage.removeItem("sessaoSindico");
    sessionStorage.removeItem("sessaoPorteiro");
    sessionStorage.removeItem("sessaoMorador");

    localStorage.removeItem("usuarioSindico");
    localStorage.removeItem("usuarioPorteiro");
    localStorage.removeItem("usuarioMorador");
    localStorage.removeItem("usuarioLogado");

    sessionStorage.removeItem("usuarioSindico");
    sessionStorage.removeItem("usuarioPorteiro");
    sessionStorage.removeItem("usuarioMorador");
    sessionStorage.removeItem("usuarioLogado");
  }

  function salvarSessao(dadosUsuario) {
    limparSessoes();

    const chave = obterChaveSessao();
    const dados = JSON.stringify(dadosUsuario);

    localStorage.setItem(chave, dados);
    sessionStorage.setItem(chave, dados);

    if (dadosUsuario.tipo === "sindico") {
      localStorage.setItem("usuarioSindico", dados);
      sessionStorage.setItem("usuarioSindico", dados);
    }

    if (dadosUsuario.tipo === "porteiro") {
      localStorage.setItem("usuarioPorteiro", dados);
      sessionStorage.setItem("usuarioPorteiro", dados);
    }

    if (dadosUsuario.tipo === "morador") {
      localStorage.setItem("usuarioMorador", dados);
      sessionStorage.setItem("usuarioMorador", dados);
    }

    localStorage.setItem("usuarioLogado", dados);
    sessionStorage.setItem("usuarioLogado", dados);
  }

  function usuarioAtivo(status) {
    if (!status) return true;

    return (
      status === "ativo" ||
      status === "Ativo" ||
      status === "ATIVO"
    );
  }

  function obterUsuariosSindico() {
    const dados =
      JSON.parse(localStorage.getItem("usuariosSindico")) || [];

    if (dados.length > 0) return dados;

    const usuarioMestrePadrao = {
      id: Date.now(),
      nome: "Administrador Principal",
      usuario: "admin",
      senha: "1234",
      perfil: "mestre",
      status: "Ativo",
      usuarioPadrao: true,
      criadoEm: new Date().toLocaleString("pt-BR")
    };

    localStorage.setItem(
      "usuariosSindico",
      JSON.stringify([usuarioMestrePadrao])
    );

    return [usuarioMestrePadrao];
  }

  function loginSindico(usuarioDigitado, senhaDigitada) {
    const usuariosSindico = obterUsuariosSindico();

    const encontrado = usuariosSindico.find(
      (u) =>
        u.usuario?.trim().toLowerCase() === usuarioDigitado &&
        u.senha?.trim() === senhaDigitada
    );

    if (!encontrado) {
      setErro("Usuário ou senha inválidos");
      return;
    }

    if (!usuarioAtivo(encontrado.status)) {
      setErro("Este usuário administrativo está inativo");
      return;
    }

    const dadosSessao = {
      tipo: "sindico",
      id: encontrado.id,
      nome: encontrado.nome,
      usuario: encontrado.usuario,
      perfilAdmin: encontrado.perfil || "sub",
      status: encontrado.status || "Ativo",
      usuarioPadrao: encontrado.usuarioPadrao || false,
      loginEm: new Date().toISOString()
    };

    salvarSessao(dadosSessao);

    const usandoPadrao =
      encontrado.perfil === "mestre" &&
      encontrado.usuario === "admin" &&
      encontrado.senha === "1234";

    if (usandoPadrao) {
      setAvisoPadrao(dadosSessao);
      return;
    }

    navigate(obterRotaDestino(), { replace: true });
  }

  function fazerLogin() {
    setErro("");
    setAvisoPadrao(null);

    const usuarioDigitado = usuario.trim().toLowerCase();
    const senhaDigitada = senha.trim();

    if (!usuarioDigitado || !senhaDigitada) {
      setErro("Informe usuário e senha");
      return;
    }

    if (tipo === "sindico") {
      loginSindico(usuarioDigitado, senhaDigitada);
      return;
    }

    if (tipo === "porteiro") {
      const porteiros =
        JSON.parse(localStorage.getItem("porteiros")) || [];

      const encontrado = porteiros.find(
        (p) =>
          p.usuario?.trim().toLowerCase() === usuarioDigitado &&
          p.senha?.trim() === senhaDigitada
      );

      if (!encontrado) {
        setErro("Usuário ou senha inválidos");
        return;
      }

      if (!usuarioAtivo(encontrado.status)) {
        setErro("Este porteiro está inativo no sistema");
        return;
      }

      const porteirosAtualizados = porteiros.map((p) =>
        p.id === encontrado.id
          ? {
            ...p,
            ultimoLogin: new Date().toISOString()
          }
          : p
      );

      localStorage.setItem("porteiros", JSON.stringify(porteirosAtualizados));

      salvarSessao({
        tipo: "porteiro",
        id: encontrado.id,
        nome: encontrado.nome,
        usuario: encontrado.usuario,
        telefone: encontrado.telefone,
        turno: encontrado.turno,
        codigoPorteiro: encontrado.codigoPorteiro || "",
        status: encontrado.status || "Ativo",
        loginEm: new Date().toISOString()
      });

      navigate(obterRotaDestino(), { replace: true });
      return;
    }

    if (tipo === "morador") {
      const moradores =
        JSON.parse(localStorage.getItem("moradores")) || [];

      const encontrado = moradores.find(
        (m) =>
          m.usuario?.trim().toLowerCase() === usuarioDigitado &&
          m.senha?.trim() === senhaDigitada
      );

      if (!encontrado) {
        setErro("Usuário ou senha inválidos");
        return;
      }

      if (!usuarioAtivo(encontrado.status)) {
        setErro("Este morador está inativo no sistema");
        return;
      }

      const moradoresAtualizados = moradores.map((m) =>
        m.id === encontrado.id
          ? {
            ...m,
            ultimoLogin: new Date().toISOString()
          }
          : m
      );

      localStorage.setItem("moradores", JSON.stringify(moradoresAtualizados));

      const apartamentoMorador =
        encontrado.apartamento ||
        encontrado.apto ||
        "";

      salvarSessao({
        tipo: "morador",
        id: encontrado.id,
        nome: encontrado.nome,
        usuario: encontrado.usuario,
        apartamento: apartamentoMorador,
        apto: apartamentoMorador,
        apartamentoId: encontrado.apartamentoId || null,
        bloco: encontrado.bloco || "",
        telefone: encontrado.telefone || "",
        email: encontrado.email || "",
        tipoMorador: encontrado.tipoMorador || "Morador",
        moradorPrincipal: Boolean(encontrado.moradorPrincipal),
        perfilMorador:
          encontrado.perfilMorador ||
          (encontrado.moradorPrincipal ? "principal" : "dependente"),
        permissoesMorador:
          encontrado.permissoesMorador || {
            podeReservar: Boolean(encontrado.moradorPrincipal),
            podeAbrirSugestao: true,
            podeVisualizarEncomendas: true
          },
        condominioId: encontrado.condominioId || null,
        nomeCondominio: encontrado.nomeCondominio || "",
        status: encontrado.status || "Ativo",
        loginEm: new Date().toISOString()
      });

      navigate(obterRotaDestino(), { replace: true });
      return;
    }
  }

  function continuarComUsuarioPadrao() {
    setAvisoPadrao(null);
    navigate(obterRotaDestino(), { replace: true });
  }

  function irParaConfiguracoes() {
    setAvisoPadrao(null);
    navigate("/dashboard/configuracoes", { replace: true });
  }

  function abrirRecuperacaoSenha() {
    setRecuperarSenha(true);
    setErro("");
  }

  function fecharRecuperacaoSenha() {
    setRecuperarSenha(false);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") {
      fazerLogin();
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.glowGreen}></div>
      <div style={styles.glowGold}></div>

      <div style={styles.loginShell}>
        <div style={styles.formSide}>
          <button
            style={styles.backButton}
            onClick={() => navigate("/")}
          >
            <FaArrowLeft />
            Voltar
          </button>

          <div
            style={{
              ...styles.iconCircle,
              background: perfil.gradient
            }}
          >
            {perfil.icon}
          </div>

          <span style={styles.profileBadge}>
            Acesso seguro
          </span>

          <h1 style={styles.title}>
            {perfil.titulo}
          </h1>

          <p style={styles.subtitle}>
            {perfil.subtitulo}
          </p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Usuário
            </label>

            <input
              style={styles.input}
              placeholder="Digite seu usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Senha
            </label>

            <div style={styles.passwordWrap}>
              <input
                style={styles.passwordInput}
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleKeyPress}
              />

              <button
                type="button"
                style={styles.eyeButton}
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="button"
            style={styles.forgotButton}
            onClick={abrirRecuperacaoSenha}
          >
            <FaKey />
            Esqueci minha senha
          </button>

          {erro && (
            <div style={styles.errorBox}>
              {erro}
            </div>
          )}

          <button
            style={styles.button}
            onClick={fazerLogin}
          >
            Acessar Plataforma
          </button>

          <p style={styles.footerText}>
            InfinityCondo • Star Infinity Code © 2026
          </p>
        </div>

        <div style={styles.infoSide}>
          <div>
            <span style={styles.systemBadge}>
              InfinityCondo
            </span>

            <h2 style={styles.infoTitle}>
              {perfil.chamada}
            </h2>

            <p style={styles.infoText}>
              Plataforma inteligente para gestão condominial,
              segurança operacional e experiência integrada.
            </p>
          </div>

          <div style={styles.featureList}>
            {perfil.recursos.map((item) => (
              <div
                key={item}
                style={styles.featureItem}
              >
                <FaCheckCircle color="#facc15" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div style={styles.secureBox}>
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

      {recuperarSenha && (
        <div style={styles.modalOverlay}>
          <div style={styles.warningModal}>
            <div style={styles.warningIcon}>
              🔐
            </div>

            <h2 style={styles.warningTitle}>
              Recuperação de senha
            </h2>

            <p style={styles.warningText}>
              A recuperação automática será ativada na versão com backend.
            </p>

            <p style={styles.warningText}>
              Por enquanto, solicite a redefinição ao administrador do sistema
              ou entre em contato com a Star Infinity Code.
            </p>

            <div style={styles.warningActions}>
              <button
                style={styles.changeNowButton}
                onClick={fecharRecuperacaoSenha}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {avisoPadrao && (
        <div style={styles.modalOverlay}>
          <div style={styles.warningModal}>
            <div style={styles.warningIcon}>
              ⚠️
            </div>

            <h2 style={styles.warningTitle}>
              Acesso padrão em uso
            </h2>

            <p style={styles.warningText}>
              Você está usando o usuário mestre padrão do sistema:
              <strong> admin / 1234</strong>.
            </p>

            <p style={styles.warningText}>
              Recomendamos alterar usuário e senha em Configurações para
              aumentar a segurança do seu condomínio.
            </p>

            <div style={styles.warningActions}>
              <button
                style={styles.changeNowButton}
                onClick={irParaConfiguracoes}
              >
                Alterar agora
              </button>

              <button
                style={styles.continueButton}
                onClick={continuarComUsuarioPadrao}
              >
                Continuar por enquanto
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
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left,rgba(124,58,237,0.22),transparent 32%), radial-gradient(circle at bottom right,rgba(168,85,247,0.16),transparent 28%), radial-gradient(circle at center,rgba(59,130,246,0.08),transparent 38%), linear-gradient(135deg,#ffffff,#f8f5ff 48%,#ffffff)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "32px",
    fontFamily: "Arial",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box"
  },

  glowGreen: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background: "rgba(124,58,237,0.12)",
    filter: "blur(70px)",
    top: "-80px",
    left: "-80px"
  },

  glowGold: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(168,85,247,0.10)",
    filter: "blur(75px)",
    bottom: "-80px",
    right: "-80px"
  },

  loginShell: {
    width: "980px",
    minHeight: "610px",
    display: "grid",
    gridTemplateColumns: "1fr 0.95fr",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.12),transparent 35%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid rgba(124,58,237,0.14)",
    borderRadius: "38px",
    boxShadow: "0 35px 90px rgba(88,28,135,0.14)",
    backdropFilter: "blur(22px)",
    overflow: "hidden",
    position: "relative",
    zIndex: 2
  },

  formSide: {
    padding: "48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    background: "rgba(255,255,255,0.92)"
  },

  infoSide: {
    padding: "48px",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.18),transparent 38%), linear-gradient(145deg,#4c1d95,#7c3aed)",
    borderLeft: "1px solid rgba(255,255,255,0.14)",
    color: "#111827",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },

  backButton: {
    position: "absolute",
    top: "24px",
    left: "24px",
    border: "1px solid #ddd6fe",
    background: "#ffffff",
    padding: "10px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "800",
    color: "#6d28d9",
    backdropFilter: "blur(12px)"
  },

  iconCircle: {
    width: "98px",
    height: "98px",
    borderRadius: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px 0 18px",
    boxShadow:
      "0 18px 40px rgba(22,163,74,0.24), 0 0 35px rgba(250,204,21,0.10)"
  },

  profileBadge: {
    width: "fit-content",
    background: "rgba(250,204,21,0.16)",
    color: "#facc15",
    border: "1px solid rgba(250,204,21,0.28)",
    padding: "8px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "14px"
  },

  title: {
    margin: 0,
    fontSize: "34px",
    color: "#111827",
    letterSpacing: "-0.6px"
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: "28px",
    color: "#6b7280",
    lineHeight: "1.5"
  },

  inputGroup: {
    width: "100%",
    marginBottom: "15px"
  },

  label: {
    display: "block",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "8px"
  },

  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "17px",
    border: "1px solid #ddd6fe",
    fontSize: "15px",
    outline: "none",
    background: "#ffffff",
    color: "#111827",
    boxSizing: "border-box"
  },

  passwordWrap: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    borderRadius: "17px",
    border: "1px solid #ddd6fe",
    background: "#ffffff",
    boxSizing: "border-box",
    overflow: "hidden"
  },

  passwordInput: {
    flex: 1,
    padding: "16px",
    border: "none",
    fontSize: "15px",
    outline: "none",
    background: "transparent",
    color: "#111827",
    boxSizing: "border-box"
  },

  eyeButton: {
    width: "52px",
    height: "52px",
    border: "none",
    background: "transparent",
    color: "#6d28d9",
    cursor: "pointer",
    fontSize: "18px"
  },

  forgotButton: {
    border: "none",
    background: "transparent",
    color: "#6d28d9",
    cursor: "pointer",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "-3px 0 15px",
    padding: 0
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
    boxSizing: "border-box"
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
      "linear-gradient(135deg,#6d28d9,#a855f7)",
    boxShadow:
      "0 16px 34px rgba(124,58,237,0.24)"
  },

  footerText: {
    margin: "22px 0 0",
    color: "rgba(255,255,255,0.46)",
    fontSize: "12px"
  },

  systemBadge: {
    display: "inline-block",
    width: "fit-content",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    padding: "9px 13px",
    borderRadius: "999px",
    color: "#dcfce7",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "18px"
  },

  infoTitle: {
    margin: 0,
    fontSize: "38px",
    letterSpacing: "-0.8px"
  },

  infoText: {
    color: "#6b7280",
    lineHeight: "1.6",
    marginTop: "12px"
  },

  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    margin: "34px 0"
  },

  featureItem: {
    background: "#ffffff",
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: "800"
  },

  secureBox: {
    background: "rgba(250,204,21,0.12)",
    border: "1px solid rgba(250,204,21,0.28)",
    borderRadius: "22px",
    padding: "18px",
    color: "#4c1d95"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.72)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    padding: "20px"
  },

  warningModal: {
    width: "460px",
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ddd6fe",
    borderRadius: "30px",
    padding: "30px",
    textAlign: "center",
    boxShadow: "0 30px 80px rgba(88,28,135,0.22)",
    color: "#111827"
  },

  warningIcon: {
    width: "74px",
    height: "74px",
    borderRadius: "24px",
    margin: "0 auto 18px",
    background: "linear-gradient(135deg,#92400e,#facc15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px"
  },

  warningTitle: {
    margin: "0 0 12px",
    fontSize: "28px"
  },

  warningText: {
    color: "#6d28d9",
    lineHeight: "1.6"
  },

  warningActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px"
  },

  changeNowButton: {
    flex: 1,
    background: "linear-gradient(135deg,#6d28d9,#a855f7)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "900"
  },

  continueButton: {
    flex: 1,
    background: "#6d28d9",
    color: "white",
    border: "1px solid #ddd6fe",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Login;