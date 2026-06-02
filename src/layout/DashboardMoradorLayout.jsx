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
  FaSignOutAlt,
  FaCommentDots
} from "react-icons/fa";

import { useEffect, useState } from "react";

function DashboardMoradorLayout() {

  const location = useLocation();

  const navigate = useNavigate();

  const [moradorLogado, setMoradorLogado] =
    useState(null);

  /* =========================
     CARREGAR SESSÃO
  ========================= */

  useEffect(() => {

    const usuarioSalvo =
      localStorage.getItem("sessaoMorador") ||
      sessionStorage.getItem("sessaoMorador");

    if (usuarioSalvo) {

      try {

        const usuario =
          JSON.parse(usuarioSalvo);

        if (usuario.tipo !== "morador") {

          navigate("/login/morador");

          return;

        }

        setMoradorLogado(usuario);

      } catch {

        localStorage.removeItem(
          "sessaoMorador"
        );

        sessionStorage.removeItem(
          "sessaoMorador"
        );

        navigate("/login/morador");

      }

    } else {

      navigate("/login/morador");

    }

  }, [navigate]);

  function active(path) {

    return location.pathname === path;

  }

  /* =========================
     LOGOUT
  ========================= */

  function sair() {

    localStorage.removeItem(
      "sessaoMorador"
    );

    sessionStorage.removeItem(
      "sessaoMorador"
    );

    navigate("/", {
      replace: true
    });

  }

  return (

    <div style={styles.container}>

      {/* SIDEBAR */}

      <aside style={styles.sidebar}>

        <div>

          {/* LOGO */}

          <div style={styles.logoBox}>

            <div style={styles.logoIcon}>
              🏠
            </div>

            <div>

              <h2 style={styles.logo}>
                Morador
              </h2>

              <p style={styles.logoSub}>
                Portal Residencial
              </p>

            </div>

          </div>

          {/* USUÁRIO */}

          <div style={styles.userBox}>

            <div style={styles.avatar}>
              👤
            </div>

            <div>

              <div style={styles.userName}>
                {moradorLogado?.nome ||
                  "Morador"}
              </div>

              <div style={styles.userRole}>
                Apartamento{" "}
                {moradorLogado?.apartamento ||
                  "-"}
              </div>

            </div>

          </div>

          {/* MENU */}

          <div style={styles.menuLabel}>
            MENU DO MORADOR
          </div>

          <nav style={styles.menu}>

            <Link
              to="/dashboard/morador"
              style={{
                ...styles.item,
                ...(active("/dashboard/morador")
                  ? styles.active
                  : {})
              }}
            >
              <span style={styles.menuIcon}>
                <FaHome />
              </span>

              <span>
                Dashboard
              </span>
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
              <span style={styles.menuIcon}>
                <FaBullhorn />
              </span>

              <span>
                Avisos
              </span>
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
              <span style={styles.menuIcon}>
                <FaBox />
              </span>

              <span>
                Encomendas
              </span>
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
              <span style={styles.menuIcon}>
                <FaCalendarAlt />
              </span>

              <span>
                Reservas
              </span>
            </Link>

            <Link
              to="/dashboard/morador/sugestoes"
              style={{
                ...styles.item,
                ...(active("/dashboard/morador/sugestoes")
                  ? styles.active
                  : {})
              }}
            >
              <span style={styles.menuIcon}>
                <FaCommentDots />
              </span>

              <span>
                Sugestões / Reclamações
              </span>
            </Link>

          </nav>

        </div>

        {/* FOOTER */}

        <div style={styles.sidebarFooter}>

          <div style={styles.footerCard}>

            <p style={styles.footerTitle}>
              Portal do Morador
            </p>

            <p style={styles.footerText}>
              Acompanhe avisos, encomendas, reservas e solicitações do condomínio.
            </p>

          </div>

          <button
            style={styles.logout}
            onClick={sair}
          >

            <FaSignOutAlt />

            Encerrar sessão

          </button>

        </div>

      </aside>

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
    background: "#f3f4f6",
    fontFamily: "Arial"
  },

  sidebar: {
    width: "292px",
    minWidth: "292px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#0f172a,#1e3a8a,#2563eb)",
    color: "white",
    padding: "26px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "8px 0 35px rgba(15,23,42,0.22)",
    position: "relative",
    overflow: "hidden"
  },

  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px"
  },

  logoIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px",
    boxShadow:
      "inset 0 0 0 1px rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)"
  },

  logo: {
    margin: 0,
    fontSize: "21px",
    fontWeight: "800",
    letterSpacing: "-0.3px"
  },

  logoSub: {
    margin: "4px 0 0",
    color: "rgba(255,255,255,0.68)",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
  },

  userBox: {
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "24px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "26px",
    boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
    backdropFilter: "blur(12px)"
  },

  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    flexShrink: 0
  },

  userName: {
    fontSize: "16px",
    fontWeight: "800",
    marginBottom: "3px"
  },

  userRole: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600"
  },

  menuLabel: {
    color: "rgba(255,255,255,0.42)",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1.5px",
    margin: "0 0 12px 6px"
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  item: {
    color: "rgba(255,255,255,0.86)",
    textDecoration: "none",
    padding: "14px 15px",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.07)",
    transition: "0.2s",
    fontWeight: "800",
    fontSize: "14px"
  },

  menuIcon: {
    width: "35px",
    height: "35px",
    borderRadius: "13px",
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    flexShrink: 0
  },

  active: {
    background:
      "linear-gradient(135deg,#38bdf8,#2563eb)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.20)",
    boxShadow:
      "0 14px 28px rgba(37,99,235,0.28)"
  },

  sidebarFooter: {
    marginTop: "24px"
  },

  footerCard: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "22px",
    padding: "16px",
    marginBottom: "14px"
  },

  footerTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "800"
  },

  footerText: {
    margin: "7px 0 0",
    color: "rgba(255,255,255,0.62)",
    fontSize: "12px",
    lineHeight: "1.45"
  },

  logout: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "800"
  },

  content: {
    flex: 1,
    padding: "30px",
    overflowY: "auto",
    background:
      "linear-gradient(180deg,#f8fafc,#f3f4f6)"
  }

};

export default DashboardMoradorLayout;