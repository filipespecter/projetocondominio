import {
  useEffect,
  useState,
} from "react";

import platformApi from "../../Services/platformApi.js";

import {
  PlatformCard,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  platformTableStyles,
} from "../../components/PlatformUi.jsx";

function PlatformAudit() {
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

  useEffect(() => {
    platformApi.audit
      .list()
      .then((data) => {
        setItems(
          Array.isArray(data)
            ? data
            : (
                data?.items ??
                data?.data ??
                []
              )
        );
      })
      .catch((err) => {
        setError(
          err?.message ??
          "Falha ao carregar auditoria."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <PlatformLoading text="Carregando auditoria..." />
    );
  }

  return (
    <div>
      <PlatformPageHeader
        eyebrow="RASTREABILIDADE"
        title="Auditoria global"
        description="Ações registradas pelo backend, com usuário, módulo e contexto."
      />

      <PlatformError
        message={error}
      />

      <PlatformCard>
        {items.length === 0 ? (
          <PlatformEmpty />
        ) : (
          <div style={platformTableStyles.wrapper}>
            <table style={platformTableStyles.table}>
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>
                    Data
                  </th>
                  <th style={platformTableStyles.th}>
                    Usuário
                  </th>
                  <th style={platformTableStyles.th}>
                    Ação
                  </th>
                  <th style={platformTableStyles.th}>
                    Módulo
                  </th>
                  <th style={platformTableStyles.th}>
                    Detalhes
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={platformTableStyles.td}>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleString(
                            "pt-BR"
                          )
                        : "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.userName ??
                        item.user?.name ??
                        "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.action ?? "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.module ?? "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.details ?? "-"}
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

export default PlatformAudit;
