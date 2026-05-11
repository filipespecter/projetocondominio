import { useParams, useNavigate } from "react-router-dom";
import { FaUserShield, FaBuilding, FaUser } from "react-icons/fa";
import { useState } from "react";

function Login() {

    const { tipo } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");

    const perfis = {

        sindico: {
            titulo: "Acesso Síndico / Administrador",
            cor: "#7b2cbf",
            icon: <FaUserShield size={70} />
        },

        porteiro: {
            titulo: "Acesso Porteiro",
            cor: "#1c7c3c",
            icon: <FaBuilding size={70} />
        },

        morador: {
            titulo: "Acesso Morador",
            cor: "#4cc9f0",
            icon: <FaUser size={70} />
        }

    };

    const perfil = perfis[tipo];

    // Simulação de usuários cadastrados
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

        <div style={{ ...styles.container, backgroundColor: perfil.cor }}>

            <div style={styles.card}>

                <div style={styles.icon}>
                    {perfil.icon}
                </div>

                <h2 style={styles.title}>
                    {perfil.titulo}
                </h2>

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
                    <p style={styles.erro}>
                        {erro}
                    </p>
                )}

                <button
                    style={styles.button}
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
        alignItems: "center"
    },

    card: {
        width: "320px",
        backgroundColor: "white",
        padding: "35px",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0px 8px 25px rgba(0,0,0,0.3)"
    },

    icon: {
        marginBottom: "10px"
    },

    title: {
        marginBottom: "20px",
        color: "#333"
    },

    input: {
        width: "100%",
        padding: "10px",
        marginBottom: "12px",
        borderRadius: "6px",
        border: "1px solid #ccc"
    },

    erro: {
        color: "red",
        fontSize: "14px",
        marginBottom: "10px"
    },

    button: {
        width: "100%",
        padding: "10px",
        border: "none",
        borderRadius: "6px",
        backgroundColor: "#333",
        color: "white",
        cursor: "pointer"
    }

};

export default Login;