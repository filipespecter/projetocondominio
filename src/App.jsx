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

/* LAYOUTS */

import DashboardLayout from "./layout/DashboardLayout";
import DashboardPorteiroLayout from "./layout/DashboardPorteiroLayout";
import DashboardMoradorLayout from "./layout/DashboardMoradorLayout";

/* =========================
   SÍNDICO
========================= */

import DashboardSindico from "./pages/Sindico/DashboardSindico";
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
import Configuracoes from "./pages/Sindico/Configuracoes";

/* =========================
   PORTEIRO
========================= */

import DashboardPorteiro from "./pages/Porteiro/DashboardPorteiro";
import EncomendasPorteiro from "./pages/Porteiro/EncomendasPorteiro";
import VisitantesPorteiro from "./pages/Porteiro/VisitantesPorteiro";
import MoradoresPorteiro from "./pages/Porteiro/MoradoresPorteiro";

/* =========================
   MORADOR
========================= */

import DashboardMorador from "./pages/Morador/DashboardMorador";
import AvisosMorador from "./pages/Morador/AvisosMorador";
import EncomendasMorador from "./pages/Morador/EncomendasMorador";
import ReservasMorador from "./pages/Morador/ReservasMorador";

function Home() {

  const navigate = useNavigate();

  return (

    <div style={styles.container}>

      <div style={styles.logo}>🏢</div>

      <h1 style={styles.title}>
        PORTARIA
      </h1>

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

        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* LOGIN */}

        <Route
          path="/login/:tipo"
          element={<Login />}
        />

        {/* =========================
            SÍNDICO
        ========================= */}

        <Route
          path="/dashboard"
          element={<DashboardLayout />}
        >

          <Route
            index
            element={<Navigate to="/dashboard/sindico" />}
          />

          <Route
            path="sindico"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <DashboardSindico />
              </ProtectedRoute>
            }
          />

          <Route
            path="apartamentos"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Apartamentos />
              </ProtectedRoute>
            }
          />

          <Route
            path="moradores"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Moradores />
              </ProtectedRoute>
            }
          />

          <Route
            path="porteiros"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Porteiros />
              </ProtectedRoute>
            }
          />

          <Route
            path="visitantes"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Visitantes />
              </ProtectedRoute>
            }
          />

          <Route
            path="movimentacoes"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Movimentacoes />
              </ProtectedRoute>
            }
          />

          <Route
            path="encomendas"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Encomendas />
              </ProtectedRoute>
            }
          />

          <Route
            path="reservas"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Reservas />
              </ProtectedRoute>
            }
          />

          <Route
            path="areas-comuns"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <AreasComuns />
              </ProtectedRoute>
            }
          />

          <Route
            path="avisos"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Avisos />
              </ProtectedRoute>
            }
          />

          <Route
            path="relatorios"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Relatorios />
              </ProtectedRoute>
            }
          />

          <Route
            path="configuracoes"
            element={
              <ProtectedRoute tipoPermitido="sindico">
                <Configuracoes />
              </ProtectedRoute>
            }
          />

        </Route>

        {/* =========================
            PORTEIRO
        ========================= */}

        <Route
          path="/dashboard/porteiro"
          element={<DashboardPorteiroLayout />}
        >

          <Route
            index
            element={
              <ProtectedRoute tipoPermitido="porteiro">
                <DashboardPorteiro />
              </ProtectedRoute>
            }
          />

          <Route
            path="encomendas"
            element={
              <ProtectedRoute tipoPermitido="porteiro">
                <EncomendasPorteiro />
              </ProtectedRoute>
            }
          />

          <Route
            path="visitantes"
            element={
              <ProtectedRoute tipoPermitido="porteiro">
                <VisitantesPorteiro />
              </ProtectedRoute>
            }
          />

          <Route
            path="moradores"
            element={
              <ProtectedRoute tipoPermitido="porteiro">
                <MoradoresPorteiro />
              </ProtectedRoute>
            }
          />

        </Route>

        {/* =========================
            MORADOR
        ========================= */}

        <Route
          path="/dashboard/morador"
          element={<DashboardMoradorLayout />}
        >

          <Route
            index
            element={
              <ProtectedRoute tipoPermitido="morador">
                <DashboardMorador />
              </ProtectedRoute>
            }
          />

          <Route
            path="avisos"
            element={
              <ProtectedRoute tipoPermitido="morador">
                <AvisosMorador />
              </ProtectedRoute>
            }
          />

          <Route
            path="encomendas"
            element={
              <ProtectedRoute tipoPermitido="morador">
                <EncomendasMorador />
              </ProtectedRoute>
            }
          />

          <Route
            path="reservas"
            element={
              <ProtectedRoute tipoPermitido="morador">
                <ReservasMorador />
              </ProtectedRoute>
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>

  );

}

const styles = {

  container: {
    height: "100vh",
    backgroundColor: "#0b4f82",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontFamily: "Arial"
  },

  logo: {
    fontSize: "80px",
    marginBottom: "15px"
  },

  title: {
    fontSize: "45px",
    margin: "0"
  },

  subtitle: {
    marginBottom: "40px",
    opacity: "0.8"
  },

  cards: {
    display: "flex",
    gap: "40px"
  }

};

export default App;