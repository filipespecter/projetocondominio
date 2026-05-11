function DashboardSindico() {

  return (

    <div style={styles.container}>

      <h1>Dashboard</h1>

      {/* CARDS SUPERIORES */}

      <div style={styles.cards}>

        <div style={styles.card}>
          <h3>Encomendas</h3>
          <h2>7</h2>
          <p>Aguardando retirada</p>
        </div>

        <div style={styles.card}>
          <h3>Visitantes</h3>
          <h2>3</h2>
          <p>No condomínio</p>
        </div>

        <div style={styles.card}>
          <h3>Reservas</h3>
          <h2>2</h2>
          <p>Hoje</p>
        </div>

        <div style={styles.card}>
          <h3>Avisos</h3>
          <h2>1</h2>
          <p>Ativo</p>
        </div>

      </div>

      {/* PAINÉIS INFERIORES */}

      <div style={styles.bottomGrid}>

        {/* MOVIMENTAÇÕES */}

        <div style={styles.box}>

          <h3>Movimentações recentes</h3>

          <ul style={styles.list}>

            <li>📦 Encomenda recebida - Apt 101</li>
            <li>👤 Visitante registrado - Maria Silva</li>
            <li>📅 Reserva realizada - Salão de festas</li>
            <li>📢 Aviso publicado - Manutenção da água</li>

          </ul>

        </div>

        {/* RESERVAS */}

        <div style={styles.box}>

          <h3>Reservas de hoje</h3>

          <ul style={styles.list}>

            <li>🎉 Salão de festas - João Silva</li>
            <li>🔥 Churrasqueira - Maria Oliveira</li>

          </ul>

        </div>

      </div>

    </div>

  );

}

const styles = {

  container: {
    width: "100%",
    maxWidth: "1200px"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginTop: "30px"
  },

  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 2px 10px rgba(0,0,0,0.08)"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginTop: "30px"
  },

  box: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 2px 10px rgba(0,0,0,0.08)"
  },

  list: {
    marginTop: "15px",
    lineHeight: "28px"
  }

};

export default DashboardSindico;