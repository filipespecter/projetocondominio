import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  FaChartPie,
  FaBox,
  FaUsers,
  FaClipboardList,
  FaSignOutAlt
} from "react-icons/fa";

function SidebarPorteiro() {

  const location = useLocation();

  const navigate = useNavigate();

  function active(path) {

    return location.pathname === path;

  }

  function sair() {

    localStorage.removeItem("usuario");

    navigate("/");

  }

  return (

    <aside style={styles.sidebar}>

      {/* TOPO */}

      <div>

        <div style={styles.brand}>

          <div style={styles.logoBox}>
            🛡️
          </div>

          <div>

            <h2 style={styles.logo}>
              PORTARIA
            </h2>

            <p style={styles.subtitle}>
              Painel Porteiro
            </p>

          </div>

        </div>

        {/* MENU */}

        <nav style={styles.menu}>

          <Link
            to="/dashboard/porteiro"
            style={{
              ...styles.item,
              ...(active("/dashboard/porteiro")
                ? styles.active
                : {})
            }}
          >

            <FaChartPie />

            Dashboard

          </Link>

          <Link
            to="/dashboard/porteiro/visitantes"
            style={{
              ...styles.item,
              ...(active("/dashboard/porteiro/visitantes")
                ? styles.active
                : {})
            }}
          >

            <FaClipboardList />

            Visitantes

          </Link>

          <Link
            to="/dashboard/porteiro/encomendas"
            style={{
              ...styles.item,
              ...(active("/dashboard/porteiro/encomendas")
                ? styles.active
                : {})
            }}
          >

            <FaBox />

            Encomendas

          </Link>

          <Link
            to="/dashboard/porteiro/moradores"
            style={{
              ...styles.item,
              ...(active("/dashboard/porteiro/moradores")
                ? styles.active
                : {})
            }}
          >

            <FaUsers />

            Moradores

          </Link>

        </nav>

      </div>

      {/* RODAPÉ */}

      <button
        style={styles.logout}
        onClick={sair}
      >

        <FaSignOutAlt />

        Sair

      </button>

    </aside>

  );

}

const styles = {

  sidebar: {
    width: "280px",
    minHeight: "100vh",
    background: "#14532d",
    color: "white",
    padding: "30px 22px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "4px 0 15px rgba(0,0,0,0.08)"
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "50px"
  },

  logoBox: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  logo: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700"
  },

  subtitle: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#d1fae5"
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textDecoration: "none",
    color: "#ecfdf5",
    padding: "15px 18px",
    borderRadius: "14px",
    fontSize: "15px",
    fontWeight: "500",
    transition: "0.2s"
  },

  active: {
    background: "white",
    color: "#14532d",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(0,0,0,0.10)"
  },

  logout: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "600",
    fontSize: "15px"
  }

};

export default SidebarPorteiro;