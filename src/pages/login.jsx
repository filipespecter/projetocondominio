import { useParams, useNavigate } from "react-router-dom";

import {
  FaShieldAlt,
  FaIdBadge,
  FaUserCircle,
  FaArrowLeft
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
      subtitulo: "Acesso total ao gerenciamento do condomínio",
      cor: "#7b2cbf",
      gradient: "linear-gradient(135deg,#7b2cbf,#9d4edd)",
      icon: <FaShieldAlt size={38} color="white" />
    },

    porteiro: {
      titulo: "Porteiro",
      subtitulo: "Controle de visitantes, encomendas e ocorrências",
      cor: "#166534",
      gradient: "linear-gradient(135deg,#052e16,#14532d,#166534)",
      icon: <FaIdBadge size={38} color="white" />
    },

    morador: {
      titulo: "Morador",
      subtitulo: "Acompanhe avisos, reservas, encomendas e solicitações",
      cor: "#2563eb",
      gradient: "linear-gradient(135deg,#0f172a,#1e3a8a,#2563eb)",
      icon: <FaUserCircle size={38} color="white" />
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
      <div style={styles.card}>
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

        <span
          style={{
            ...styles.profileBadge,
            background: perfil.gradient
          }}
        >
          Acesso seguro
        </span>

        <h1 style={styles.title}>
          {perfil.titulo}
        </h1>

        <p style={styles.subtitle}>
          {perfil.subtitulo}
        </p>

        <input
          style={styles.input}
          placeholder="Usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        {erro && (
          <div style={styles.errorBox}>
            {erro}
          </div>
        )}

        <button
          style={{
            ...styles.button,
            background: perfil.gradient
          }}
          onClick={fazerLogin}
        >
          Entrar no sistema
        </button>

        <p style={styles.footerText}>
          Sistema residencial integrado • Portaria Digital
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "radial-gradient(circle at top left,#dcfce7,transparent 32%), radial-gradient(circle at bottom right,#dbeafe,transparent 35%), linear-gradient(135deg,#ecfdf5,#f8fafc,#ede9fe)",
    padding: "20px",
    fontFamily: "Arial"
  },

  card: {
    width: "440px",
    background: "rgba(255,255,255,0.92)",
    borderRadius: "34px",
    padding: "46px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 30px 80px rgba(15,23,42,0.16)",
    position: "relative",
    border: "1px solid rgba(255,255,255,0.65)",
    backdropFilter: "blur(18px)"
  },

  backButton: {
    position: "absolute",
    top: "20px",
    left: "20px",
    border: "none",
    background: "#f3f4f6",
    padding: "10px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "700",
    color: "#374151"
  },

  iconCircle: {
    width: "96px",
    height: "96px",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "18px",
    boxShadow: "0 16px 35px rgba(15,23,42,0.18)"
  },

  profileBadge: {
    color: "white",
    padding: "8px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "14px"
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#111827",
    textAlign: "center",
    letterSpacing: "-0.4px"
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: "30px",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: "1.5"
  },

  input: {
    width: "100%",
    padding: "16px",
    marginBottom: "16px",
    borderRadius: "17px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    background: "#f9fafb",
    boxSizing: "border-box"
  },

  errorBox: {
    width: "100%",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "13px",
    borderRadius: "14px",
    marginBottom: "16px",
    textAlign: "center",
    fontWeight: "700",
    boxSizing: "border-box"
  },

  button: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "17px",
    color: "white",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 14px 28px rgba(15,23,42,0.16)"
  },

  footerText: {
    margin: "22px 0 0",
    color: "#9ca3af",
    fontSize: "12px",
    textAlign: "center"
  }
};

export default Login;