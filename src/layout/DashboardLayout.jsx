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

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [perfilCondominio, setPerfilCondominio] = useState({
    nomeCondominio: "Condomínio",
    logoUrl: "",
    plano: "Gestão Premium"
  });

  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  const sessaoSalva =
    localStorage.getItem("sessaoSindico") ||
    sessionStorage.getItem("sessaoSindico");

  useEffect(() => {
    carregarPerfilCondominio();
    carregarNotificacoes();

    const interval = setInterval(() => {
      carregarPerfilCondominio();
      carregarNotificacoes();
    }, 1000);

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
        logoUrl: perfil.logoUrl || "",
        plano: perfil.plano || "Gestão Premium"
      });
    } catch {
      setPerfilCondominio({
        nomeCondominio: "Condomínio",
        logoUrl: "",
        plano: "Gestão Premium"
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
        <div>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>
              {perfilCondominio.logoUrl ? (
                <img
                  src={perfilCondominio.logoUrl}
                  alt="Logo do condomínio"
                  style={styles.logoImage}
                />
              ) : (
                "🏢"
              )}
            </div>

            <div>
              <h2 style={styles.logo}>
                {perfilCondominio.nomeCondominio || "Condomínio"}
              </h2>

              <p style={styles.logoSub}>
                Painel Executivo
              </p>
            </div>
          </div>

          <div style={styles.premiumBadge}>
            ✨ {perfilCondominio.plano || "Gestão Premium"}
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
              Central Administrativa
            </p>

            <p style={styles.footerText}>
              Controle completo do condomínio em tempo real.
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
      "linear-gradient(180deg,#f8fafc,#ecfdf5)",
    fontFamily: "Arial"
  },

  sidebar: {
    width: "310px",
    minWidth: "310px",
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left,rgba(34,197,94,0.25),transparent 32%), linear-gradient(180deg,#020617,#052e16,#14532d)",
    padding: "26px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "12px 0 45px rgba(3,27,15,0.30)",
    color: "white",
    overflowY: "auto",
    boxSizing: "border-box"
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "14px"
  },

  logoIcon: {
    width: "62px",
    height: "62px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    boxShadow:
      "inset 0 0 0 1px rgba(255,255,255,0.14), 0 14px 30px rgba(0,0,0,0.18)",
    backdropFilter: "blur(12px)",
    overflow: "hidden"
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  logo: {
    color: "white",
    margin: 0,
    fontSize: "22px",
    fontWeight: "900",
    letterSpacing: "-0.4px"
  },

  logoSub: {
    margin: "4px 0 0",
    color: "rgba(255,255,255,0.68)",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "800"
  },

  premiumBadge: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    background:
      "linear-gradient(135deg,rgba(250,204,21,0.26),rgba(255,255,255,0.10))",
    border: "1px solid rgba(250,204,21,0.28)",
    color: "#fef9c3",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "18px"
  },

  notificationBox: {
    background: "rgba(250,204,21,0.16)",
    border: "1px solid rgba(250,204,21,0.28)",
    color: "#fef9c3",
    borderRadius: "17px",
    padding: "12px 13px",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    fontWeight: "900"
  },

  userBox: {
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.13),rgba(255,255,255,0.07))",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "26px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "26px",
    boxShadow: "0 18px 38px rgba(0,0,0,0.20)",
    backdropFilter: "blur(14px)"
  },

  userAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "19px",
    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    flexShrink: 0,
    boxShadow: "0 12px 24px rgba(34,197,94,0.22)"
  },

  userName: {
    color: "white",
    fontWeight: "900",
    fontSize: "15px"
  },

  userRole: {
    color: "rgba(255,255,255,0.70)",
    fontSize: "12px",
    marginTop: "3px",
    fontWeight: "600"
  },

  onlineLine: {
    marginTop: "7px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#bbf7d0",
    fontSize: "12px",
    fontWeight: "800"
  },

  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 0 5px rgba(34,197,94,0.16)"
  },

  menuGroup: {
    marginBottom: "18px"
  },

  menuGroupTitle: {
    color: "rgba(255,255,255,0.38)",
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
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.06)"
  },

  menuIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  active: {
    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.24)",
    boxShadow:
      "0 14px 28px rgba(34,197,94,0.28)"
  },

  footer: {
    marginTop: "24px"
  },

  footerCard: {
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,255,255,0.11)",
    borderRadius: "23px",
    padding: "16px",
    marginBottom: "14px"
  },

  footerTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "900"
  },

  footerText: {
    margin: "7px 0 0",
    color: "rgba(255,255,255,0.62)",
    fontSize: "12px",
    lineHeight: "1.45"
  },

  logoutButton: {
    width: "100%",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    padding: "14px",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    fontWeight: "900"
  },

  content: {
    flex: 1,
    padding: "34px",
    overflowY: "auto",
    background:
      "radial-gradient(circle at top right,rgba(187,247,208,0.28),transparent 26%), linear-gradient(180deg,#f8fafc,#ecfdf5)",
    boxSizing: "border-box"
  }
};

export default DashboardLayout;