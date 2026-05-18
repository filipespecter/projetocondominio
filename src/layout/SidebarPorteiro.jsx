import { Link, useLocation } from "react-router-dom";

import {
  FaChartPie,
  FaBox,
  FaUsers,
  FaClipboardList,
  FaSignOutAlt
} from "react-icons/fa";

function SidebarPorteiro() {

  const location = useLocation();

  function active(path) {
    return location.pathname === path;
  }

  return (

    <aside style={styles.sidebar}>

      {/* TOPO */}

      <div>

        <h2 style={styles.logo}>
          Condomínio
          <br />
          Residencial
        </h2>

        <div style={styles.menu}>

          <Link
            to="/dashboard/porteiro"
            style={{
              ...styles.item,
              ...(active("/dashboard/porteiro") ? styles.active : {})
            }}
          >
            <FaChartPie size={15} />
            Dashboard
          </Link>

          <Link
            to="/dashboard/porteiro/encomendas"
            style={{
              ...styles.item,
              ...(active("/dashboard/porteiro/encomendas") ? styles.active : {})
            }}
          >
            <FaBox size={15} />
            Encomendas
          </Link>

          <Link
            to="/dashboard/porteiro/visitantes"
            style={{
              ...styles.item,
              ...(active("/dashboard/porteiro/visitantes") ? styles.active : {})
            }}
          >
            <FaClipboardList size={15} />
            Visitantes
          </Link>

          <Link
            to="/dashboard/porteiro/moradores"
            style={{
              ...styles.item,
              ...(active("/dashboard/porteiro/moradores") ? styles.active : {})
            }}
          >
            <FaUsers size={15} />
            Moradores
          </Link>

        </div>

      </div>

      {/* SAIR */}

      <button style={styles.logout}>

        <FaSignOutAlt size={15} />

        Sair

      </button>

    </aside>

  );

}

const styles = {

  sidebar: {
    width: "230px",
    minHeight: "100vh",
    backgroundColor: "#013325",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "20px 16px",
    boxSizing: "border-box"
  },

  logo: {
    fontSize: "20px",
    fontWeight: "700",
    lineHeight: "26px",
    marginBottom: "35px"
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ecfdf5",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    transition: "0.2s"
  },

  active: {
    backgroundColor: "#036143",
    color: "white"
  },

  logout: {
    border: "none",
    background: "transparent",
    color: "#ecfdf5",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: "500"
  }

};

export default SidebarPorteiro;