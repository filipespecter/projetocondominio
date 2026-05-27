import { useEffect, useState } from "react";

import {
  buscarMovimentacoes
} from "../../Services/movimentacaoService";

function DashboardPorteiro() {

  const [dados, setDados] = useState({
    visitantes: 0,
    encomendas: 0,
    moradores: 0,
    esperadas: 0
  });

  const [movimentacoes, setMovimentacoes] =
    useState([]);

  const [porteiro, setPorteiro] =
    useState(null);

  /* =========================
     CARREGAR SESSÃO
  ========================= */

  useEffect(() => {

    const sessaoSalva =
      localStorage.getItem("sessaoPorteiro") ||
      sessionStorage.getItem("sessaoPorteiro");

    try {

      const usuario =
        sessaoSalva
          ? JSON.parse(sessaoSalva)
          : null;

      setPorteiro(usuario);

    } catch {

      setPorteiro(null);

    }

  }, []);

  /* =========================
     CARREGAR DASHBOARD
  ========================= */

  useEffect(() => {

    carregarDashboard();

    const handleStorage = (event) => {

      if (

        event.key === "visitantes" ||
        event.key === "encomendas" ||
        event.key === "moradores" ||
        event.key === "encomendas_esperadas" ||
        event.key === "movimentacoes"

      ) {

        carregarDashboard();

      }

    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {

      window.removeEventListener(
        "storage",
        handleStorage
      );

    };

  }, []);

  /* =========================
     FUNÇÃO PRINCIPAL
  ========================= */

  function carregarDashboard() {

    const visitantes =
      JSON.parse(
        localStorage.getItem("visitantes")
      ) || [];

    const encomendas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const moradores =
      JSON.parse(
        localStorage.getItem("moradores")
      ) || [];

    const esperadas =
      JSON.parse(
        localStorage.getItem("encomendas_esperadas")
      ) || [];

    const pendentes = encomendas.filter(
      (e) => e.status === "pendente"
    );

    setDados({

      visitantes: visitantes.length,

      encomendas: pendentes.length,

      moradores: moradores.length,

      esperadas: esperadas.length

    });

    const movs =
      buscarMovimentacoes() || [];

    setMovimentacoes(movs);

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Dashboard
          </h1>

          <p style={styles.subtitle}>
            Central operacional do porteiro
          </p>

          {porteiro && (

            <p style={styles.userInfo}>

              Plantão ativo:{" "}

              <strong>
                {porteiro.nome}
              </strong>

            </p>

          )}

        </div>

        <div style={styles.dateBox}>

          <p style={styles.dateLabel}>
            Hoje
          </p>

          <h3 style={styles.date}>
            {new Date().toLocaleDateString()}
          </h3>

        </div>

      </div>

      {/* CARDS */}

      <div style={styles.cards}>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <div style={styles.iconGreen}>
              📦
            </div>

            <span style={styles.badgeWarning}>
              Pendentes
            </span>

          </div>

          <p style={styles.cardLabel}>
            Encomendas aguardando retirada
          </p>

          <h1 style={styles.cardNumber}>
            {dados.encomendas}
          </h1>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <div style={styles.iconBlue}>
              🚶
            </div>

            <span style={styles.badgeBlue}>
              Ativos
            </span>

          </div>

          <p style={styles.cardLabel}>
            Visitantes registrados
          </p>

          <h1 style={styles.cardNumber}>
            {dados.visitantes}
          </h1>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <div style={styles.iconDark}>
              👥
            </div>

            <span style={styles.badgeGreen}>
              Cadastrados
            </span>

          </div>

          <p style={styles.cardLabel}>
            Moradores ativos
          </p>

          <h1 style={styles.cardNumber}>
            {dados.moradores}
          </h1>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <div style={styles.iconYellow}>
              📬
            </div>

            <span style={styles.badgeYellow}>
              Esperadas
            </span>

          </div>

          <p style={styles.cardLabel}>
            Entregas aguardadas
          </p>

          <h1 style={styles.cardNumber}>
            {dados.esperadas}
          </h1>

        </div>

      </div>

      {/* GRID */}

      <div style={styles.bottomGrid}>

        {/* MOVIMENTAÇÕES */}

        <div style={styles.history}>

          <div style={styles.sectionHeader}>

            <h2 style={styles.historyTitle}>
              Movimentações recentes
            </h2>

            <span style={styles.live}>
              ● AO VIVO
            </span>

          </div>

          {movimentacoes.length === 0 && (

            <div style={styles.empty}>
              Nenhuma movimentação encontrada
            </div>

          )}

          {movimentacoes.map((item) => (

            <div
              key={item.id}
              style={styles.historyItem}
            >

              <div style={styles.historyIcon}>

                {item.tipo ===
                "encomenda_recebida"

                  ? "📦"

                  : item.tipo ===
                    "encomenda_retirada"

                  ? "✅"

                  : item.tipo ===
                    "visitante"

                  ? "🚶"

                  : "📌"}

              </div>

              <div>

                <p style={styles.historyText}>
                  {item.mensagem}
                </p>

                <span style={styles.historyTime}>

                  {item.data} • {item.porteiro}

                </span>

              </div>

            </div>

          ))}

        </div>

        {/* ALERTAS */}

        <div style={styles.alerts}>

          <h2 style={styles.alertTitle}>
            Alertas do condomínio
          </h2>

          {dados.encomendas > 0 && (

            <div style={styles.alertCardWarning}>

              <h3 style={styles.alertCardTitle}>
                ⚠️ Encomendas pendentes
              </h3>

              <p style={styles.alertText}>
                Existem encomendas aguardando retirada.
              </p>

            </div>

          )}

          {dados.esperadas > 0 && (

            <div style={styles.alertCardBlue}>

              <h3 style={styles.alertCardTitle}>
                📬 Entregas esperadas
              </h3>

              <p style={styles.alertText}>
                Existem entregas aguardadas pelos moradores.
              </p>

            </div>

          )}

          {dados.visitantes > 0 && (

            <div style={styles.alertCardGreen}>

              <h3 style={styles.alertCardTitle}>
                🚶 Visitantes ativos
              </h3>

              <p style={styles.alertText}>
                Existem visitantes registrados no sistema.
              </p>

            </div>

          )}

          {dados.encomendas === 0 &&
            dados.visitantes === 0 &&
            dados.esperadas === 0 && (

            <div style={styles.alertCardNeutral}>

              <h3 style={styles.alertCardTitle}>
                ✅ Operação tranquila
              </h3>

              <p style={styles.alertText}>
                Nenhum alerta operacional no momento.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}

/* =========================
   STYLES
========================= */

const styles = {

/* MANTIDOS EXATAMENTE IGUAIS */

};

export default DashboardPorteiro;