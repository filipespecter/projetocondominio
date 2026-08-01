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
  FaCommentDots,
  FaBars,
  FaTimes
} from "react-icons/fa";

import { useEffect, useState } from "react";
import logoStar from "../assets/images/logo-star-infinity.png";
import useResponsive from "../hooks/useResponsive";

function DashboardMoradorLayout() {

  const location = useLocation();

  const navigate = useNavigate();

  const {
    isMobileSmall,
    isMobile,
    isTabletSmall,
    isTablet
  } = useResponsive();
  const isMenuBreakpoint = isMobile || isTablet;
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

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

  function larguraPainel() {
    if (isMobileSmall) return { width: "84%", maxWidth: "240px" };
    if (isMobile) return { width: "72%", maxWidth: "270px" };
    if (isTabletSmall) return { width: "48%", maxWidth: "300px" };
    return { width: "36%", maxWidth: "320px" };
  }

  // Cabeçalho do painel (logo + avatar) mais compacto quando o menu
  // é aberto em mobile/tablet, evitando texto espremido.
  const compacto = {
    logoBox: isMenuBreakpoint
      ? { ...styles.logoBox, gap: "10px", padding: "10px" }
      : styles.logoBox,
    logoIcon: isMenuBreakpoint
      ? { ...styles.logoIcon, width: "52px", height: "52px", borderRadius: "16px" }
      : styles.logoIcon,
    logo: isMenuBreakpoint
      ? { ...styles.logo, fontSize: "17px" }
      : styles.logo,
    logoSub: isMenuBreakpoint
      ? { ...styles.logoSub, fontSize: "10px" }
      : styles.logoSub,
    userBox: isMenuBreakpoint
      ? { ...styles.userBox, padding: "12px", gap: "10px" }
      : styles.userBox,
    avatar: isMenuBreakpoint
      ? { ...styles.avatar, width: "42px", height: "42px", borderRadius: "14px" }
      : styles.avatar
  };

  const sidebarStyle = isMenuBreakpoint
    ? {
        ...styles.sidebar,
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 60,
        ...larguraPainel(),
        minWidth: "0",
        padding: "14px",
        paddingTop: "78px",
        transform: menuAberto ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s ease"
      }
    : styles.sidebar;

  const contentStyle = isMenuBreakpoint
    ? {
        ...styles.content,
        padding: isMobile ? "18px" : "26px",
        paddingTop: "84px"
      }
    : styles.content;

  return (

    <div
      style={
        isMenuBreakpoint
          ? { ...styles.container, flexDirection: "column" }
          : styles.container
      }
    >

      {isMenuBreakpoint && (
        <header style={styles.mobileBar}>
          <button
            type="button"
            style={styles.menuToggle}
            onClick={() => setMenuAberto((v) => !v)}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          >
            {menuAberto ? <FaTimes /> : <FaBars />}
          </button>

          <img
            src={logoStar}
            alt="Star Infinity Code"
            style={styles.mobileLogo}
          />

          <span style={styles.mobileTitle}>InfinityCondo</span>
        </header>
      )}

      {isMenuBreakpoint && menuAberto && (
        <div
          style={styles.overlay}
          onClick={() => setMenuAberto(false)}
        ></div>
      )}

      {/* SIDEBAR */}

      <aside style={sidebarStyle}>

        <div style={styles.sidebarGlow}></div>
        <div style={styles.sidebarGrid}></div>

        <div>

          {/* LOGO */}

          <div style={compacto.logoBox}>

            <div style={compacto.logoIcon}>
              <img
                src={logoStar}
                alt="Star Infinity Code"
                style={styles.logoImage}
              />
            </div>

            <div>

              <h2 style={compacto.logo}>
                InfinityCondo
              </h2>

              <p style={compacto.logoSub}>
                Portal Residencial
              </p>

            </div>

          </div>

          {/* USUÁRIO */}

          <div style={compacto.userBox}>

            <div style={compacto.avatar}>
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

      <main style={contentStyle}>

        <Outlet />

      </main>

    </div>

  );

}

