import { useEffect, useState } from "react";

import {
  Link,
  Outlet,
  useNavigate,
  Navigate,
  useLocation
} from "react-router-dom";

import {
  FaChartPie,
  FaChartLine,
  FaUsers,
  FaUserShield,
  FaBox,
  FaBell,
  FaCalendarAlt,
  FaDoorOpen,
  FaClipboardList,
  FaBuilding,
  FaCog,
  FaSignOutAlt,
  FaHardHat
} from "react-icons/fa";

import { contarNaoLidas } from "../Services/notificacaoService";
import logoStar from "../assets/images/logo-star-infinity.png";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [perfilCondominio, setPerfilCondominio] = useState({
    nomeCondominio: "Condomínio",
    logoUrl: "",
    plano: "Completo"
  });

  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  const planoAtual = perfilCondominio?.plano || "Completo";
  const possuiBI = planoAtual === "Completo";
  const textoPlano = possuiBI ? "Completo" : "Básico";

  const sessaoSalva =
    localStorage.getItem("sessaoSindico") ||
    sessionStorage.getItem("sessaoSindico") ||
    localStorage.getItem("usuarioSindico") ||
    sessionStorage.getItem("usuarioSindico");

  useEffect(() => {
    carregarPerfilCondominio();
    carregarNotificacoes();

    const interval = setInterval(() => {
      carregarPerfilCondominio();
      carregarNotificacoes();
    }, 10000);

    window.addEventListener("storage", carregarPerfilCondominio);
    window.addEventListener("storage", carregarNotificacoes);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", carregarPerfilCondominio);
      window.removeEventListener("storage", carregarNotificacoes);
    };
  }, []);

  function carregarPerfilCondominio() {
    try {
      const perfil =
        JSON.parse(localStorage.getItem("perfil_condominio")) ||
        JSON.parse(localStorage.getItem("configuracoes")) ||
        {};

      setPerfilCondominio({
        nomeCondominio: perfil.nomeCondominio || "Condomínio",
        logoUrl: perfil.logoUrl || perfil.tema?.logoUrl || "",
        plano:
          perfil.plano === "Básico" || perfil.plano === "Completo"
            ? perfil.plano
            : "Completo"
      });
    } catch {
      setPerfilCondominio({
        nomeCondominio: "Condomínio",
        logoUrl: "",
        plano: "Completo"
      });
    }
  }

  function carregarNotificacoes() {
    setNotificacoesNaoLidas(contarNaoLidas("sindico"));
  }

  if (!sessaoSalva) {
    return <Navigate to="/login/sindico" replace />;
  }

  let usuarioLogado = null;

  try {
    usuarioLogado = JSON.parse(sessaoSalva);
  } catch {
    localStorage.removeItem("sessaoSindico");
    sessionStorage.removeItem("sessaoSindico");

    return <Navigate to="/login/sindico" replace />;
  }

  function sair() {
    localStorage.removeItem("sessaoSindico");
    sessionStorage.removeItem("sessaoSindico");
    localStorage.removeItem("usuarioSindico");
    sessionStorage.removeItem("usuarioSindico");

    navigate("/", {
      replace: true
    });
  }

  function itemAtivo(path) {
    return location.pathname === path;
  }

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarGlow}></div>
        <div style={styles.sidebarGrid}></div>

        <div style={styles.sidebarContent}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>
              <img
                src={logoStar}
                alt="Star Infinity Code"
                style={styles.logoImage}
              />
            </div>

            <div>
              <h2 style={styles.logo}>
                InfinityCondo
              </h2>

              <p style={styles.logoSub}>
                {perfilCondominio.nomeCondominio || "Painel Executivo"}
              </p>
            </div>
          </div>

          <div style={styles.premiumBadge}>
            ✨ Plano {textoPlano}
          </div>

          {notificacoesNaoLidas > 0 && (
            <div style={styles.notificationBox}>
              <FaBell />

              <span>
                {notificacoesNaoLidas} notificação
                {notificacoesNaoLidas > 1 ? "ões" : ""} pendente
                {notificacoesNaoLidas > 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div style={styles.userBox}>
            <div style={styles.userAvatar}>
              {usuarioLogado?.perfilAdmin === "sub" ? "🛡️" : "👑"}
            </div>

            <div>
              <div style={styles.userName}>
                {usuarioLogado?.nome || "Administrador"}
              </div>

              <div style={styles.userRole}>
                {usuarioLogado?.perfilAdmin === "sub"
                  ? "Subsíndico"
                  : "Síndico Mestre"}
              </div>

              <div style={styles.onlineLine}>
                <span style={styles.onlineDot}></span>
                Online agora
              </div>
            </div>
          </div>

          <MenuGroup title="VISÃO GERAL">
            <MenuItem
              to="/dashboard/sindico"
              active={itemAtivo("/dashboard/sindico")}
              icon={<FaChartPie />}
              label="Dashboard"
            />
          </MenuGroup>

          <MenuGroup title="GESTÃO">
            <MenuItem
              to="/dashboard/apartamentos"
              active={itemAtivo("/dashboard/apartamentos")}
              icon={<FaBuilding />}
              label="Apartamentos"
            />

            <MenuItem
              to="/dashboard/moradores"
              active={itemAtivo("/dashboard/moradores")}
              icon={<FaUsers />}
              label="Moradores"
            />

            <MenuItem
              to="/dashboard/porteiros"
              active={itemAtivo("/dashboard/porteiros")}
              icon={<FaUserShield />}
              label="Porteiros"
            />

            <MenuItem
              to="/dashboard/prestadores"
              active={itemAtivo("/dashboard/prestadores")}
              icon={<FaHardHat />}
              label="Prestadores"
            />
          </MenuGroup>

          <MenuGroup title="OPERAÇÃO">
            <MenuItem
              to="/dashboard/encomendas"
              active={itemAtivo("/dashboard/encomendas")}
              icon={<FaBox />}
              label="Encomendas"
            />

            <MenuItem
              to="/dashboard/visitantes"
              active={itemAtivo("/dashboard/visitantes")}
              icon={<FaClipboardList />}
              label="Visitantes"
            />

            <MenuItem
              to="/dashboard/reservas"
              active={itemAtivo("/dashboard/reservas")}
              icon={<FaCalendarAlt />}
              label="Reservas"
            />

            <MenuItem
              to="/dashboard/areas-comuns"
              active={itemAtivo("/dashboard/areas-comuns")}
              icon={<FaDoorOpen />}
              label="Áreas comuns"
            />
          </MenuGroup>

          <MenuGroup title="ANÁLISE E GESTÃO">
            <MenuItem
              to="/dashboard/avisos"
              active={itemAtivo("/dashboard/avisos")}
              icon={<FaBell />}
              label={
                notificacoesNaoLidas > 0
                  ? `Avisos (${notificacoesNaoLidas})`
                  : "Avisos"
              }
            />

            <MenuItem
              to="/dashboard/relatorios"
              active={itemAtivo("/dashboard/relatorios")}
              icon={<FaChartPie />}
              label="Relatórios"
            />

            <MenuItem
              to="/dashboard/bi-analytics"
              active={itemAtivo("/dashboard/bi-analytics")}
              icon={<FaChartLine />}
              label="BI Analytics"
            />

            <MenuItem
              to="/dashboard/bi-monitor"
              active={itemAtivo("/dashboard/bi-monitor")}
              icon={<FaChartLine />}
              label="BI Monitor"
            />

            <MenuItem
              to="/dashboard/configuracoes"
              active={itemAtivo("/dashboard/configuracoes")}
              icon={<FaCog />}
              label="Configurações"
            />
          </MenuGroup>
        </div>

        <div style={styles.footer}>
          <div style={styles.footerCard}>
            <p style={styles.footerTitle}>
              Star Infinity Code
            </p>

            <p style={styles.footerText}>
              Produto profissional de gestão condominial.
            </p>
          </div>

          <button style={styles.logoutButton} onClick={sair}>
            <FaSignOutAlt />
            Encerrar sessão
          </button>
        </div>
      </aside>

      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

function MenuGroup({ title, children }) {
  return (
    <div style={styles.menuGroup}>
      <div style={styles.menuGroupTitle}>
        {title}
      </div>

      <nav style={styles.menu}>
        {children}
      </nav>
    </div>
  );
}

function MenuItem({ to, active, icon, label }) {
  return (
    <Link
      to={to}
      style={{
        ...styles.menuItem,
        ...(active ? styles.active : {})
      }}
    >
      <span style={styles.menuIcon}>
        {icon}
      </span>

      <span>
        {label}
      </span>
    </Link>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.14),transparent 30%), linear-gradient(180deg,#ffffff,#f8f5ff)",
    fontFamily: "Arial"
  },

  sidebar: {
    width: "330px",
    minWidth: "330px",
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left,rgba(168,85,247,0.28),transparent 30%), radial-gradient(circle at bottom right,rgba(59,130,246,0.16),transparent 32%), linear-gradient(180deg,#1e1b4b,#2e1065,#4c1d95,#6d28d9)",
    padding: "26px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow:
      "14px 0 50px rgba(88,28,135,0.24), inset -1px 0 0 rgba(255,255,255,0.12)",
    color: "white",
    overflowY: "auto",
    boxSizing: "border-box",
    position: "relative"
  },

  sidebarGlow: {
    position: "absolute",
    width: "220px",
    height: "220px",
    borderRadius: "50%",
    background: "rgba(168,85,247,0.22)",
    filter: "blur(55px)",
    top: "-70px",
    right: "-90px",
    pointerEvents: "none"
  },

  sidebarGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.055) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    opacity: 0.45,
    maskImage:
      "linear-gradient(to bottom,black,black 72%,transparent)",
    pointerEvents: "none"
  },

  sidebarContent: {
    position: "relative",
    zIndex: 2
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "16px",
    padding: "12px",
    borderRadius: "26px",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.13),rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 38px rgba(0,0,0,0.16)"
  },

  logoIcon: {
    width: "86px",
    height: "86px",
    borderRadius: "26px",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.95),rgba(245,243,255,0.88))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    boxShadow:
      "0 18px 36px rgba(0,0,0,0.20), 0 0 30px rgba(168,85,247,0.20)",
    overflow: "hidden",
    flexShrink: 0
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: "7px",
    boxSizing: "border-box"
  },

  logo: {
    color: "white",
    margin: 0,
    fontSize: "22px",
    fontWeight: "900",
    letterSpacing: "-0.4px"
  },

  logoSub: {
    margin: "5px 0 0",
    color: "rgba(255,255,255,0.72)",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "900",
    lineHeight: "1.35"
  },

  premiumBadge: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.16),rgba(168,85,247,0.16))",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#f5f3ff",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "18px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)"
  },

  notificationBox: {
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#f5f3ff",
    borderRadius: "17px",
    padding: "12px 13px",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    fontWeight: "900",
    boxShadow: "0 12px 26px rgba(0,0,0,0.12)"
  },

  userBox: {
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.07))",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "26px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "26px",
    boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
    backdropFilter: "blur(14px)"
  },

  userAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "19px",
    background:
      "linear-gradient(135deg,#7c3aed,#a855f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    flexShrink: 0,
    boxShadow:
      "0 12px 24px rgba(168,85,247,0.28), 0 0 26px rgba(168,85,247,0.18)"
  },

  userName: {
    color: "white",
    fontWeight: "900",
    fontSize: "15px"
  },

  userRole: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "12px",
    marginTop: "3px",
    fontWeight: "700"
  },

  onlineLine: {
    marginTop: "7px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#ddd6fe",
    fontSize: "12px",
    fontWeight: "900"
  },

  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#a855f7",
    boxShadow: "0 0 0 5px rgba(168,85,247,0.18)"
  },

  menuGroup: {
    marginBottom: "18px"
  },

  menuGroupTitle: {
    color: "rgba(255,255,255,0.42)",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1.6px",
    margin: "0 0 10px 6px"
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "rgba(255,255,255,0.86)",
    textDecoration: "none",
    padding: "13px 14px",
    borderRadius: "18px",
    fontSize: "14px",
    fontWeight: "850",
    transition: "0.2s",
    background: "rgba(255,255,255,0.065)",
    border: "1px solid rgba(255,255,255,0.075)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.025)"
  },

  menuIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.11)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  active: {
    background:
      "linear-gradient(135deg,#6d28d9,#a855f7)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow:
      "0 14px 30px rgba(168,85,247,0.30), 0 0 26px rgba(168,85,247,0.16)"
  },

  footer: {
    marginTop: "24px",
    position: "relative",
    zIndex: 2
  },

  footerCard: {
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.13),rgba(255,255,255,0.07))",
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: "23px",
    padding: "16px",
    marginBottom: "14px",
    boxShadow: "0 14px 32px rgba(0,0,0,0.14)"
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

  logoutButton: {
    width: "100%",
    background: "rgba(255,255,255,0.11)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "white",
    padding: "14px",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)"
  },

  content: {
    flex: 1,
    padding: "34px",
    overflowY: "auto",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.16),transparent 28%), radial-gradient(circle at bottom left,rgba(59,130,246,0.08),transparent 30%), linear-gradient(180deg,#ffffff,#f8f5ff)",
    boxSizing: "border-box"
  }
};

export default DashboardLayout;