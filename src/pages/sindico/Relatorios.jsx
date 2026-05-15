import { useEffect, useState } from "react";

function Relatorios() {

  const [dados, setDados] = useState({
    moradores: 0,
    apartamentos: 0,
    visitantes: 0,
    encomendas: 0,
    reservas: 0,
    avisos: 0
  });


  useEffect(() => {

    const moradores =
      JSON.parse(localStorage.getItem("moradores")) || [];

    const apartamentos =
      JSON.parse(localStorage.getItem("apartamentos")) || [];

    const visitantes =
      JSON.parse(localStorage.getItem("visitantes")) || [];

    const encomendas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const reservas =
      JSON.parse(localStorage.getItem("reservas")) || [];

    const avisos =
      JSON.parse(localStorage.getItem("avisos")) || [];


    setDados({
      moradores: moradores.length,
      apartamentos: apartamentos.length,
      visitantes: visitantes.length,
      encomendas: encomendas.length,
      reservas: reservas.length,
      avisos: avisos.length
    });

  }, []);


  return (

    <div style={styles.container}>

      <h2 style={styles.title}>
        📊 Relatórios
      </h2>


      {/* CARDS */}

      <div style={styles.grid}>

        <div style={styles.card}>
          <div style={styles.icon}>🏢</div>
          <h3>Apartamentos</h3>
          <h1>{dados.apartamentos}</h1>
          <p>Total cadastrados</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>👥</div>
          <h3>Moradores</h3>
          <h1>{dados.moradores}</h1>
          <p>Moradores ativos</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>🚶</div>
          <h3>Visitantes</h3>
          <h1>{dados.visitantes}</h1>
          <p>Registros realizados</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📦</div>
          <h3>Encomendas</h3>
          <h1>{dados.encomendas}</h1>
          <p>Encomendas recebidas</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📅</div>
          <h3>Reservas</h3>
          <h1>{dados.reservas}</h1>
          <p>Reservas efetuadas</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📢</div>
          <h3>Avisos</h3>
          <h1>{dados.avisos}</h1>
          <p>Avisos publicados</p>
        </div>

      </div>


      {/* PAINÉIS INFERIORES */}

      <div style={styles.bottomGrid}>

        <div style={styles.box}>

          <h3>Resumo do condomínio</h3>

          <ul style={styles.list}>
            <li>🏢 {dados.apartamentos} apartamentos cadastrados</li>
            <li>👥 {dados.moradores} moradores registrados</li>
            <li>🚶 {dados.visitantes} visitantes cadastrados</li>
            <li>📦 {dados.encomendas} encomendas registradas</li>
          </ul>

        </div>


        <div style={styles.box}>

          <h3>Atividades recentes</h3>

          <ul style={styles.list}>
            <li>📅 {dados.reservas} reservas realizadas</li>
            <li>📢 {dados.avisos} avisos publicados</li>
            <li>🔐 Sistema funcionando normalmente</li>
            <li>✅ Dados sincronizados localmente</li>
          </ul>

        </div>

      </div>

    </div>

  );

}


const styles = {

  container: {
    width: "100%"
  },

  title: {
    marginBottom: "25px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    textAlign: "center"
  },

  icon: {
    fontSize: "38px",
    marginBottom: "10px"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },

  box: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  list: {
    listStyle: "none",
    padding: 0,
    marginTop: "15px",
    lineHeight: "34px"
  }

};

export default Relatorios;