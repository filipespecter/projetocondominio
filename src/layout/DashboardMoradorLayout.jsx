import {
  Outlet,
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  FaHome,
  FaBullhorn,
  FaBox,
  FaCalendarAlt,
  FaSignOutAlt
} from "react-icons/fa";

function DashboardMoradorLayout() {

  const location = useLocation();

  const navigate = useNavigate();

  function active(path) {

    return location.pathname === path;

  }

  /* =========================
     LOGOUT
  ========================= */

  function sair() {

  localStorage.removeItem(
    "usuarioMorador"
  );

  sessionStorage.removeItem(
    "usuarioMorador"
  );

  navigate("/");

}

  return (

    <div style={styles.container}>

      {/* SIDEBAR */}

      <div style={styles.sidebar}>

        <div>

          <h2 style={styles.logo}>
            🏠 MORADOR
          </h2>

          <p style={styles.subtitle}>
            Painel do Morador
          </p>

          <div style={styles.menu}>

            <Link
              to="/dashboard/morador"
              style={{
                ...styles.item,
                ...(active("/dashboard/morador")
                  ? styles.active
                  : {})
              }}
            >
              <FaHome />
              Dashboard
            </Link>

            <Link
              to="/dashboard/morador/avisos"
              style={{
                ...styles.item,
                ...(active("/dashboard/morador/avisos")
                  ? styles.active
                  : {})
              }}
            >
              <FaBullhorn />
              Avisos
            </Link>

            <Link
              to="/dashboard/morador/encomendas"
              style={{
                ...styles.item,
                ...(active("/dashboard/morador/encomendas")
                  ? styles.active
                  : {})
              }}
            >
              <FaBox />
              Encomendas
            </Link>

            <Link
              to="/dashboard/morador/reservas"
              style={{
                ...styles.item,
                ...(active("/dashboard/morador/reservas")
                  ? styles.active
                  : {})
              }}
            >
              <FaCalendarAlt />
              Reservas
            </Link>

          </div>

        </div>

        {/* LOGOUT */}

        <button
          style={styles.logout}
          onClick={sair}
        >

          <FaSignOutAlt />

          Sair

        </button>

      </div>

      {/* CONTEÚDO */}

      <main style={styles.content}>

        <Outlet />

      </main>

    </div>

  );

}

const styles = {

  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f1f5f9"
  },

  sidebar: {
    width: "250px",
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "25px 20px"
  },

  logo: {
    margin: 0,
    fontSize: "24px"
  },

  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
    fontSize: "14px"
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "40px"
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
    color: "#e2e8f0",
    padding: "12px 14px",
    borderRadius: "10px",
    transition: "0.2s"
  },

  active: {
    background: "#1e293b",
    color: "white"
  },

  logout: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "bold"
  },

  content: {
    flex: 1,
    padding: "30px"
  }

};

export default DashboardMoradorLayout;