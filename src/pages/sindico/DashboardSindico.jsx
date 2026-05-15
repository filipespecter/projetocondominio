function DashboardSindico() {

  const atividades = [
    {
      icon: "📦",
      texto: "Encomenda recebida - Apto 101",
      tempo: "há 1 hora"
    },
    {
      icon: "👤",
      texto: "Visitante registrado - João da Silva",
      tempo: "há 3 horas"
    },
    {
      icon: "📅",
      texto: "Reserva realizada - Salão de Festas",
      tempo: "há 6 horas"
    },
    {
      icon: "📢",
      texto: "Novo aviso publicado",
      tempo: "há 1 dia"
    }
  ];

  return (

    <div style={styles.container}>

      <h1 style={styles.title}>
        Dashboard
      </h1>

      {/* CARDS SUPERIORES */}

      <div style={styles.cards}>

        <div style={styles.card}>

          <div style={styles.cardTop}>
            <span style={styles.cardIcon}>📦</span>
            <h2 style={styles.number}>07</h2>
          </div>

          <p style={styles.cardText}>
            Encomendas aguardando
          </p>

        </div>


        <div style={styles.card}>

          <div style={styles.cardTop}>
            <span style={styles.cardIcon}>👤</span>
            <h2 style={styles.number}>03</h2>
          </div>

          <p style={styles.cardText}>
            Visitantes no condomínio
          </p>

        </div>


        <div style={styles.card}>

          <div style={styles.cardTop}>
            <span style={styles.cardIcon}>📅</span>
            <h2 style={styles.number}>02</h2>
          </div>

          <p style={styles.cardText}>
            Reservas hoje
          </p>

        </div>


        <div style={styles.card}>

          <div style={styles.cardTop}>
            <span style={styles.cardIcon}>📢</span>
            <h2 style={styles.number}>01</h2>
          </div>

          <p style={styles.cardText}>
            Avisos ativos
          </p>

        </div>

      </div>


      {/* ATIVIDADES RECENTES */}

      <div style={styles.activityCard}>

        <div style={styles.activityHeader}>

          <h3 style={styles.activityTitle}>
            Atividades recentes
          </h3>

          <span style={styles.viewAll}>
            Ver todos
          </span>

        </div>


        {atividades.map((item, index) => (

          <div
            key={index}
            style={styles.activityItem}
          >

            <div style={styles.activityLeft}>

              <span style={styles.activityIcon}>
                {item.icon}
              </span>

              <div>

                <p style={styles.activityText}>
                  {item.texto}
                </p>

                <small style={styles.time}>
                  {item.tempo}
                </small>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}


const styles = {

  container: {
    width: "100%",
    maxWidth: "1200px"
  },

  title: {
    marginBottom: "30px"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "20px",
    marginBottom: "30px"
  },

  card: {
    backgroundColor: "white",
    padding: "22px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "15px"
  },

  cardIcon: {
    fontSize: "22px"
  },

  number: {
    margin: 0
  },

  cardText: {
    color: "#666",
    margin: 0
  },

  activityCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  activityHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },

  activityTitle: {
    margin: 0
  },

  viewAll: {
    color: "#2563eb",
    fontSize: "14px",
    cursor: "pointer"
  },

  activityItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid #eee"
  },

  activityLeft: {
    display: "flex",
    gap: "14px",
    alignItems: "center"
  },

  activityIcon: {
    fontSize: "20px"
  },

  activityText: {
    margin: 0
  },

  time: {
    color: "#888"
  }

};

export default DashboardSindico;