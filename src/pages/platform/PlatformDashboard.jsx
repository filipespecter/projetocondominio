import {
  useEffect,
  useState,
} from "react";

import platformApi from "../../Services/platformApi.js";

import {
  PlatformCard,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
} from "../../components/PlatformUi.jsx";

function metricValue(
  object,
  keys,
  fallback = 0
) {
  for (const key of keys) {
    if (
      object?.[key] !==
      undefined
    ) {
      return object[key];
    }
  }

  return fallback;
}

function PlatformDashboard() {
  const [
    data,
    setData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    platformApi.dashboard
      .get()
      .then((response) => {
        if (active) {
          setData(response);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.message ??
            "Não foi possível carregar a Central Star."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <PlatformLoading text="Carregando dashboard da Central Star..." />
    );
  }

  const dashboard =
    data?.dashboard ??
    data ??
    {};

  const condominium =
    dashboard.condominiums ??
    {};

  const users =
    dashboard.users ??
    {};

  const billing =
    dashboard.billing ??
    null;

  return (
    <div>
      <PlatformPageHeader
        eyebrow="CENTRAL STAR INFINITY CODE"
        title="Dashboard da plataforma"
        description="Indicadores carregados diretamente do backend e do PostgreSQL."
      />

      <PlatformError
        message={error}
      />

      <div style={styles.grid}>
        <PlatformCard>
          <span style={styles.label}>
            Condomínios
          </span>

          <strong style={styles.value}>
            {metricValue(
              condominium,
              [
                "total",
                "all",
                "count",
              ]
            )}
          </strong>

          <small style={styles.small}>
            Total cadastrado
          </small>
        </PlatformCard>

        <PlatformCard>
          <span style={styles.label}>
            Pendentes
          </span>

          <strong style={styles.value}>
            {metricValue(
              condominium,
              [
                "pending",
                "pendingApproval",
              ]
            )}
          </strong>

          <small style={styles.small}>
            Aguardando análise
          </small>
        </PlatformCard>

        <PlatformCard>
          <span style={styles.label}>
            Usuários
          </span>

          <strong style={styles.value}>
            {metricValue(
              users,
              [
                "total",
                "all",
                "count",
              ]
            )}
          </strong>

          <small style={styles.small}>
            Contas da plataforma
          </small>
        </PlatformCard>

        {billing && (
          <PlatformCard>
            <span style={styles.label}>
              Financeiro
            </span>

            <strong style={styles.value}>
              {metricValue(
                billing?.charges ?? billing,
                [
                  "total",
                  "totalCharges",
                  "count",
                ]
              )}
            </strong>

            <small style={styles.small}>
              Visível somente para OWNER
            </small>
          </PlatformCard>
        )}
      </div>

      <PlatformCard
        style={{
          marginTop: "18px",
        }}
      >
        <strong>
          Backend conectado
        </strong>

        <p style={styles.text}>
          Este dashboard não utiliza localStorage para dados
          operacionais. Os valores exibidos vêm da API da
          Central Star.
        </p>
      </PlatformCard>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(190px,1fr))",
    gap: "16px",
  },

  label: {
    display: "block",
    color: "#756d7d",
    fontSize: "12px",
    fontWeight: "700",
  },

  value: {
    display: "block",
    marginTop: "9px",
    color: "#4c1d95",
    fontSize: "29px",
  },

  small: {
    display: "block",
    marginTop: "6px",
    color: "#8b8393",
  },

  text: {
    margin: "8px 0 0",
    color: "#71687b",
    lineHeight: 1.6,
    fontSize: "13px",
  },
};

export default PlatformDashboard;
