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


  const usuarios = {

    sindico: [
      {
        usuario: "admin",
        senha: "1234"
      }
    ],

    porteiro: [
      {
        usuario: "joao",
        senha: "123"
      },
      {
        usuario: "maria",
        senha: "123"
      }
    ],

    morador: [
      {
        usuario: "carlos",
        senha: "123"
      },
      {
        usuario: "ana",
        senha: "123"
      }
    ]

  };


  function fazerLogin() {

    setErro("");

    const lista = usuarios[tipo];

    const encontrado = lista.find(

      (u) =>

        u.usuario === usuario &&
        u.senha === senha

    );


    if (encontrado) {

      let dadosUsuario = {

        tipo,
        usuario,
        loginEm: new Date().toISOString()

      };

      // MORADOR
      if (tipo === "morador") {

        dadosUsuario = {

          ...dadosUsuario,

          apartamento:
            usuario === "carlos"
              ? "101"
              : "102"

        };

      }

      // PORTEIRO
      if (tipo === "porteiro") {

        dadosUsuario = {

          ...dadosUsuario,

          turno:
            usuario === "joao"
              ? "Diurno"
              : "Noturno"

        };

      }

      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify(dadosUsuario)
      );

      navigate("/dashboard/" + tipo);

    } else {

      setErro(
        "Usuário ou senha inválidos"
      );

    }

  }


  function handleKeyPress(e) {

    if (e.key === "Enter") {

      fazerLogin();

    }

  }


  return (

    <div style={styles.container}>


      {/* CARD */}


      <div style={styles.card}>


        {/* BOTÃO VOLTAR */}


        <button
          style={styles.backButton}
          onClick={() => navigate("/")}
        >

          <FaArrowLeft />

          Voltar

        </button>


        {/* ÍCONE */}


        <div
          style={{
            ...styles.iconCircle,
            background: perfil.gradient
          }}
        >

          {perfil.icon}

        </div>


        {/* TÍTULO */}


        <h1 style={styles.title}>

          {perfil.titulo}

        </h1>


        <p style={styles.subtitle}>

          {perfil.subtitulo}

        </p>


        {/* INPUTS */}


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


        {/* ERRO */}


        {erro && (

          <div style={styles.errorBox}>

            {erro}

          </div>

        )}


        {/* BOTÃO */}


        <button
          style={{
            ...styles.button,
            background: perfil.gradient
          }}
          onClick={fazerLogin}
        >

          Entrar no sistema

        </button>


        {/* LOGIN TESTE */}


        <div style={styles.testBox}>


          <strong>
            Usuários de teste
          </strong>


          <p>
            Admin → admin / 1234
          </p>

          <p>
            Porteiro → joao / 123
          </p>

          <p>
            Morador → carlos / 123
          </p>

        </div>

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
    marginBottom: "20px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.15)"
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
    textAlign: "center",
    lineHeight: "24px"
  },

  input: {
    width: "100%",
    padding: "16px",
    marginBottom: "16px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    transition: "0.2s"
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
    marginTop: "8px",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.15)"
  },

  testBox: {
    marginTop: "28px",
    background: "#f9fafb",
    width: "100%",
    padding: "18px",
    borderRadius: "18px",
    color: "#374151",
    fontSize: "14px",
    lineHeight: "26px"
  }

};

export default Login;