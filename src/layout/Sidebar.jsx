import { NavLink } from "react-router-dom";

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
  FaSignOutAlt
} from "react-icons/fa";

function Sidebar() {

  return (

    <div style={styles.sidebar}>

      {/* LOGO */}

      <div style={styles.logoContainer}>

        <h2 style={styles.logo}>

          Condomínio
          <br />
          Residencial

        </h2>

      </div>


      {/* MENU */}

      <div style={styles.menu}>

        <NavLink
          to="/dashboard/sindico"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaChartPie />
          Dashboard
        </NavLink>


        <NavLink
          to="/dashboard/apartamentos"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaBuilding />
          Apartamentos
        </NavLink>


        <NavLink
          to="/dashboard/moradores"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaUsers />
          Moradores
        </NavLink>


        <NavLink
          to="/dashboard/porteiros"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaUserShield />
          Porteiros
        </NavLink>


        <NavLink
          to="/dashboard/encomendas"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaBox />
          Encomendas
        </NavLink>


        <NavLink
          to="/dashboard/visitantes"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaClipboardList />
          Visitantes
        </NavLink>


        <NavLink
          to="/dashboard/areas-comuns"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaDoorOpen />
          Áreas comuns
        </NavLink>


        <NavLink
          to="/dashboard/reservas"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaCalendarAlt />
          Reservas
        </NavLink>


        <NavLink
          to="/dashboard/avisos"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaBell />
          Avisos
        </NavLink>


        <NavLink
          to="/dashboard/relatorios"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaChartPie />
          Relatórios
        </NavLink>


        <NavLink
          to="/dashboard/configuracoes"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaBuilding />
          Configurações
        </NavLink>

      </div>


      {/* SAIR */}

      <div style={styles.footer}>

        <button style={styles.logout}>

          <FaSignOutAlt />
          Sair

        </button>

      </div>

    </div>

  );

}

const styles = {

  sidebar: {
    width: "220px",
    backgroundColor: "#13192d",
    color: "white",
    padding: "20px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100vh"
  },

  logoContainer: {
    marginBottom: "25px"
  },

  logo: {
    fontSize: "18px",
    lineHeight: "24px",
    margin: 0
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "white",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    transition: ".2s"
  },

  active: {
    backgroundColor: "#2563eb"
  },

  footer: {
    marginTop: "20px"
  },

  logout: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    padding: "10px"
  }

};

export default Sidebar;