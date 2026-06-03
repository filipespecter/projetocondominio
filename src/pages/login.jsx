import { useParams, useNavigate } from "react-router-dom";

import {
  FaShieldAlt,
  FaIdBadge,
  FaUserCircle,
  FaArrowLeft,
  FaCheckCircle
} from "react-icons/fa";

import { useState } from "react";

function Login() {
  const { tipo } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const perfis = {
    sindico: {
      titulo: "Síndico / Administrador",
      subtitulo: "Acesso executivo para gestão completa do condomínio.",
      cor: "#22c55e",
      gradient: "linear-gradient(135deg,#052e16,#166534,#22c55e)",
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
      cor: "#16a34a",
      gradient: "linear-gradient(135deg,#031b0f,#14532d,#16a34a)",
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
      cor: "#4ade80",
      gradient: "linear-gradient(135deg,#052e16,#047857,#4ade80)",
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
  }

  function usuarioAtivo(status) {
    if (!status) return true;

    return (
      status === "ativo" ||
      status === "Ativo" ||
      status === "ATIVO"
    );
  }

  function fazerLogin() {
    setErro("");

    const usuarioDigitado = usuario.trim().toLowerCase();
    const senhaDigitada = senha.trim();

    if (!usuarioDigitado || !senhaDigitada) {
      setErro("Informe usuário e senha");
      return;
    }

    if (tipo === "sindico") {
      if (
        usuarioDigitado === "admin" &&
        senhaDigitada === "1234"
      ) {
        salvarSessao({
          tipo: "sindico",
          usuario: "admin",
          nome: "Administrador",
          loginEm: new Date().toISOString()
        });

        navigate(obterRotaDestino(), { replace: true });
        return;
      }

      setErro("Usuário ou senha inválidos");
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

      salvarSessao({
        tipo: "porteiro",
        id: encontrado.id,
        nome: encontrado.nome,
        usuario: encontrado.usuario,
        telefone: encontrado.telefone,
        turno: encontrado.turno,
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

      salvarSessao({
        tipo: "morador",
        id: encontrado.id,
        nome: encontrado.nome,
        usuario: encontrado.usuario,
        apartamento:
          encontrado.apartamento ||
          encontrado.apto ||
          "",
        bloco: encontrado.bloco || "",
        telefone: encontrado.telefone || "",
        email: encontrado.email || "",
        status: encontrado.status || "Ativo",
        loginEm: new Date().toISOString()
      });

      navigate(obterRotaDestino(), { replace: true });
      return;
    }
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

            <input
              style={styles.input}
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>

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
            Infinity Condo • Star Infinity Code © 2026
          </p>
        </div>

        <div style={styles.infoSide}>
          <div style={styles.infoTop}>
            <span style={styles.systemBadge}>
              Infinity Condo
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
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left,rgba(34,197,94,0.26),transparent 32%), radial-gradient(circle at bottom right,rgba(250,204,21,0.20),transparent 28%), linear-gradient(135deg,#020617,#052e16 48%,#064e3b)",
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
    background: "rgba(34,197,94,0.18)",
    filter: "blur(70px)",
    top: "-80px",
    left: "-80px"
  },

  glowGold: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(250,204,21,0.14)",
    filter: "blur(75px)",
    bottom: "-80px",
    right: "-80px"
  },

  loginShell: {
    width: "940px",
    minHeight: "610px",
    display: "grid",
    gridTemplateColumns: "1fr 0.95fr",
    background:
      "linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.07))",
    border: "1px solid rgba(255,255,255,0.20)",
    borderRadius: "38px",
    boxShadow: "0 35px 90px rgba(0,0,0,0.35)",
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
    background: "rgba(255,255,255,0.08)"
  },

  infoSide: {
    padding: "48px",
    background:
      "radial-gradient(circle at top right,rgba(250,204,21,0.20),transparent 38%), linear-gradient(145deg,rgba(2,6,23,0.30),rgba(5,46,22,0.35))",
    borderLeft: "1px solid rgba(255,255,255,0.14)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },

  backButton: {
    position: "absolute",
    top: "24px",
    left: "24px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.10)",
    padding: "10px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "800",
    color: "white",
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
    color: "white",
    letterSpacing: "-0.6px"
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: "28px",
    color: "rgba(255,255,255,0.68)",
    lineHeight: "1.5"
  },

  inputGroup: {
    width: "100%",
    marginBottom: "15px"
  },

  label: {
    display: "block",
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "8px"
  },

  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "17px",
    border: "1px solid rgba(255,255,255,0.18)",
    fontSize: "15px",
    outline: "none",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    boxSizing: "border-box"
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
      "linear-gradient(135deg,#16a34a,#facc15)",
    boxShadow:
      "0 16px 34px rgba(0,0,0,0.24), 0 0 24px rgba(250,204,21,0.16)"
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
    color: "rgba(255,255,255,0.68)",
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
    background: "rgba(255,255,255,0.10)",
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
    color: "#fef3c7"
  }
};

export default Login;