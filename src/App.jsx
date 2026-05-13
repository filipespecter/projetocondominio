import AccessCard from "./components/AccessCard";

import { FaUserShield } from "react-icons/fa";
import { FaBuilding } from "react-icons/fa";
import { FaUser } from "react-icons/fa";

import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";

import Login from "./pages/Login";

import DashboardLayout from "./layout/DashboardLayout";

import DashboardSindico from "./pages/DashboardSindico";
import Moradores from "./pages/Moradores";
import Movimentacoes from "./pages/Movimentacoes";

import Apartamentos from "./pages/Apartamentos";
import Porteiros from "./pages/Porteiros";
import Visitantes from "./pages/Visitantes";
import AreasComuns from "./pages/AreasComuns";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Reservas from "./pages/Reservas";

/* PÁGINAS */
import Encomendas from "./pages/Encomendas";
import Avisos from "./pages/Avisos";


function Home() {

  const navigate = useNavigate();

  return (
    <div style={styles.container}>

      <div style={styles.logo}>🏢</div>

      <h1 style={styles.title}>PORTARIA</h1>

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

        {/* ÁREA DO SISTEMA */}

        <Route path="/dashboard" element={<DashboardLayout />}>

          {/* REDIRECIONAMENTO AUTOMÁTICO */}
          <Route index element={<Navigate to="sindico" />} />

          {/* DASHBOARD */}
          <Route path="sindico" element={<DashboardSindico />} />

          {/* MENU */}
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

          <Route path="configuracoes" element={<Configuracoes />} />

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