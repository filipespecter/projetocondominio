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
      subtitulo:
        "Acesso total ao gerenciamento do condomínio",
      cor: "#7b2cbf",
      gradient:
        "linear-gradient(135deg,#7b2cbf,#9d4edd)",
      icon: <FaShieldAlt size={38} color="white" />
    },

    porteiro: {
      titulo: "Porteiro",
      subtitulo:
        "Controle de visitantes e encomendas",
      cor: "#166534",
      gradient:
        "linear-gradient(135deg,#14532d,#166534)",
      icon: <FaIdBadge size={38} color="white" />
    },

    morador: {
      titulo: "Morador",
      subtitulo:
        "Acompanhe avisos, reservas e encomendas",
      cor: "#2563eb",
      gradient:
        "linear-gradient(135deg,#2563eb,#3b82f6)",
      icon: <FaUserCircle size={38} color="white" />
    }

  };

  const perfil = perfis[tipo];

  function obterChaveSessao() {

    switch (tipo) {

      case "sindico":
        return "usuarioSindico";

      case "porteiro":
        return "usuarioPorteiro";

      case "morador":
        return "usuarioMorador";

      default:
        return "usuarioLogado";

    }

  }

  function limparSessoes() {

    localStorage.removeItem("usuarioSindico");
    localStorage.removeItem("usuarioPorteiro");
    localStorage.removeItem("usuarioMorador");

    sessionStorage.removeItem("usuarioSindico");
    sessionStorage.removeItem("usuarioPorteiro");
    sessionStorage.removeItem("usuarioMorador");

  }

  function salvarSessao(dadosUsuario) {

    limparSessoes();

    const chave = obterChaveSessao();

    const dados =
      JSON.stringify(dadosUsuario);

    localStorage.setItem(
      chave,
      dados
    );

    sessionStorage.setItem(
      chave,
      dados
    );

  }

  function fazerLogin() {

    setErro("");

    const usuarioDigitado =
      usuario.trim().toLowerCase();

    const senhaDigitada =
      senha.trim();

    /* =========================
       LOGIN SÍNDICO
    ========================= */

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

        navigate("/dashboard/sindico", {
          replace: true
        });

        return;

      }

      setErro(
        "Usuário ou senha inválidos"
      );

      return;

    }

    /* =========================
       LOGIN PORTEIRO
    ========================= */

    if (tipo === "porteiro") {

      const porteiros =
        JSON.parse(
          localStorage.getItem("porteiros")
        ) || [];

      const encontrado = porteiros.find(

        (p) =>

          p.usuario
            ?.trim()
            .toLowerCase() ===
            usuarioDigitado &&

          p.senha?.trim() ===
            senhaDigitada

      );

      if (encontrado) {

        salvarSessao({
          tipo: "porteiro",
          id: encontrado.id,
          nome: encontrado.nome,
          usuario: encontrado.usuario,
          turno: encontrado.turno,
          telefone: encontrado.telefone,
          loginEm: new Date().toISOString()
        });

        navigate("/dashboard/porteiro", {
          replace: true
        });

      } else {

        setErro(
          "Usuário ou senha inválidos"
        );

      }

      return;

    }

    /* =========================
       LOGIN MORADOR
    ========================= */

    if (tipo === "morador") {

      const moradores =
        JSON.parse(
          localStorage.getItem("moradores")
        ) || [];

      const encontrado = moradores.find(

        (m) =>

          m.usuario
            ?.trim()
            .toLowerCase() ===
            usuarioDigitado &&

          m.senha?.trim() ===
            senhaDigitada

      );

      if (encontrado) {

        salvarSessao({
          tipo: "morador",
          id: encontrado.id,
          nome: encontrado.nome,
          apartamento:
            encontrado.apartamento,
          usuario: encontrado.usuario,
          loginEm: new Date().toISOString()
        });

        navigate("/dashboard/morador", {
          replace: true
        });

      } else {

        setErro(
          "Usuário ou senha inválidos"
        );

      }

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
          onChange={(e) =>
            setUsuario(e.target.value)
          }
          onKeyDown={handleKeyPress}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) =>
            setSenha(e.target.value)
          }
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
      "linear-gradient(135deg,#ecfdf5,#dbeafe,#ede9fe)",
    padding: "20px",
    fontFamily: "Arial"
  },

  card: {
    width: "430px",
    background: "white",
    borderRadius: "30px",
    padding: "45px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.12)",
    position: "relative"
  },

  backButton: {
    position: "absolute",
    top: "20px",
    left: "20px",
    border: "none",
    background: "#f3f4f6",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600"
  },

  iconCircle: {
    width: "95px",
    height: "95px",
    borderRadius: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px"
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#111827",
    textAlign: "center"
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: "30px",
    color: "#6b7280",
    textAlign: "center"
  },

  input: {
    width: "100%",
    padding: "16px",
    marginBottom: "16px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none"
  },

  errorBox: {
    width: "100%",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
    textAlign: "center",
    fontWeight: "600"
  },

  button: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "16px",
    color: "white",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "8px"
  }

};

export default Login;