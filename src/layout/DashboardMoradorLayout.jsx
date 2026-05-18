import { Outlet } from "react-router-dom";

import SidebarMorador from "./SidebarMorador";

function DashboardMoradorLayout() {

  return (

    <div style={styles.container}>

      <SidebarMorador />

      <main style={styles.content}>
        <Outlet />
      </main>

    </div>

  );

}

const styles = {

  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f1f5f9"
  },

  content: {
    flex: 1,
    padding: "30px"
  }

};

export default DashboardMoradorLayout;