import { Link, Outlet } from "react-router-dom";

import {
  FaChartPie,
  FaUsers,
  FaUserShield,
  FaBox,
  FaBell,
  FaCalendarAlt,
  FaDoorOpen,
  FaClipboardList,
  FaBuilding,
  FaCog
} from "react-icons/fa";

function DashboardLayout() {

  return (

    <div style={styles.container}>

      {/* MENU LATERAL */}

      <div style={styles.sidebar}>

        <h2 style={styles.logo}>🏢 Condomínio</h2>

        <Link style={styles.menuItem} to="/dashboard/sindico">
          <FaChartPie /> Dashboard
        </Link>

        <Link style={styles.menuItem} to="/dashboard/apartamentos">
          <FaBuilding /> Apartamentos
        </Link>

        <Link style={styles.menuItem} to="/dashboard/moradores">
          <FaUsers /> Moradores
        </Link>

        <Link style={styles.menuItem} to="/dashboard/porteiros">
          <FaUserShield /> Porteiros
        </Link>

        <Link style={styles.menuItem} to="/dashboard/encomendas">
          <FaBox /> Encomendas
        </Link>

        <Link style={styles.menuItem} to="/dashboard/visitantes">
          <FaClipboardList /> Visitantes
        </Link>

        <Link style={styles.menuItem} to="/dashboard/reservas">
          <FaCalendarAlt /> Reservas
        </Link>

        <Link style={styles.menuItem} to="/dashboard/areas-comuns">
          <FaDoorOpen /> Áreas comuns
        </Link>

        <Link style={styles.menuItem} to="/dashboard/avisos">
          <FaBell /> Avisos
        </Link>

        <Link style={styles.menuItem} to="/dashboard/relatorios">
          <FaChartPie /> Relatórios
        </Link>

        <Link style={styles.menuItem} to="/dashboard/configuracoes">
          <FaCog /> Configurações
        </Link>

      </div>

      {/* CONTEÚDO DO SISTEMA */}

      <div style={styles.content}>
        <Outlet />
      </div>

    </div>

  );

}

const styles = {

  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial"
  },

  sidebar: {
    width: "240px",
    backgroundColor: "#1e1e2f",
    color: "white",
    padding: "25px",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  logo: {
    marginBottom: "20px",
    fontSize: "18px"
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "white",
    textDecoration: "none",
    fontSize: "15px",
    padding: "8px 10px",
    borderRadius: "6px"
  },

  content: {
    flex: 1,
    padding: "40px",
    backgroundColor: "#f4f6fb",
    overflowY: "auto"
  }

};

export default DashboardLayout;