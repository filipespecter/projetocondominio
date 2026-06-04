import AccessCard from "./components/AccessCard";
import ProtectedRoute from "./components/ProtectedRoute";

import { FaUserShield } from "react-icons/fa";
import { FaBuilding } from "react-icons/fa";
import { FaUser } from "react-icons/fa";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";

import DashboardLayout from "./layout/DashboardLayout";
import DashboardPorteiroLayout from "./layout/DashboardPorteiroLayout";
import DashboardMoradorLayout from "./layout/DashboardMoradorLayout";

import DashboardSindico from "./pages/Sindico/DashboardSindico";
import Prestadores from "./pages/Sindico/Prestadores";
import Apartamentos from "./pages/Sindico/Apartamentos";
import Moradores from "./pages/Sindico/Moradores";
import Porteiros from "./pages/Sindico/Porteiros";
import Visitantes from "./pages/Sindico/Visitantes";
import Movimentacoes from "./pages/Sindico/Movimentacoes";
import Encomendas from "./pages/Sindico/Encomendas";
import Reservas from "./pages/Sindico/Reservas";
import AreasComuns from "./pages/Sindico/AreasComuns";
import Avisos from "./pages/Sindico/Avisos";
import Relatorios from "./pages/Sindico/Relatorios";
import BIAnalytics from "./pages/Sindico/BIAnalytics";
import BIMonitor from "./pages/Sindico/BIMonitor";
import Configuracoes from "./pages/Sindico/Configuracoes";

import DashboardPorteiro from "./pages/Porteiro/DashboardPorteiro";
import EncomendasPorteiro from "./pages/Porteiro/EncomendasPorteiro";
import VisitantesPorteiro from "./pages/Porteiro/VisitantesPorteiro";
import MoradoresPorteiro from "./pages/Porteiro/MoradoresPorteiro";
import OcorrenciasPorteiro from "./pages/Porteiro/OcorrenciasPorteiro";

import DashboardMorador from "./pages/Morador/DashboardMorador";
import AvisosMorador from "./pages/Morador/AvisosMorador";
import EncomendasMorador from "./pages/Morador/EncomendasMorador";
import ReservasMorador from "./pages/Morador/ReservasMorador";
import SugestoesMorador from "./pages/Morador/SugestoesMorador";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.logo}>🏢</div>

      <h1 style={styles.title}>GreenCondo</h1>

      <p style={styles.subtitle}>
        Selecione o tipo de acesso ao sistema
      </p>

      <div style={styles.cards}>
        <div onClick={() => navigate("/login/sindico")}>
          <AccessCard
            icon={<FaUserShield />}
            title="Síndico / Adm"
            description="Acesso corporativo ao sistema e gestão total do condomínio"
            color="#7b2cbf"
            buttonColor="#7b2cbf"
          />
        </div>

        <div onClick={() => navigate("/login/porteiro")}>
          <AccessCard
            icon={<FaBuilding />}
            title="Porteiro"
            description="Acesso para registro de encomendas, visitantes e consultas"
            color="#1c7c3c"
            buttonColor="#1c7c3c"
          />
        </div>

        <div onClick={() => navigate("/login/morador")}>
          <AccessCard
            icon={<FaUser />}
            title="Morador"
            description="Acesso para acompanhar encomendas, reservas e avisos"
            color="#4cc9f0"
            buttonColor="#4cc9f0"
          />
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
          <Route
            index
            element={<Navigate to="/dashboard/sindico" replace />}
          />

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
      "radial-gradient(circle at top left, rgba(34,197,94,0.30), transparent 32%), radial-gradient(circle at bottom right, rgba(250,204,21,0.20), transparent 28%), linear-gradient(135deg,#020617,#052e16 45%,#064e3b)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontFamily: "Arial",
    overflow: "hidden",
    position: "relative",
    padding: "40px",
    boxSizing: "border-box"
  },

  logo: {
    width: "92px",
    height: "92px",
    borderRadius: "32px",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "52px",
    marginBottom: "22px",
    boxShadow: "0 22px 50px rgba(0,0,0,0.28)"
  },

  title: {
    fontSize: "52px",
    margin: "0",
    fontWeight: "900",
    letterSpacing: "2px"
  },

  subtitle: {
    marginTop: "14px",
    marginBottom: "46px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "16px"
  },

  cards: {
    display: "flex",
    gap: "34px",
    flexWrap: "wrap",
    justifyContent: "center"
  }
};

export default App;