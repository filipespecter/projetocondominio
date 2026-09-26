import AccessCard from "./components/AccessCard";
import ProtectedRoute from "./components/ProtectedRoute";
import PlatformProtectedRoute from "./components/PlatformProtectedRoute";

import { FaUserShield, FaBuilding, FaUser, FaShieldAlt } from "react-icons/fa";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate
} from "react-router-dom";

import Login from "./pages/login";
import CadastroCondominio from "./pages/CadastroCondominio";

import DashboardLayout from "./layout/DashboardLayout";
import DashboardPorteiroLayout from "./layout/DashboardPorteiroLayout";
import DashboardMoradorLayout from "./layout/DashboardMoradorLayout";
import PlatformLayout from "./layout/PlatformLayout";

import DashboardSindico from "./pages/sindico/DashboardSindico";
import Prestadores from "./pages/sindico/Prestadores";
import Apartamentos from "./pages/sindico/Apartamentos";
import Moradores from "./pages/sindico/Moradores";
import Porteiros from "./pages/sindico/Porteiros";
import Visitantes from "./pages/sindico/Visitantes";
import Movimentacoes from "./pages/sindico/Movimentacoes";
import Encomendas from "./pages/sindico/Encomendas";
import Reservas from "./pages/sindico/Reservas";
import AreasComuns from "./pages/sindico/AreasComuns";
import Avisos from "./pages/sindico/Avisos";
import Relatorios from "./pages/sindico/Relatorios";
import Suporte from "./pages/sindico/Suporte";
import BIAnalytics from "./pages/sindico/BIAnalytics";
import BIMonitor from "./pages/sindico/BIMonitor";
import Configuracoes from "./pages/sindico/Configuracoes";
import Financeiro from "./pages/sindico/Financeiro";
import Ativos from "./pages/sindico/Ativos";
import Fornecedores from "./pages/sindico/Fornecedores";
import Contratos from "./pages/sindico/Contratos";
import DocumentosCondominio from "./pages/shared/DocumentosCondominio";
import Assembleias from "./pages/shared/Assembleias";

import DashboardPorteiro from "./pages/porteiro/DashboardPorteiro";
import EncomendasPorteiro from "./pages/porteiro/EncomendasPorteiro";
import VisitantesPorteiro from "./pages/porteiro/VisitantesPorteiro";
import MoradoresPorteiro from "./pages/porteiro/MoradoresPorteiro";
import OcorrenciasPorteiro from "./pages/porteiro/OcorrenciasPorteiro";

import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformCondominiums from "./pages/platform/PlatformCondominiums";
import PlatformClients from "./pages/platform/PlatformClients";
import PlatformUsers from "./pages/platform/PlatformUsers";
import PlatformPlans from "./pages/platform/PlatformPlans";
import PlatformFinance from "./pages/platform/PlatformFinance";
import PlatformAudit from "./pages/platform/PlatformAudit";
import PlatformSystemEvents from "./pages/platform/PlatformSystemEvents";
import PlatformSupport from "./pages/platform/PlatformSupport";
import PlatformOperations from "./pages/platform/PlatformOperations";

