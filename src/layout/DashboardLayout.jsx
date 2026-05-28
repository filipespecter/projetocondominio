import {
  Link,
  Outlet,
  useNavigate,
  Navigate,
  useLocation
} from "react-router-dom";

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
  FaCog,
  FaExchangeAlt,
  FaSignOutAlt,
  FaHardHat
} from "react-icons/fa";

function DashboardLayout() {

  const navigate = useNavigate();

  const location = useLocation();

  /* =========================
     CARREGA SESSÃO
  ========================= */

  const sessaoSalva =
    localStorage.getItem("sessaoSindico") ||
    sessionStorage.getItem("sessaoSindico");

  /* =========================
     PROTEÇÃO DE ROTA
  ========================= */

  if (!sessaoSalva) {

    return (
      <Navigate
        to="/login/sindico"
        replace
      />
    );

  }

  let usuarioLogado = null;

  try {

    usuarioLogado =
      JSON.parse(sessaoSalva);

  } catch {

    localStorage.removeItem(
      "sessaoSindico"
    );

    sessionStorage.removeItem(
      "sessaoSindico"
    );

    return (
      <Navigate
        to="/login/sindico"
        replace
      />
    );

  }

  /* =========================
     LOGOUT
  ========================= */

  function sair() {

    localStorage.removeItem(
      "sessaoSindico"
    );

    sessionStorage.removeItem(
      "sessaoSindico"
    );

    navigate("/", {
      replace: true
    });

  }

  /* =========================
     MENU ATIVO
  ========================= */

  function itemAtivo(path) {

    return location.pathname === path;

  }

  return (

    <div style={styles.container}>

      {/* SIDEBAR */}

      <div style={styles.sidebar}>

        <div>

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
                Sistema Residencial
              </p>

            </div>

          </div>

          {/* USUÁRIO */}

          <div style={styles.userBox}>

            <div style={styles.userAvatar}>
              👤
            </div>

            <div>

              <div style={styles.userName}>

                {usuarioLogado?.nome ||
                  "Administrador"}

              </div>

              <div style={styles.userRole}>
                Síndico / Administrador
              </div>

            </div>

          </div>

          {/* MENU */}

          <div style={styles.menu}>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/sindico")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/sindico"
            >
              <FaChartPie />
              Dashboard
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/apartamentos")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/apartamentos"
            >
              <FaBuilding />
              Apartamentos
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/moradores")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/moradores"
            >
              <FaUsers />
              Moradores
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/porteiros")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/porteiros"
            >
              <FaUserShield />
              Porteiros
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/encomendas")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/encomendas"
            >
              <FaBox />
              Encomendas
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/visitantes")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/visitantes"
            >
              <FaClipboardList />
              Visitantes
            </Link>

            {/* NOVO MENU PRESTADORES */}

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/prestadores")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/prestadores"
            >
              <FaHardHat />
              Prestadores
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/movimentacoes")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/movimentacoes"
            >
              <FaExchangeAlt />
              Movimentações
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/reservas")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/reservas"
            >
              <FaCalendarAlt />
              Reservas
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/areas-comuns")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/areas-comuns"
            >
              <FaDoorOpen />
              Áreas comuns
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/avisos")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/avisos"
            >
              <FaBell />
              Avisos
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/relatorios")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/relatorios"
            >
              <FaChartPie />
              Relatórios
            </Link>

            <Link
              style={{
                ...styles.menuItem,
                ...(itemAtivo("/dashboard/configuracoes")
                  ? styles.active
                  : {})
              }}
              to="/dashboard/configuracoes"
            >
              <FaCog />
              Configurações
            </Link>

          </div>

        </div>

        {/* FOOTER */}

        <div style={styles.footer}>

          <button
            style={styles.logoutButton}
            onClick={sair}
          >

            <FaSignOutAlt />

            Sair

          </button>

        </div>

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
    background: "#f5f7fb",
    fontFamily: "Arial"
  },

  sidebar: {
    width: "270px",
    minWidth: "270px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#14532d,#166534,#052e16)",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "4px 0 25px rgba(0,0,0,0.12)"
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "25px"
  },

  logoIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    backdropFilter: "blur(10px)"
  },

  logo: {
    color: "white",
    margin: 0,
    fontSize: "20px",
    fontWeight: "700"
  },

  logoSub: {
    margin: "4px 0 0",
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px"
  },

  userBox: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "28px"
  },

  userAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px"
  },

  userName: {
    color: "white",
    fontWeight: "700",
    fontSize: "15px"
  },

  userRole: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "12px",
    marginTop: "3px"
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "white",
    textDecoration: "none",
    padding: "14px 16px",
    borderRadius: "14px",
    fontSize: "15px",
    fontWeight: "600",
    transition: "0.2s",
    background: "transparent"
  },

  active: {
    background: "rgba(255,255,255,0.16)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
  },

  footer: {
    marginTop: "20px"
  },

  logoutButton: {
    width: "100%",
    background: "rgba(255,255,255,0.12)",
    border: "none",
    color: "white",
    padding: "14px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    fontWeight: "700"
  },

  content: {
    flex: 1,
    padding: "35px",
    overflowY: "auto",
    background: "#f5f7fb"
  }

};

export default DashboardLayout;