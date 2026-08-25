import {
  useEffect,
  useState,
} from "react";

import platformApi from "../../Services/platformApi.js";

import {
  PlatformButton,
  PlatformCard,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  platformTableStyles,
} from "../../components/PlatformUi.jsx";

function PlatformPlans() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setItems(
        await platformApi.plans
          .list()
      );
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao carregar planos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(plan) {
    try {
      if (
        plan.active === true ||
        plan.status === "ACTIVE" ||
        plan.isActive === true
      ) {
        await platformApi.plans
          .deactivate(plan.id);
      } else {
        await platformApi.plans
          .activate(plan.id);
      }

      await load();
    } catch (err) {
      setError(
        err?.message ??
        "Não foi possível alterar o plano."
      );
    }
  }

  if (loading) {
    return (
      <PlatformLoading text="Carregando planos..." />
    );
  }

  return (
    <div>
      <PlatformPageHeader
        eyebrow="COMERCIAL"
        title="Planos InfinityCondo"
        description="Planos comerciais persistidos no PostgreSQL."
      />

      <PlatformError
        message={error}
      />

      <PlatformCard>
        {items.length === 0 ? (
          <PlatformEmpty text="Nenhum plano cadastrado." />
        ) : (
          <div style={platformTableStyles.wrapper}>
            <table style={platformTableStyles.table}>
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>
                    Plano
                  </th>
                  <th style={platformTableStyles.th}>
                    Valor
                  </th>
                  <th style={platformTableStyles.th}>
                    Status
                  </th>
                  <th style={platformTableStyles.th}>
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((plan) => (
                  <tr key={plan.id}>
                    <td style={platformTableStyles.td}>
                      <strong>
                        {plan.name ??
                          plan.nome ??
                          "-"}
                      </strong>
                    </td>

                    <td style={platformTableStyles.td}>
                      {plan.monthlyPriceInCents !==
                      undefined
                        ? `R$ ${(
                            Number(
                              plan.monthlyPriceInCents
                            ) / 100
                          ).toFixed(2)}`
                        : "-"}
                    </td>

                    <td style={platformTableStyles.td}>
                      {plan.status ??
                        (
                          (plan.active ?? plan.isActive)
                            ? "ACTIVE"
                            : "INACTIVE"
                        )}
                    </td>

                    <td style={platformTableStyles.td}>
                      <PlatformButton
                        variant="secondary"
                        onClick={() =>
                          toggle(plan)
                        }
                      >
                        {plan.active === true ||
                        plan.status === "ACTIVE" ||
                        plan.isActive === true
                          ? "Desativar"
                          : "Ativar"}
                      </PlatformButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>
    </div>
  );
}

export default PlatformPlans;
