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
import "./home.css";

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
    <div className="home-container">
      <div className="home-glow-one"></div>
      <div className="home-glow-two"></div>
      <div className="home-grid-bg"></div>

      <div className="home-code-rain">
        010101 110010 101101 001011 111000 010110
      </div>

      <section className="home-hero">
        <img
          src={logoStar}
          alt="Star Infinity Code"
          className="home-logo-image"
        />

        <span className="home-badge">
          Produto da Star Infinity Code
        </span>

        <h1 className="home-title">InfinityCondo</h1>

        <p className="home-subtitle">
          Plataforma inteligente para gestão condominial, operação de portaria,
          reservas, encomendas e comunicação integrada.
        </p>

        <div className="home-cards">
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

        <p className="home-footer">
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

export default App;