import DashboardMorador from "./pages/morador/DashboardMorador";
import AvisosMorador from "./pages/morador/AvisosMorador";
import EncomendasMorador from "./pages/morador/EncomendasMorador";
import ReservasMorador from "./pages/morador/ReservasMorador";
import SugestoesMorador from "./pages/morador/SugestoesMorador";
import VisitantesMorador from "./pages/morador/VisitantesMorador";
import ServicosApartamentoMorador from "./pages/morador/ServicosApartamentoMorador";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.bgOrbOne}></div>
      <div style={styles.bgOrbTwo}></div>

      <div style={styles.homeBox}>
        <div style={styles.brandMark}>✦</div>

        <span style={styles.brandBadge}>
          Star Infinity Code
        </span>

        <h1 style={styles.title}>InfinityCondo</h1>

        <p style={styles.subtitle}>
          Plataforma inteligente de gestão condominial.
        </p>

        <div style={styles.cards}>
          <div onClick={() => navigate("/login/sindico")}>
            <AccessCard
              icon={<FaUserShield />}
              title="Síndico / Adm"
              description="Acesso corporativo ao sistema e gestão total do condomínio"
              color="var(--ic-primary)"
              buttonColor="var(--ic-primary)"
            />
          </div>

          <div onClick={() => navigate("/login/porteiro")}>
            <AccessCard
              icon={<FaBuilding />}
              title="Porteiro"
              description="Acesso para registro de encomendas, visitantes e consultas"
              color="var(--ic-primary-strong)"
              buttonColor="var(--ic-primary-strong)"
            />
          </div>

          <div onClick={() => navigate("/login/morador")}>
            <AccessCard
              icon={<FaUser />}
              title="Morador"
              description="Acesso para acompanhar encomendas, reservas e avisos"
              color="var(--ic-primary-light)"
              buttonColor="var(--ic-primary-light)"
            />
          </div>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/login/platform"
            )
          }
          style={
            styles.centralStarButton
          }
          aria-label="Acessar Central Star Infinity Code"
        >
          <FaShieldAlt />

          <span>
            Acesso Central Star
          </span>
        </button>

        <p style={styles.footer}>
          Powered by <strong>Star Infinity Code</strong> © 2026
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/*
         * =====================================================
         * CADASTRO PÚBLICO DE CONDOMÍNIO
         * =====================================================
         *
         * Esta rota precisa ser pública porque o condomínio
         * e o administrador ainda não existem no momento
         * em que o onboarding é iniciado.
         */}
        <Route
          path="/cadastro-condominio"
          element={<CadastroCondominio />}
        />

        <Route path="/login/:tipo" element={<Login />} />

        {/*
         * =====================================================
         * CENTRAL STAR INFINITY CODE
         * =====================================================
         *
         * Área exclusiva de usuários internos da plataforma:
         * PLATFORM_OWNER, PLATFORM_ADMIN e PLATFORM_SUPPORT.
         *
         * Não reutiliza a proteção legada dos perfis do
         * condomínio. A sessão é confirmada pela API.
         */}
        <Route
          path="/platform"
          element={
            <PlatformProtectedRoute>
              <PlatformLayout />
            </PlatformProtectedRoute>
          }
        >
          <Route
            index
            element={<PlatformDashboard />}
          />

          <Route
            path="condominios"
            element={<PlatformCondominiums />}
          />

          <Route
            path="clientes"
            element={<PlatformClients />}
          />

          <Route
            path="usuarios"
            element={<PlatformUsers />}
          />

          <Route
            path="planos"
            element={<PlatformPlans />}
          />

          <Route
            path="financeiro"
            element={<PlatformFinance />}
          />

          <Route
            path="auditoria"
            element={<PlatformAudit />}
          />

          <Route
            path="eventos"
            element={<PlatformSystemEvents />}
          />

          <Route
            path="suporte"
            element={<PlatformSupport />}
          />

          <Route
            path="operacoes"
            element={<PlatformOperations />}
          />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute tipoPermitido="sindico">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/sindico" replace />} />
          <Route path="sindico" element={<DashboardSindico />} />
          <Route path="apartamentos" element={<Apartamentos />} />
          <Route path="moradores" element={<Moradores />} />
          <Route path="porteiros" element={<Porteiros />} />
          <Route path="visitantes" element={<Visitantes />} />
          <Route path="movimentacoes" element={<Movimentacoes />} />
          <Route path="encomendas" element={<Encomendas />} />
          <Route path="reservas" element={<Reservas />} />
          <Route path="areas-comuns" element={<AreasComuns />} />
          <Route path="avisos" element={<Avisos />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="suporte" element={<Suporte />} />
          <Route path="bi-analytics" element={<BIAnalytics />} />
          <Route path="bi-monitor" element={<BIMonitor />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="documentos" element={<DocumentosCondominio />} />
          <Route path="assembleias" element={<Assembleias />} />
          <Route path="ativos" element={<Ativos />} />
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="prestadores" element={<Prestadores />} />
        </Route>

        <Route
          path="/bi-monitor"
          element={
            <ProtectedRoute tipoPermitido="sindico">
              <BIMonitor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/porteiro"
          element={
            <ProtectedRoute tipoPermitido="porteiro">
              <DashboardPorteiroLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPorteiro />} />
          <Route path="encomendas" element={<EncomendasPorteiro />} />
          <Route path="visitantes" element={<VisitantesPorteiro />} />
          <Route path="moradores" element={<MoradoresPorteiro />} />
          <Route path="ocorrencias" element={<OcorrenciasPorteiro />} />
          <Route path="documentos" element={<DocumentosCondominio />} />
          <Route path="assembleias" element={<Assembleias />} />
        </Route>

        <Route
          path="/dashboard/morador"
          element={
            <ProtectedRoute tipoPermitido="morador">
              <DashboardMoradorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardMorador />} />
          <Route path="avisos" element={<AvisosMorador />} />
          <Route path="encomendas" element={<EncomendasMorador />} />
          <Route path="reservas" element={<ReservasMorador />} />
          <Route path="sugestoes" element={<SugestoesMorador />} />
          <Route path="visitantes" element={<VisitantesMorador />} />
          <Route path="servicos-apartamento" element={<ServicosApartamentoMorador />} />
          <Route path="documentos" element={<DocumentosCondominio />} />
          <Route path="assembleias" element={<Assembleias />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgb(var(--ic-primary-rgb) / 0.18), transparent 32%), radial-gradient(circle at bottom right, rgb(var(--ic-primary-bright-rgb) / 0.14), transparent 30%), linear-gradient(135deg,#ffffff,#f8f5ff 45%,#ffffff)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#111827",
    fontFamily: "Arial",
    overflow: "hidden",
    position: "relative",
    padding: "40px",
    boxSizing: "border-box"
  },

  bgOrbOne: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background: "rgb(var(--ic-primary-rgb) / 0.12)",
    filter: "blur(70px)",
    top: "-100px",
    left: "-80px"
  },

  bgOrbTwo: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(59,130,246,0.10)",
    filter: "blur(80px)",
    right: "-80px",
    bottom: "-100px"
  },

  homeBox: {
    width: "100%",
    maxWidth: "1280px",
    minHeight: "720px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgb(var(--ic-primary-rgb) / 0.12)",
    boxShadow: "0 30px 80px rgba(88,28,135,0.12)",
    borderRadius: "42px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "44px",
    boxSizing: "border-box",
    position: "relative",
    zIndex: 2
  },

  brandMark: {
    width: "92px",
    height: "92px",
    borderRadius: "30px",
    background: "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary),var(--ic-primary-bright))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "56px",
    marginBottom: "18px",
    boxShadow: "0 22px 50px rgb(var(--ic-primary-rgb) / 0.28)"
  },

  brandBadge: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary-strong)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "9px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "14px"
  },

  title: {
    fontSize: "56px",
    margin: "0",
    fontWeight: "900",
    letterSpacing: "-1px",
    color: "#111827"
  },

  subtitle: {
    marginTop: "14px",
    marginBottom: "46px",
    color: "#6b7280",
    fontSize: "16px"
  },

  cards: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(3, 280px)",
    gap: "28px",
    justifyContent: "center",
    alignItems: "stretch"
  },

  centralStarButton: {
    marginTop: "22px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    minHeight: "40px",
    padding: "0 18px",
    borderRadius: "999px",
    border: "1px solid rgb(var(--ic-primary-deep-rgb) / 0.22)",
    background: "rgb(var(--ic-primary-deep-rgb) / 0.07)",
    color: "var(--ic-primary-deep)",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "0.2px",
    cursor: "pointer",
    boxShadow: "0 8px 22px rgb(var(--ic-primary-deep-rgb) / 0.08)"
  },

  footer: {
    margin: "34px 0 0",
    color: "#6b7280",
    fontSize: "13px"
  }
};

export default App;
