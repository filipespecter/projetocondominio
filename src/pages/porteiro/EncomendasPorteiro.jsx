import { useState } from "react";
import ApartmentGrid from "../../components/Porteiro/ApartmentGrid";
import PackageModal from "../../components/Porteiro/PackageModal";

function EncomendasPorteiro() {

  const [apSelecionado, setApSelecionado] = useState(null);

  function abrirModal(ap) {
    setApSelecionado(ap);
  }

  function fecharModal() {
    setApSelecionado(null);
  }

  return (

    <div style={styles.container}>

      <div style={styles.header}>

        <h1 style={styles.title}>
          Encomendas
        </h1>

        <p style={styles.subtitle}>
          Clique em um apartamento para registrar ou marcar uma encomenda
        </p>

      </div>

      <ApartmentGrid onSelect={abrirModal} />

      {apSelecionado && (

        <PackageModal
          apartamento={apSelecionado}
          onClose={fecharModal}
        />

      )}

    </div>

  );

}

const styles = {

  container: {
    width: "100%"
  },

  header: {
    marginBottom: "30px"
  },

  title: {
    fontSize: "28px",
    marginBottom: "5px"
  },

  subtitle: {
    color: "#6b7280"
  }

};

export default EncomendasPorteiro;