const styles = {

  container: {
    display: "flex",
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.12),transparent 30%), linear-gradient(180deg,#ffffff,#f8f5ff)",
    fontFamily: "Arial"
  },

  sidebar: {
    width: "306px",
    minWidth: "306px",
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left,rgba(168,85,247,0.26),transparent 30%), radial-gradient(circle at bottom right,rgba(59,130,246,0.14),transparent 32%), linear-gradient(180deg,#1e1b4b,#2e1065,#4c1d95,#6d28d9)",
    color: "white",
    padding: "26px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow:
      "12px 0 44px rgba(88,28,135,0.22), inset -1px 0 0 rgba(255,255,255,0.10)",
    position: "relative",
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box"
  },

  sidebarGlow: {
    position: "absolute",
    width: "220px",
    height: "220px",
    borderRadius: "50%",
    background: "rgba(168,85,247,0.20)",
    filter: "blur(55px)",
    top: "-80px",
    right: "-90px",
    pointerEvents: "none"
  },

  sidebarGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    opacity: 0.45,
    pointerEvents: "none"
  },

  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px",
    position: "relative",
    zIndex: 2,
    padding: "12px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.13),rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 16px 34px rgba(0,0,0,0.14)"
  },

  logoIcon: {
    width: "74px",
    height: "74px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,243,255,0.88))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 14px 28px rgba(0,0,0,0.18), 0 0 28px rgba(168,85,247,0.18)",
    overflow: "hidden",
    flexShrink: 0
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: "6px",
    boxSizing: "border-box"
  },

  logo: {
    margin: 0,
    fontSize: "21px",
    fontWeight: "900",
    letterSpacing: "-0.3px"
  },

  logoSub: {
    margin: "4px 0 0",
    color: "rgba(255,255,255,0.72)",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
  },

  statusBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "9px 12px",
    borderRadius: "999px",
    marginBottom: "18px",
    position: "relative",
    zIndex: 2
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#a855f7",
    boxShadow: "0 0 0 5px rgba(168,85,247,0.18)"
  },

  statusText: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#f5f3ff"
  },

  userBox: {
    background: "rgba(255,255,255,0.11)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "24px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "26px",
    boxShadow: "0 14px 30px rgba(0,0,0,0.14)",
    backdropFilter: "blur(12px)",
    position: "relative",
    zIndex: 2
  },

  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    flexShrink: 0,
    boxShadow: "0 12px 24px rgba(168,85,247,0.24)"
  },

  userName: {
    fontSize: "16px",
    fontWeight: "900",
    marginBottom: "3px"
  },

  userRole: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.72)",
    fontWeight: "700"
  },

  userShift: {
    marginTop: "5px",
    color: "#ddd6fe",
    fontSize: "12px",
    fontWeight: "800"
  },

  menuLabel: {
    color: "rgba(255,255,255,0.42)",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1.5px",
    margin: "0 0 12px 6px",
    position: "relative",
    zIndex: 2
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    position: "relative",
    zIndex: 2
  },

  item: {
    color: "rgba(255,255,255,0.86)",
    textDecoration: "none",
    padding: "14px 15px",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.075)",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "0.2s",
    fontWeight: "850",
    fontSize: "14px"
  },

  menuItem: {
    color: "rgba(255,255,255,0.86)",
    textDecoration: "none",
    padding: "14px 15px",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.075)",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "0.2s",
    fontWeight: "850",
    fontSize: "14px"
  },

  menuIcon: {
    width: "35px",
    height: "35px",
    borderRadius: "13px",
    background: "rgba(255,255,255,0.11)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    flexShrink: 0
  },

  active: {
    background: "linear-gradient(135deg,#6d28d9,#a855f7)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.24)",
    boxShadow: "0 14px 28px rgba(168,85,247,0.28)"
  },

  sidebarFooter: {
    marginTop: "24px",
    position: "relative",
    zIndex: 2
  },

  footerCard: {
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "22px",
    padding: "16px",
    marginBottom: "14px",
    boxShadow: "0 12px 26px rgba(0,0,0,0.10)"
  },

  footerTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "900"
  },

  footerText: {
    margin: "7px 0 0",
    color: "rgba(255,255,255,0.64)",
    fontSize: "12px",
    lineHeight: "1.45"
  },

  logout: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.11)",
    color: "white",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "900"
  },

  logoutButton: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.11)",
    color: "white",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "900"
  },

  content: {
    flex: 1,
    padding: "30px",
    overflowY: "auto",
    overflowX: "hidden",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.14),transparent 28%), radial-gradient(circle at bottom left,rgba(59,130,246,0.08),transparent 30%), linear-gradient(180deg,#ffffff,#f8f5ff)"
  },

  mobileBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "64px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 16px",
    background: "linear-gradient(135deg,#2e1065,#5b21b6,#7c3aed)",
    boxShadow: "0 8px 24px rgba(88,28,135,0.24)",
    zIndex: 70,
    boxSizing: "border-box"
  },

  menuToggle: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.14)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    cursor: "pointer"
  },

  mobileLogo: {
    width: "32px",
    height: "32px",
    objectFit: "contain",
    flexShrink: 0
  },

  mobileTitle: {
    color: "white",
    fontWeight: "900",
    fontSize: "16px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,11,32,0.55)",
    zIndex: 55
  }

};

export default DashboardMoradorLayout;