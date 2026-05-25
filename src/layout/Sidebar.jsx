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
  FaSignOutAlt,
  FaExchangeAlt,
  FaCog
} from "react-icons/fa";

function Sidebar() {

  return (

    <div style={styles.sidebar}>

      {/* LOGO */}

      <div style={styles.logoContainer}>

        <div style={styles.logoIcon}>
          🏢
        </div>

        <div>

          <h2 style={styles.logo}>
            Condomínio
          </h2>

          <p style={styles.logoSub}>
            Residencial
          </p>

        </div>

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


        {/* MOVIMENTAÇÕES */}

        <NavLink
          to="/dashboard/movimentacoes"
          style={({ isActive }) => ({
            ...styles.item,
            ...(isActive && styles.active)
          })}
        >
          <FaExchangeAlt />
          Movimentações
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
          <FaCog />
          Configurações
        </NavLink>

      </div>


      {/* FOOTER */}

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
    width: "260px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#14532d,#166534,#052e16)",
    color: "white",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "4px 0 20px rgba(0,0,0,0.15)"
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "35px"
  },

  logoIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    backdropFilter: "blur(10px)"
  },

  logo: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700"
  },

  logoSub: {
    margin: 0,
    opacity: 0.7,
    fontSize: "13px"
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
    gap: "12px",
    textDecoration: "none",
    color: "white",
    padding: "14px 16px",
    borderRadius: "14px",
    fontSize: "15px",
    fontWeight: "600",
    transition: "0.25s"
  },

  active: {
    background: "rgba(255,255,255,0.16)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
  },

  footer: {
    marginTop: "25px"
  },

  logout: {
    width: "100%",
    background: "rgba(255,255,255,0.12)",
    border: "none",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700",
    transition: "0.2s"
  }

};

export default Sidebar;