import {
  Outlet,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  FaBox,
  FaClipboardList,
  FaUsers,
  FaSignOutAlt
} from "react-icons/fa";

import { useEffect, useState } from "react";

function DashboardPorteiroLayout() {

  const navigate = useNavigate();

  const location = useLocation();

  const [usuarioLogado, setUsuarioLogado] =
    useState(null);

  /* =========================
     CARREGA USUÁRIO
  ========================= */

  useEffect(() => {

    const usuarioSalvo =
      localStorage.getItem("usuarioPorteiro") ||
      sessionStorage.getItem("usuarioPorteiro");

    if (usuarioSalvo) {

      try {

        const usuario =
          JSON.parse(usuarioSalvo);

        if (
          usuario.tipo !== "porteiro"
        ) {

          navigate("/login/porteiro");

          return;

        }

        setUsuarioLogado(usuario);

      } catch {

        localStorage.removeItem(
          "usuarioPorteiro"
        );

        sessionStorage.removeItem(
          "usuarioPorteiro"
        );

        navigate("/login/porteiro");

      }

    } else {

      navigate("/login/porteiro");

    }

  }, [navigate]);

  /* =========================
     MENU ATIVO
  ========================= */

  function ativo(path) {

    return location.pathname === path;

  }

  /* =========================
     LOGOUT
  ========================= */

  function sair() {

    localStorage.removeItem(
      "usuarioPorteiro"
    );

    sessionStorage.removeItem(
      "usuarioPorteiro"
    );

    navigate("/");

  }

  return (

    <div style={styles.container}>

      {/* SIDEBAR */}

      <div style={styles.sidebar}>

        <div>

          <h2 style={styles.logo}>
            🛡️ Portaria
          </h2>

          {/* USUÁRIO */}

          <div style={styles.userBox}>

            <div style={styles.avatar}>
              👤
            </div>

            <div>

              <div style={styles.userName}>
                {usuarioLogado?.nome ||
                  "Porteiro"}
              </div>

              <div style={styles.userRole}>
                Porteiro
              </div>

            </div>

          </div>

          {/* MENU */}

          <div style={styles.menu}>

            <Link
              to="/dashboard/porteiro"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro")
                  ? styles.active
                  : {})
              }}
            >
              🏠 Dashboard
            </Link>

            <Link
              to="/dashboard/porteiro/encomendas"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro/encomendas")
                  ? styles.active
                  : {})
              }}
            >
              <FaBox />
              Encomendas
            </Link>

            <Link
              to="/dashboard/porteiro/visitantes"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro/visitantes")
                  ? styles.active
                  : {})
              }}
            >
              <FaClipboardList />
              Visitantes
            </Link>

            <Link
              to="/dashboard/porteiro/moradores"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro/moradores")
                  ? styles.active
                  : {})
              }}
            >
              <FaUsers />
              Moradores
            </Link>

          </div>

        </div>

        {/* LOGOUT */}

        <button
          style={styles.logoutButton}
          onClick={sair}
        >

          <FaSignOutAlt />

          Sair

        </button>

      </div>

      {/* CONTEÚDO */}

      <div style={styles.content}>

        <Outlet />

      </div>

    </div>

  );

}

const styles = {

  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f4f6"
  },

  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#14532d,#166534)",
    color: "white",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },

  logo: {
    marginBottom: "30px"
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.1)",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "24px"
  },

  avatar: {
    fontSize: "26px"
  },

  userName: {
    fontWeight: "700"
  },

  userRole: {
    fontSize: "13px",
    opacity: 0.8
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  menuItem: {
    color: "white",
    textDecoration: "none",
    padding: "14px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.08)",
    transition: "0.2s"
  },

  active: {
    background: "rgba(255,255,255,0.18)"
  },

  logoutButton: {
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    padding: "14px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "700"
  },

  content: {
    flex: 1,
    padding: "30px",
    overflowY: "auto"
  }

};

export default DashboardPorteiroLayout;