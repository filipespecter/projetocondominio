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

    <div>

      <h2 style={styles.title}>
        📊 Relatórios
      </h2>


      <div style={styles.grid}>

        <div style={styles.card}>
          <div style={styles.icon}>🏢</div>
          <h3>Apartamentos</h3>
          <h1>{dados.apartamentos}</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>👥</div>
          <h3>Moradores</h3>
          <h1>{dados.moradores}</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>🚶</div>
          <h3>Visitantes</h3>
          <h1>{dados.visitantes}</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📦</div>
          <h3>Encomendas</h3>
          <h1>{dados.encomendas}</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📅</div>
          <h3>Reservas</h3>
          <h1>{dados.reservas}</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📢</div>
          <h3>Avisos</h3>
          <h1>{dados.avisos}</h1>
        </div>

      </div>

    </div>

  );

}


const styles = {

title:{
marginBottom:"25px"
},

grid:{
display:"grid",
gridTemplateColumns:"repeat(3,1fr)",
gap:"20px"
},

card:{
background:"white",
padding:"25px",
borderRadius:"12px",
boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
textAlign:"center"
},

icon:{
fontSize:"35px",
marginBottom:"10px"
}

};

export default Relatorios;