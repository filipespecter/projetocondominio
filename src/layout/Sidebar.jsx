import { Link } from "react-router-dom";
import {
  FaChartPie,
  FaUsers,
  FaUserShield,
  FaBox,
  FaBell,
  FaCalendarAlt,
  FaDoorOpen,
  FaClipboardList,
  FaBuilding
} from "react-icons/fa";

function Sidebar() {

  return (

    <div style={styles.sidebar}>

      <h2 style={styles.logo}>Condomínio Residencial</h2>

      <Link style={styles.item} to="/dashboard/sindico">
        <FaChartPie /> Dashboard
      </Link>

      <Link style={styles.item} to="/dashboard/apartamentos">
        <FaBuilding /> Apartamentos
      </Link>

      <Link style={styles.item} to="/dashboard/moradores">
        <FaUsers /> Moradores
      </Link>

      <Link style={styles.item} to="/dashboard/porteiros">
        <FaUserShield /> Porteiros
      </Link>

      <Link style={styles.item} to="/dashboard/encomendas">
        <FaBox /> Encomendas
      </Link>

      <Link style={styles.item} to="/dashboard/visitantes">
        <FaClipboardList /> Visitantes
      </Link>

      <Link style={styles.item} to="/dashboard/areas-comuns">
        <FaDoorOpen /> Áreas comuns
      </Link>

      <Link style={styles.item} to="/dashboard/reservas">
        <FaCalendarAlt /> Reservas
      </Link>

      <Link style={styles.item} to="/dashboard/avisos">
        <FaBell /> Avisos
      </Link>

      <Link style={styles.item} to="/dashboard/relatorios">
        <FaChartPie /> Relatórios
      </Link>

      <Link style={styles.item} to="/dashboard/configuracoes">
        <FaBuilding /> Configurações
      </Link>

    </div>

  );

}

const styles = {

  sidebar: {
    width: "240px",
    backgroundColor: "#1c1f3a",
    color: "white",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  logo: {
    marginBottom: "30px"
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "white",
    padding: "8px"
  }

};

export default Sidebar;