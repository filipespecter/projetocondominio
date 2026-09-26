import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  FaChartLine,
  FaBuilding,
  FaUsers,
  FaAddressBook,
  FaTags,
  FaFileInvoiceDollar,
  FaClipboardList,
  FaServer,
  FaHeadset,
  FaTasks,
  FaSignOutAlt,
  FaShieldAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import logoStar from "../assets/images/logo-star-infinity.png";
import authApi from "../Services/authApi.js";

const menu = [
  {
    label: "Dashboard",
    icon: <FaChartLine />,
    to: "/platform",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ],
  },
  {
    label: "Condomínios",
    icon: <FaBuilding />,
    to: "/platform/condominios",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ],
  },
  {
    label: "Clientes",
    icon: <FaAddressBook />,
    to: "/platform/clientes",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ],
  },
  {
    label: "Usuários",
    icon: <FaUsers />,
    to: "/platform/usuarios",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
    ],
  },
  {
    label: "Planos",
    icon: <FaTags />,
    to: "/platform/planos",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ],
  },
  {
    label: "Financeiro",
    icon: <FaFileInvoiceDollar />,
    to: "/platform/financeiro",
    enabled: true,
    ownerOnly: true,
  },
  {
    label: "Auditoria",
    icon: <FaClipboardList />,
    to: "/platform/auditoria",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ],
  },
  {
    label: "Eventos",
    icon: <FaServer />,
    to: "/platform/eventos",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ],
  },
  {
    label: "Suporte",
    icon: <FaHeadset />,
    to: "/platform/suporte",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ],
  },
  {
    label: "Jobs / Backups",
    icon: <FaTasks />,
    to: "/platform/operacoes",
    enabled: true,
    roles: [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
    ],
  },
];

/**
 * =====================================================
 * CENTRAL STAR INFINITY CODE - LAYOUT
 * =====================================================
 *
 * Layout exclusivo da administração da plataforma.
 *
 * Não reutiliza DashboardLayout do condomínio para
 * não misturar usuários internos da Star com
 * síndico/administrador de condomínio.
 */
function PlatformLayout() {
  const navigate =
    useNavigate();

  const [
    platformUser,
    setPlatformUser,
  ] = useState(null);

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPlatformUser() {
      try {
        const user =
          await authApi.me();

        if (mounted) {
          setPlatformUser(
            user
          );
        }
      } catch {
        if (mounted) {
          setPlatformUser(
            null
          );
        }
      }
    }

    loadPlatformUser();

    return () => {
      mounted = false;
    };
  }, []);

  const role =
    String(
      platformUser?.role ?? ""
    )
      .trim()
      .toUpperCase();

  const visibleMenu =
    useMemo(
      () =>
        menu.filter(
          (item) => {
            if (
              item.ownerOnly
            ) {
              return (
                role ===
                "PLATFORM_OWNER"
              );
            }

            if (
              Array.isArray(
                item.roles
              )
            ) {
              return item.roles
                .includes(
                  role
                );
            }

            return true;
          }
        ),
      [role]
    );

  function getRoleLabel() {
    if (
      role ===
      "PLATFORM_OWNER"
    ) {
      return "PLATFORM OWNER";
    }

    if (
      role ===
      "PLATFORM_ADMIN"
    ) {
      return "PLATFORM ADMIN";
    }

    if (
      role ===
      "PLATFORM_SUPPORT"
    ) {
      return "PLATFORM SUPPORT";
    }

    return "CENTRAL STAR";
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {




      navigate(
        "/login/platform",
        {
          replace: true,
        }
      );
    }
  }

  return (
    <div style={styles.shell}>
      <style>{responsiveCss}</style>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="platform-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`platform-sidebar ${sidebarOpen ? "open" : ""}`}
        style={styles.sidebar}
      >
        <div style={styles.brand}>
          <img
            src={logoStar}
            alt="Star Infinity Code"
            style={styles.logo}
          />

          <div>
            <strong style={styles.brandTitle}>
              Central Star
            </strong>

            <span style={styles.brandSubtitle}>
              InfinityCondo Platform
            </span>
          </div>
        </div>

        <div style={styles.platformBadge}>
          <FaShieldAlt />

          <span>
            {getRoleLabel()}
          </span>
        </div>

        <nav style={styles.nav}>
          {visibleMenu.map((item) => {
            if (item.enabled) {
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    ...styles.menuItem,
                    ...(isActive
                      ? styles.menuItemActive
                      : {}),
                  })}
                >
                  <span style={styles.menuIcon}>
                    {item.icon}
                  </span>

                  {item.label}
                </NavLink>
              );
            }

            return (
              <div
                key={item.label}
                style={{
                  ...styles.menuItem,
                  ...styles.menuItemDisabled,
                }}
                title="Será conectado nas próximas etapas do Bloco 10"
              >
                <span style={styles.menuIcon}>
                  {item.icon}
                </span>

                <span style={styles.menuLabel}>
                  {item.label}
                </span>

                <small style={styles.soon}>
                  EM BREVE
                </small>
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          style={styles.logout}
        >
          <FaSignOutAlt />
          Sair da Central
        </button>
      </aside>

      <main className="platform-main" style={styles.main}>
        <header style={styles.header}>
          <button
            type="button"
            className="platform-menu-button"
            style={styles.mobileMenu}
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Abrir menu da Central"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div>
            <span style={styles.headerEyebrow}>
              STAR INFINITY CODE
            </span>

            <h1 style={styles.headerTitle}>
              Central de Administração
            </h1>
          </div>

          <div style={styles.environment}>
            <span style={styles.statusDot} />
            Plataforma protegida
          </div>
        </header>

        <section style={styles.content}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}

