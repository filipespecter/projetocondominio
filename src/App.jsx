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

import logoStar from "./assets/images/logo-star-infinity.png";

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
      <div style={styles.glowOne}></div>
      <div style={styles.glowTwo}></div>
      <div style={styles.grid}></div>

      <div style={styles.codeRain}>
        010101 110010 101101 001011 111000 010110
      </div>

      <section style={styles.hero}>
        <img
          src={logoStar}
          alt="Star Infinity Code"
          style={styles.logoImage}
        />

        <span style={styles.badge}>
          Produto da Star Infinity Code
        </span>

        <h1 style={styles.title}>InfinityCondo</h1>

        <p style={styles.subtitle}>
          Plataforma inteligente para gestão condominial, operação de portaria,
          reservas, encomendas e comunicação integrada.
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
              color="#a855f7"
              buttonColor="#a855f7"
            />
          </div>
        </div>

        <p style={styles.footer}>
          Powered by <strong>Star Infinity Code</strong> © 2026
        </p>
      </section>
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
      "radial-gradient(circle at top left,rgba(124,58,237,0.24),transparent 30%), radial-gradient(circle at bottom right,rgba(168,85,247,0.18),transparent 28%), linear-gradient(135deg,#ffffff,#f8f5ff 50%,#ffffff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial",
    overflow: "hidden",
    position: "relative",
    padding: "34px",
    boxSizing: "border-box"
  },

  glowOne: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "rgba(124,58,237,0.15)",
    filter: "blur(85px)",
    top: "-120px",
    left: "-100px"
  },

  glowTwo: {
    position: "absolute",
    width: "380px",
    height: "380px",
    borderRadius: "50%",
    background: "rgba(168,85,247,0.12)",
    filter: "blur(85px)",
    bottom: "-110px",
    right: "-100px"
  },

  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(124,58,237,0.07) 1px, transparent 1px), linear-gradient(90deg,rgba(124,58,237,0.07) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
    opacity: 0.55,
    pointerEvents: "none"
  },

  codeRain: {
    position: "absolute",
    bottom: "7%",
    left: "50%",
    transform: "translateX(-50%)",
    color: "rgba(109,40,217,0.12)",
    fontSize: "18px",
    fontWeight: "900",
    letterSpacing: "12px",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  },

  hero: {
    width: "100%",
    maxWidth: "1280px",
    minHeight: "720px",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.13),transparent 34%), linear-gradient(180deg,rgba(255,255,255,0.94),rgba(251,250,255,0.86))",
    border: "1px solid rgba(124,58,237,0.16)",
    borderRadius: "44px",
    boxShadow:
      "0 34px 90px rgba(88,28,135,0.14), inset 0 0 0 1px rgba(255,255,255,0.75)",
    backdropFilter: "blur(22px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "44px",
    position: "relative",
    zIndex: 2,
    boxSizing: "border-box"
  },

  logoImage: {
    width: "310px",
    maxWidth: "90%",
    marginBottom: "18px",
    filter: "drop-shadow(0 0 30px rgba(124,58,237,0.34))"
  },

  badge: {
    background: "#f3e8ff",
    border: "1px solid #ddd6fe",
    color: "#6d28d9",
    padding: "9px 15px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "16px"
  },

  title: {
    fontSize: "58px",
    margin: "0",
    fontWeight: "900",
    letterSpacing: "-1px",
    color: "#111827"
  },

  subtitle: {
    marginTop: "14px",
    marginBottom: "44px",
    color: "#6b7280",
    fontSize: "16px",
    maxWidth: "720px",
    lineHeight: "1.6",
    textAlign: "center"
  },

  cards: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(3, 280px)",
    gap: "28px",
    justifyContent: "center",
    alignItems: "stretch"
  },

  footer: {
    margin: "34px 0 0",
    color: "#6b7280",
    fontSize: "13px"
  }
};

export default App;