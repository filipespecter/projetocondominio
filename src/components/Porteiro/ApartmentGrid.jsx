import { useState, useEffect } from "react";
import PackageModal from "./PackageModal";

export default function ApartmentGrid() {

  const apartamentos = [];

  for (let andar = 1; andar <= 15; andar++) {

    for (let ap = 1; ap <= 4; ap++) {

      apartamentos.push(`${andar}0${ap}`);

    }

  }

  const [selectedAp, setSelectedAp] =
    useState(null);

  const [encomendas, setEncomendas] =
    useState([]);

  const [busca, setBusca] =
    useState("");

  const [filtro, setFiltro] =
    useState("todos");

  useEffect(() => {

    carregarEncomendas();

  }, []);

  function carregarEncomendas() {

    const data =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    setEncomendas(data);

  }

  function contarPendentes(ap) {

    return encomendas.filter(

      (e) =>

        e.apartamento === ap &&
        e.status === "pendente"

    ).length;

  }

  function contarRetiradas(ap) {

    return encomendas.filter(

      (e) =>

        e.apartamento === ap &&
        e.status === "retirada"

    ).length;

  }

  function contarEsperadas(ap) {

    const esperadas =
      JSON.parse(
        localStorage.getItem(
          "encomendas_esperadas"
        )
      ) || [];

    return esperadas.filter(

      (e) =>
        e.apartamento === ap

    ).length;

  }

  const apartamentosFiltrados =
    apartamentos.filter((ap) => {

      const pendentes =
        contarPendentes(ap);

      const retiradas =
        contarRetiradas(ap);

      const esperadas =
        contarEsperadas(ap);

      const matchBusca =
        ap.includes(busca);

      if (filtro === "pendentes") {

        return (
          pendentes > 0 &&
          matchBusca
        );

      }

      if (filtro === "retiradas") {

        return (
          retiradas > 0 &&
          matchBusca
        );

      }

      if (filtro === "esperadas") {

        return (
          esperadas > 0 &&
          matchBusca
        );

      }

      return matchBusca;

    });

  return (

    <>

      {/* TOPO */}

      <div style={styles.topBar}>

        <input
          placeholder="Buscar apartamento..."
          value={busca}
          onChange={(e) =>
            setBusca(e.target.value)
          }
          style={styles.search}
        />

        <select
          value={filtro}
          onChange={(e) =>
            setFiltro(e.target.value)
          }
          style={styles.select}
        >

          <option value="todos">
            Todos
          </option>

          <option value="pendentes">
            Pendentes
          </option>

          <option value="retiradas">
            Retiradas
          </option>

          <option value="esperadas">
            Esperadas
          </option>

        </select>

      </div>

      {/* GRID */}

      <div style={styles.grid}>

        {apartamentosFiltrados.map((ap) => {

          const pendentes =
            contarPendentes(ap);

          const retiradas =
            contarRetiradas(ap);

          const esperadas =
            contarEsperadas(ap);

          let background = "white";

          if (pendentes > 0) {

            background = "#fde68a";

          }
          else if (
            pendentes === 0 &&
            retiradas > 0
          ) {

            background = "#bbf7d0";

          }

          return (

            <div
              key={ap}
              style={{
                ...styles.card,
                background
              }}
              onClick={() =>
                setSelectedAp(ap)
              }
            >

              {/* HEADER CARD */}

              <div style={styles.cardHeader}>

                <div style={styles.number}>

                  {ap}

                </div>

                {esperadas > 0 && (

                  <div style={styles.expectedBadge}>

                    📬

                  </div>

                )}

              </div>

              {/* STATUS */}

              <div style={styles.status}>

                {pendentes === 0 &&
                  retiradas === 0 &&
                  esperadas === 0 &&
                  "Sem movimentações"}

                {pendentes > 0 && (

                  <div style={styles.pending}>

                    📦 {pendentes}
                    {" "}
                    pendente
                    {pendentes > 1
                      ? "s"
                      : ""}

                  </div>

                )}

                {retiradas > 0 && (

                  <div style={styles.retiradas}>

                    ✅ {retiradas}
                    {" "}
                    retirada
                    {retiradas > 1
                      ? "s"
                      : ""}

                  </div>

                )}

                {esperadas > 0 && (

                  <div style={styles.expected}>

                    📬 {esperadas}
                    {" "}
                    esperada
                    {esperadas > 1
                      ? "s"
                      : ""}

                  </div>

                )}

              </div>

            </div>

          );

        })}

      </div>

      {/* MODAL */}

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

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "25px"
  },

  search: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px"
  },

  select: {
    width: "180px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "white"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(6, 1fr)",
    gap: "14px"
  },

  card: {
    borderRadius: "16px",
    padding: "20px",
    cursor: "pointer",
    border: "1px solid #e5e7eb",
    transition: "0.2s",
    boxShadow:
      "0 2px 6px rgba(0,0,0,0.04)",
    minHeight: "110px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  number: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827"
  },

  expectedBadge: {
    background: "#dbeafe",
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  status: {
    fontSize: "13px",
    color: "#6b7280",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  pending: {
    color: "#92400e",
    fontWeight: "600"
  },

  retiradas: {
    color: "#15803d",
    fontWeight: "600"
  },

  expected: {
    color: "#2563eb",
    fontWeight: "600"
  }

};