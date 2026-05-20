import { useState, useEffect } from "react";
import PackageModal from "./PackageModal";

export default function ApartmentGrid() {

  const apartamentos = [];

  for (let andar = 1; andar <= 15; andar++) {

    for (let ap = 1; ap <= 4; ap++) {

      apartamentos.push(`${andar}0${ap}`);

    }

  }

  const [selectedAp, setSelectedAp] = useState(null);

  const [encomendas, setEncomendas] = useState([]);

  useEffect(() => {

    carregarEncomendas();

  }, []);

  function carregarEncomendas() {

    const data =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    setEncomendas(data);

  }

  function contarEncomendas(ap) {

    return encomendas.filter(

      (e) =>

        e.apartamento === ap &&
        e.status === "pendente"

    ).length;

  }

  return (

    <>

      <div style={styles.grid}>

        {apartamentos.map((ap) => {

          const total = contarEncomendas(ap);

          let background = "white";

          if (total > 0) {

            background = "#fde68a";

          }

          return (

            <div
              key={ap}
              style={{
                ...styles.card,
                background
              }}
              onClick={() => setSelectedAp(ap)}
            >

              <div style={styles.number}>

                {ap}

              </div>

              <div style={styles.status}>

                {total === 0 &&
                  "Sem encomenda"}

                {total > 0 &&
                  `📦 ${total} encomenda${total > 1 ? "s" : ""}`}

              </div>

            </div>

          );

        })}

      </div>

      {selectedAp && (

        <PackageModal
          apartamento={selectedAp}
          onClose={() => {

            setSelectedAp(null);

            carregarEncomendas();

          }}
        />

      )}

    </>

  );

}

const styles = {

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "14px"
  },

  card: {
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    cursor: "pointer",
    border: "1px solid #e5e7eb",
    transition: "0.2s",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
  },

  number: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827"
  },

  status: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "8px"
  }

};