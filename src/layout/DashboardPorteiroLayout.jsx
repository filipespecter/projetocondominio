import { Outlet } from "react-router-dom";
import SidebarPorteiro from "./SidebarPorteiro";

function DashboardPorteiroLayout() {

  return (

    <div style={styles.container}>

      {/* SIDEBAR */}
      <SidebarPorteiro />

      {/* ÁREA DIREITA */}
      <div style={styles.rightArea}>

        {/* HEADER */}
        <header style={styles.header}>

          <h2 style={styles.title}>
            Condomínio Residencial
          </h2>

          <div style={styles.userBox}>

            <div style={styles.userIcon}>
              👮
            </div>

            <span style={styles.userName}>
              Porteiro
            </span>

          </div>

        </header>

        {/* CONTEÚDO */}
        <main style={styles.content}>
          <Outlet />
        </main>

      </div>

    </div>

  );

}

const styles = {

  container: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#eaedf3"
  },

  rightArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    width: "100%"
  },

  header: {
    height: "70px",
    backgroundColor: "white",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827"
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "500",
    color: "#374151"
  },

  userIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#166534",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "white"
  },

  userName: {
    fontSize: "14px"
  },

  content: {
    flex: 1,
    width: "100%",
    padding: "30px",
    boxSizing: "border-box"
  }

};

export default DashboardPorteiroLayout;