const responsiveCss = `
  .platform-backdrop { display:none; }
  @media (max-width: 900px) {
    .platform-sidebar {
      transform: translateX(-105%);
      transition: transform .25s ease;
      z-index: 1200;
    }
    .platform-sidebar.open { transform: translateX(0); }
    .platform-main {
      width: 100% !important;
      margin-left: 0 !important;
    }
    .platform-menu-button { display: inline-flex !important; }
    .platform-backdrop {
      display:block;
      position:fixed;
      inset:0;
      z-index:1190;
      border:0;
      background:rgba(15,8,25,.48);
      backdrop-filter:blur(3px);
    }
  }
  @media (max-width: 620px) {
    .platform-sidebar { width: min(86vw,300px) !important; }
  }
`;

const styles = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    background: "#f6f4fb",
    color: "#1f1730",
    fontFamily: "Arial",
  },

  sidebar: {
    width: "272px",
    minHeight: "100vh",
    position: "fixed",
    inset: "0 auto 0 0",
    display: "flex",
    flexDirection: "column",
    padding: "24px 18px",
    boxSizing: "border-box",
    background:
      "linear-gradient(180deg,#130c24 0%,#20103d 55%,var(--ic-primary-deepest) 100%)",
    boxShadow:
      "10px 0 35px rgba(38,20,66,0.12)",
    color: "#ffffff",
    overflowY: "auto",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 8px 20px",
  },

  logo: {
    width: "46px",
    height: "46px",
    objectFit: "contain",
  },

  brandTitle: {
    display: "block",
    fontSize: "18px",
  },

  brandSubtitle: {
    display: "block",
    marginTop: "3px",
    color: "#d7bd70",
    fontSize: "11px",
  },

  platformBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "18px",
    padding: "10px 12px",
    border:
      "1px solid rgba(200,168,92,0.34)",
    borderRadius: "12px",
    background:
      "rgba(200,168,92,0.10)",
    color: "#ead28d",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.7px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    flex: 1,
  },

  menuItem: {
    minHeight: "42px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "0 12px",
    borderRadius: "10px",
    color: "var(--ic-primary-border-soft)",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
    boxSizing: "border-box",
  },

  menuItemActive: {
    color: "#ffffff",
    background:
      "linear-gradient(90deg,var(--ic-primary),var(--ic-primary-bright))",
    boxShadow:
      "0 8px 22px rgb(var(--ic-primary-rgb) / 0.26)",
  },

  menuItemDisabled: {
    opacity: 0.55,
    cursor: "default",
  },

  menuIcon: {
    width: "18px",
    display: "inline-flex",
    justifyContent: "center",
  },

  menuLabel: {
    flex: 1,
  },

  soon: {
    marginLeft: "auto",
    color: "var(--ic-primary-border)",
    fontSize: "8px",
    letterSpacing: "0.4px",
  },

  logout: {
    marginTop: "18px",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    border:
      "1px solid rgba(255,255,255,0.14)",
    borderRadius: "11px",
    background:
      "rgba(255,255,255,0.07)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  main: {
    width: "calc(100% - 272px)",
    marginLeft: "272px",
    minHeight: "100vh",
  },

  header: {
    minHeight: "92px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "18px 30px",
    boxSizing: "border-box",
    background: "#ffffff",
    borderBottom:
      "1px solid #ebe7f3",
  },

  headerEyebrow: {
    color: "#a17a28",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.2px",
  },

  headerTitle: {
    margin: "5px 0 0",
    fontSize: "clamp(22px,2.4vw,30px)",
    letterSpacing: "-0.55px",
  },

  environment: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 12px",
    borderRadius: "999px",
    background: "#f4f0ff",
    color: "var(--ic-primary-dark)",
    fontSize: "12px",
    fontWeight: "700",
  },

  mobileMenu: {
    display: "none",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "1px solid #e6deeb",
    background: "#ffffff",
    color: "var(--ic-primary-dark)",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
  },

  content: {
    padding: "28px 30px 40px",
  },
};

export default PlatformLayout;
