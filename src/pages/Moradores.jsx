function Moradores() {

  const moradores = [
    { id: 1, nome: "João Silva", apto: "101", telefone: "99999-1111" },
    { id: 2, nome: "Maria Souza", apto: "202", telefone: "99999-2222" },
    { id: 3, nome: "Carlos Lima", apto: "305", telefone: "99999-3333" }
  ];

  return (

    <div style={styles.container}>

      <div style={styles.header}>

        <h1>Moradores</h1>

        <button style={styles.button}>
          + Novo Morador
        </button>

      </div>

      <table style={styles.table}>

        <thead>
          <tr>
            <th>Nome</th>
            <th>Apartamento</th>
            <th>Telefone</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>

          {moradores.map((morador) => (

            <tr key={morador.id}>

              <td>{morador.nome}</td>
              <td>{morador.apto}</td>
              <td>{morador.telefone}</td>

              <td>
                <button style={styles.edit}>Editar</button>
                <button style={styles.delete}>Excluir</button>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

const styles = {

  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  button: {
    backgroundColor: "#7b2cbf",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  table: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: "8px",
    borderCollapse: "collapse",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)"
  },

};

export default Moradores;