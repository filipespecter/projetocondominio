import AccessCard from "./components/AccessCard";
import ProtectedRoute from "./components/ProtectedRoute";

import { FaUserShield, FaBuilding, FaUser } from "react-icons/fa";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate
} from "react-router-dom";

import Login from "./pages/login";

import DashboardLayout from "./layout/DashboardLayout";
import DashboardPorteiroLayout from "./layout/DashboardPorteiroLayout";
import DashboardMoradorLayout from "./layout/DashboardMoradorLayout";

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
import BIAnalytics from "./pages/sindico/BIAnalytics";
import BIMonitor from "./pages/sindico/BIMonitor";
import Configuracoes from "./pages/sindico/Configuracoes";

import DashboardPorteiro from "./pages/porteiro/DashboardPorteiro";
import EncomendasPorteiro from "./pages/porteiro/EncomendasPorteiro";
import VisitantesPorteiro from "./pages/porteiro/VisitantesPorteiro";
import MoradoresPorteiro from "./pages/porteiro/MoradoresPorteiro";
import OcorrenciasPorteiro from "./pages/porteiro/OcorrenciasPorteiro";

import DashboardMorador from "./pages/morador/DashboardMorador";
import AvisosMorador from "./pages/morador/AvisosMorador";
import EncomendasMorador from "./pages/morador/EncomendasMorador";
import ReservasMorador from "./pages/morador/ReservasMorador";
import SugestoesMorador from "./pages/morador/SugestoesMorador";

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
              color="#7c3aed"
              buttonColor="#7c3aed"
            />
          </div>

          <div onClick={() => navigate("/login/porteiro")}>
            <AccessCard
              icon={<FaBuilding />}
              title="Porteiro"
              description="Acesso para registro de encomendas, visitantes e consultas"
              color="#6d28d9"
              buttonColor="#6d28d9"
            />
          </div>

          <div onClick={() => navigate("/login/morador")}>
            <AccessCard
              icon={<FaUser />}
              title="Morador"
              description="Acesso para acompanhar encomendas, reservas e avisos"
              color="#8b5cf6"
              buttonColor="#8b5cf6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login/:tipo" element={<Login />} />

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
          <Route path="bi-analytics" element={<BIAnalytics />} />
          <Route path="bi-monitor" element={<BIMonitor />} />
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
      "radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(168,85,247,0.14), transparent 30%), linear-gradient(135deg,#ffffff,#f8f5ff 45%,#ffffff)",
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
    background: "rgba(124,58,237,0.12)",
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
    border: "1px solid rgba(124,58,237,0.12)",
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
    background: "linear-gradient(135deg,#4c1d95,#7c3aed,#a855f7)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "56px",
    marginBottom: "18px",
    boxShadow: "0 22px 50px rgba(124,58,237,0.28)"
  },

  brandBadge: {
    background: "#f3e8ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
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
  }
};

export default App;
