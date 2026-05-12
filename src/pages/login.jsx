import { useParams, useNavigate } from "react-router-dom";
import { FaShieldAlt, FaIdBadge, FaUserCircle } from "react-icons/fa";
import { useState } from "react";

function Login() {

    const { tipo } = useParams();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");

    const perfis = {

        sindico: {
            titulo: "Login - Síndico / Administrador",
            cor: "#7b2cbf",
            icon: <FaShieldAlt size={40} color="white" />
        },

        porteiro: {
            titulo: "Login - Porteiro",
            cor: "#1c7c3c",
            icon: <FaIdBadge size={40} color="white" />
        },

        morador: {
            titulo: "Login - Morador",
            cor: "#2563eb",
            icon: <FaUserCircle size={40} color="white" />
        }

    };

    const perfil = perfis[tipo];

    const usuarios = {

        sindico: [
            { usuario: "admin", senha: "1234" }
        ],

        porteiro: [
            { usuario: "joao", senha: "123" },
            { usuario: "maria", senha: "123" }
        ],

        morador: [
            { usuario: "carlos", senha: "123" },
            { usuario: "ana", senha: "123" }
        ]

    };

    function fazerLogin() {

        const lista = usuarios[tipo];

        const encontrado = lista.find(
            (u) => u.usuario === usuario && u.senha === senha
        );

        if (encontrado) {

            navigate("/dashboard/" + tipo);

        } else {

            setErro("Usuário ou senha inválidos");

        }

    }

    return (

        <div style={styles.container}>

            <div style={styles.card}>

                <div style={{...styles.iconCircle, backgroundColor: perfil.cor}}>
                    {perfil.icon}
                </div>

                <h2 style={styles.title}>{perfil.titulo}</h2>

                <input
                    style={styles.input}
                    placeholder="Usuário"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                />

                <input
                    style={styles.input}
                    type="password"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                />

                {erro && (
                    <p style={styles.erro}>{erro}</p>
                )}

                <button
                    style={{...styles.button, backgroundColor: perfil.cor}}
                    onClick={fazerLogin}
                >
                    Entrar
                </button>

            </div>

        </div>

    );

}

const styles = {

    container: {
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #ffffff, #e5e5e5)"
    },

    card: {
        width: "420px",
        backgroundColor: "white",
        padding: "45px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0px 10px 30px rgba(0,0,0,0.15)"
    },

    iconCircle: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "15px"
    },

    title: {
        marginBottom: "25px",
        color: "#333"
    },

    input: {
        width: "100%",
        padding: "12px",
        marginBottom: "14px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        fontSize: "14px"
    },

    erro: {
        color: "red",
        fontSize: "13px",
        marginBottom: "10px"
    },

    button: {
        width: "100%",
        padding: "12px",
        border: "none",
        borderRadius: "6px",
        color: "white",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "15px",
        marginTop: "10px"
    }

};

export default Login;