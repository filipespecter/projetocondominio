function Header() {

  return (

    <div style={styles.header}>

      <div>Dashboard</div>

      <div style={styles.user}>
        Síndico
      </div>

    </div>

  );

}

const styles = {

  header: {
    height: "60px",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    borderBottom: "1px solid #ddd"
  },

  user: {
    fontWeight: "bold"
  }

};

export default Header;