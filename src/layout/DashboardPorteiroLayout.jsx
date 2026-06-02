import {
  Outlet,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  FaBox,
  FaClipboardList,
  FaUsers,
  FaSignOutAlt,
  FaBook,
  FaChartPie
} from "react-icons/fa";

import { useEffect, useState } from "react";

function DashboardPorteiroLayout() {

  const navigate = useNavigate();

  const location = useLocation();

  const [usuarioLogado, setUsuarioLogado] =
    useState(null);

  /* =========================
     CARREGA USUÁRIO
  ========================= */

  useEffect(() => {

    const usuarioSalvo =
      localStorage.getItem("sessaoPorteiro") ||
      sessionStorage.getItem("sessaoPorteiro");

    if (usuarioSalvo) {

      try {

        const usuario =
          JSON.parse(usuarioSalvo);

        if (
          usuario.tipo !== "porteiro"
        ) {

          navigate("/login/porteiro");

          return;

        }

        setUsuarioLogado(usuario);

      } catch {

        localStorage.removeItem(
          "sessaoPorteiro"
        );

        sessionStorage.removeItem(
          "sessaoPorteiro"
        );

        navigate("/login/porteiro");

      }

    } else {

      navigate("/login/porteiro");

    }

  }, [navigate]);

  /* =========================
     MENU ATIVO
  ========================= */

  function ativo(path) {

    return location.pathname === path;

  }

  /* =========================
     LOGOUT
  ========================= */

  function sair() {

    localStorage.removeItem(
      "sessaoPorteiro"
    );

    sessionStorage.removeItem(
      "sessaoPorteiro"
    );

    navigate("/");

  }

  return (

    <div style={styles.container}>

      {/* SIDEBAR */}

      <aside style={styles.sidebar}>

        <div>

          {/* LOGO */}

          <div style={styles.logoBox}>

            <div style={styles.logoIcon}>
              🏢
            </div>

            <div>

              <h2 style={styles.logo}>
                Condomínio
              </h2>

              <p style={styles.logoSub}>
                Portaria Digital
              </p>

            </div>

          </div>

          {/* STATUS */}

          <div style={styles.statusBox}>

            <div style={styles.statusDot}></div>

            <span style={styles.statusText}>
              Plantão ativo
            </span>

          </div>

          {/* USUÁRIO */}

          <div style={styles.userBox}>

            <div style={styles.avatar}>
              👤
            </div>

            <div>

              <div style={styles.userName}>
                {usuarioLogado?.nome ||
                  "Porteiro"}
              </div>

              <div style={styles.userRole}>
                Operador da portaria
              </div>

              {usuarioLogado?.turno && (

                <div style={styles.userShift}>
                  Turno: {usuarioLogado.turno}
                </div>

              )}

            </div>

          </div>

          {/* MENU */}

          <div style={styles.menuLabel}>
            MENU OPERACIONAL
          </div>

          <nav style={styles.menu}>

            <Link
              to="/dashboard/porteiro"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro")
                  ? styles.active
                  : {})
              }}
            >
              <span style={styles.menuIcon}>
                <FaChartPie />
              </span>

              <span>
                Dashboard
              </span>
            </Link>

            <Link
              to="/dashboard/porteiro/encomendas"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro/encomendas")
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
              to="/dashboard/porteiro/visitantes"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro/visitantes")
                  ? styles.active
                  : {})
              }}
            >
              <span style={styles.menuIcon}>
                <FaClipboardList />
              </span>

              <span>
                Visitantes
              </span>
            </Link>

            <Link
              to="/dashboard/porteiro/moradores"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro/moradores")
                  ? styles.active
                  : {})
              }}
            >
              <span style={styles.menuIcon}>
                <FaUsers />
              </span>

              <span>
                Moradores
              </span>
            </Link>

            <Link
              to="/dashboard/porteiro/ocorrencias"
              style={{
                ...styles.menuItem,
                ...(ativo("/dashboard/porteiro/ocorrencias")
                  ? styles.active
                  : {})
              }}
            >
              <span style={styles.menuIcon}>
                <FaBook />
              </span>

              <span>
                Livro de Ocorrências
              </span>
            </Link>

          </nav>

        </div>

        {/* FOOTER */}

        <div style={styles.sidebarFooter}>

          <div style={styles.footerCard}>

            <p style={styles.footerTitle}>
              Central da Portaria
            </p>

            <p style={styles.footerText}>
              Registre, acompanhe e mantenha o plantão organizado.
            </p>

          </div>

          <button
            style={styles.logoutButton}
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
      "linear-gradient(180deg,#052e16,#14532d,#166534)",
    color: "white",
    padding: "26px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "8px 0 35px rgba(5,46,22,0.22)",
    position: "relative",
    overflow: "hidden"
  },

  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px"
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
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
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

  statusBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    background: "rgba(220,252,231,0.12)",
    border: "1px solid rgba(220,252,231,0.22)",
    padding: "9px 12px",
    borderRadius: "999px",
    marginBottom: "18px"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 0 5px rgba(34,197,94,0.16)"
  },

  statusText: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#dcfce7"
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

  userShift: {
    marginTop: "5px",
    color: "#bbf7d0",
    fontSize: "12px",
    fontWeight: "700"
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

  menuItem: {
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
      "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.20)",
    boxShadow: "0 14px 28px rgba(34,197,94,0.24)"
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

  logoutButton: {
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

export default DashboardPorteiroLayout;