import {
  useEffect,
  useState,
} from "react";

import {
  me as getAuthenticatedUser,
} from "../../Services/authApi.js";

import packageApi from "../../Services/packageApi.js";
import PackagePickupQr from "../../components/Morador/PackagePickupQr.jsx";

function EncomendasMorador() {
  const [morador, setMorador] =
    useState(null);

  const [encomendas, setEncomendas] =
    useState([]);

  const [busca, setBusca] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState("Todos");

  const [credential, setCredential] =
    useState(null);

  const [loadingCredential, setLoadingCredential] =
    useState(null);

  function mapPackage(item) {
    return {
      ...item,
      tipo:
        item.type ??
        "Encomenda",
      descricao:
        item.description ??
        item.type ??
        "Encomenda",
      transportadora:
        item.carrier ??
        "",
      codigoRastreio:
        item.trackingCode ??
        "",
      apartamento:
        item.apartment?.number ??
        "",
      bloco:
        item.apartment?.block ??
        "",
      status:
        item.status === "RECEIVED"
          ? "recebido"
          : item.status === "DELIVERED"
            ? "entregue"
            : item.status === "CANCELED"
              ? "cancelado"
              : item.status?.toLowerCase(),
      data:
        item.receivedAt
          ? new Date(
              item.receivedAt
            ).toLocaleString(
              "pt-BR"
            )
          : item.createdAt
            ? new Date(
                item.createdAt
              ).toLocaleString(
                "pt-BR"
              )
            : "",
      retiradaEm:
        item.deliveredAt
          ? new Date(
              item.deliveredAt
            ).toLocaleString(
              "pt-BR"
            )
          : "",
      retiradoPor:
        item.withdrawnBy ??
        "",
      pickupMethod:
        item.pickupMethod ??
        "",
      pickupPersonType:
        item.pickupPersonType ??
        "",
    };
  }

  async function carregarDados() {
    try {
      const [
        user,
        packageData,
      ] = await Promise.all([
        getAuthenticatedUser(),
        packageApi.my(),
      ]);

      setMorador({
        ...user,
        nome:
          user?.name ??
          "Morador",
      });

      setEncomendas(
        (packageData ?? [])
          .map(mapPackage)
          .filter(
            (item) =>
              item.status !==
              "expected"
          )
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar suas encomendas."
      );
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function exibirRetirada(item) {
    try {
      setLoadingCredential(
        item.id
      );

      const data =
        await packageApi
          .generatePickupCredential(
            item.id
          );

      setCredential(
        data?.credential ??
        null
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível gerar o QR/código de retirada."
      );
    } finally {
      setLoadingCredential(
        null
      );
    }
  }

  const encomendasFiltradas =
    encomendas.filter(
      (item) => {
        const texto =
          busca
            .trim()
            .toLowerCase();

        const correspondeBusca =
          !texto ||
          item.tipo
            ?.toLowerCase()
            .includes(texto) ||
          item.descricao
            ?.toLowerCase()
            .includes(texto) ||
          item.transportadora
            ?.toLowerCase()
            .includes(texto) ||
          item.codigoRastreio
            ?.toLowerCase()
            .includes(texto);

        const correspondeStatus =
          filtroStatus === "Todos" ||
          item.status ===
            filtroStatus;

        return (
          correspondeBusca &&
          correspondeStatus
        );
      }
    );

  const pendentes =
    encomendas.filter(
      (item) =>
        item.status ===
        "recebido"
    );

  const retiradas =
    encomendas.filter(
      (item) =>
        item.status ===
        "entregue"
    );

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📦 Central de encomendas
          </span>

          <h1 style={styles.title}>
            Minhas Encomendas
          </h1>

          <p style={styles.subtitle}>
            Acompanhe encomendas registradas pela portaria e use
            QR Code ou código do cliente para uma retirada segura.
          </p>

          {morador && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Morador:{" "}
                <strong>
                  {morador.nome}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Pendentes
          </p>

          <h3 style={styles.heroNumber}>
            {pendentes.length}
          </h3>

          <span style={styles.heroStatus}>
            aguardando retirada
          </span>
        </div>
      </div>

      <div style={styles.resumeGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Encomendas pendentes
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes.length}
            </h2>

            <span style={styles.cardHintLight}>
              disponíveis na portaria
            </span>
          </div>

          <div style={styles.cardIconLight}>
            📦
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Retiradas
            </p>

            <h2 style={styles.resumeNumberGreen}>
              {retiradas.length}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconBlue}>
            🔐
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Retirada segura
            </p>

            <h2 style={styles.resumeNumberBlue}>
              QR + código
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Como retirar
              </h2>

              <p style={styles.sectionSubtitle}>
                Quando uma encomenda estiver disponível, abra o
                QR/código e apresente à portaria.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              Seguro
            </span>
          </div>

          <div style={styles.waitingBox}>
            <div style={styles.waitingCard}>
              <div>
                <span style={styles.waitingStatus}>
                  Opção 1
                </span>

                <h3 style={styles.waitingType}>
                  📷 QR Code
                </h3>

                <p style={styles.waitingDescription}>
                  A portaria pode ler o QR pela câmera do computador.
                </p>
              </div>
            </div>

            <div style={styles.waitingCard}>
              <div>
                <span style={styles.waitingStatus}>
                  Opção 2
                </span>

                <h3 style={styles.waitingType}>
                  🔢 Código do cliente
                </h3>

                <p style={styles.waitingDescription}>
                  Se não houver câmera, informe o código de 6 dígitos.
                </p>
              </div>
            </div>
          </div>

          <p style={styles.formHint}>
            A baixa só é concluída depois que a portaria confirma
            quem retirou a encomenda.
          </p>
        </div>

        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Encomendas recebidas
              </h2>

              <p style={styles.sectionSubtitle}>
                Registros da portaria para o seu apartamento.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                placeholder="Buscar encomenda..."
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                style={styles.search}
              />

              <select
                value={filtroStatus}
                onChange={(event) =>
                  setFiltroStatus(
                    event.target.value
                  )
                }
                style={styles.filter}
              >
                <option value="Todos">
                  Todos
                </option>

                <option value="recebido">
                  Pendente
                </option>

                <option value="entregue">
                  Retirada
                </option>
              </select>
            </div>
          </div>

          {encomendasFiltradas.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhuma encomenda encontrada
              </h3>

              <p style={styles.emptyText}>
                Quando a portaria registrar uma encomenda,
                ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div style={styles.list}>
              {encomendasFiltradas.map(
                (item) => (
                  <div
                    key={item.id}
                    style={styles.card}
                  >
                    <div style={styles.cardTop}>
                      <div style={styles.packageIcon}>
                        📦
                      </div>

                      <div style={styles.cardContent}>
                        <div style={styles.badges}>
                          <span
                            style={{
                              ...styles.status,
                              background:
                                item.status ===
                                "recebido"
                                  ? "#fef3c7"
                                  : "#dcfce7",
                              color:
                                item.status ===
                                "recebido"
                                  ? "#92400e"
                                  : "#166534",
                            }}
                          >
                            {item.status ===
                            "recebido"
                              ? "Aguardando retirada"
                              : "Retirada"}
                          </span>

                          {item.codigoRastreio && (
                            <span style={styles.dateBadge}>
                              🔖 {item.codigoRastreio}
                            </span>
                          )}
                        </div>

                        <h2 style={styles.packageTitle}>
                          {item.tipo}
                        </h2>

                        <p style={styles.description}>
                          {item.descricao}
                        </p>

                        <div style={styles.infoGrid}>
                          <span>
                            🏢 Unidade{" "}
                            {item.bloco
                              ? `${item.bloco} - `
                              : ""}
                            {item.apartamento}
                          </span>

                          <span>
                            🕒 Recebida:{" "}
                            {item.data}
                          </span>

                          {item.transportadora && (
                            <span>
                              🚚 {item.transportadora}
                            </span>
                          )}

                          {item.retiradaEm && (
                            <span>
                              ✅ Retirada:{" "}
                              {item.retiradaEm}
                            </span>
                          )}

                          {item.retiradoPor && (
                            <span>
                              👤 Retirado por:{" "}
                              {item.retiradoPor}
                            </span>
                          )}
                        </div>

                        {item.status ===
                          "recebido" && (
                          <button
                            type="button"
                            style={{
                              ...styles.button,
                              marginTop:
                                "16px",
                            }}
                            disabled={
                              loadingCredential ===
                              item.id
                            }
                            onClick={() =>
                              exibirRetirada(
                                item
                              )
                            }
                          >
                            {loadingCredential ===
                            item.id
                              ? "Gerando..."
                              : "Exibir QR / código"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {credential && (
        <PackagePickupQr
          credential={credential}
          onClose={() =>
            setCredential(null)
          }
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minWidth: 0,
    overflowX: "hidden",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow:
      "0 22px 55px rgba(124,58,237,0.24), 0 0 38px rgba(168,85,247,0.12)",
    border: "1px solid rgba(255,255,255,0.18)"
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
    display: "inline-block",
    marginBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "36px",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "680px",
    lineHeight: "1.5"
  },

  userLine: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ede9fe",
    fontSize: "14px",
    fontWeight: "600",
    flexWrap: "wrap"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#a855f7",
    boxShadow:
      "0 0 0 5px rgba(168,85,247,0.18)"
  },

  apBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "7px 11px",
    borderRadius: "999px",
    color: "white",
    fontWeight: "800",
    fontSize: "12px"
  },

  heroPanel: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "24px",
    padding: "22px",
    minWidth: "230px",
    textAlign: "center",
    backdropFilter: "blur(12px)"
  },

  heroLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.68)",
    fontSize: "13px"
  },

  heroNumber: {
    margin: "8px 0 12px",
    color: "white",
    fontSize: "38px"
  },

  heroStatus: {
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 16px 36px rgba(124,58,237,0.24), 0 0 28px rgba(168,85,247,0.12)"
  },

  cardLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px"
  },

  cardNumberLight: {
    margin: "10px 0 2px",
    color: "white",
    fontSize: "38px"
  },

  cardHintLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px"
  },

  cardIconLight: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px"
  },

  resumeCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid #ede9fe"
  },

  cardIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f3e8ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  resumeLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  resumeNumberGreen: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  resumeNumberBlue: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  mainGrid: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "390px 1fr",
    gap: "24px",
    alignItems: "flex-start"
  },

  formCard: {
    minWidth: 0,
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  listCard: {
    minWidth: 0,
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  sectionTitle: {
    margin: 0,
    color: "#4c1d95",
    fontSize: "24px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "#faf5ff",
    color: "#6d28d9",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "800"
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    boxSizing: "border-box",
    marginBottom: "15px"
  },

  textarea: {
    width: "100%",
    minHeight: "115px",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    boxSizing: "border-box",
    marginBottom: "16px",
    resize: "vertical",
    fontFamily: "Arial",
    lineHeight: "1.5"
  },

  button: {
    width: "100%",
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow:
      "0 12px 25px rgba(37,99,235,0.22)"
  },

  formHint: {
    margin: "14px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "1.5",
    textAlign: "center"
  },

  listHeader: {
    minWidth: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  filters: {
    minWidth: 0,
    display: "flex",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    minWidth: "210px"
  },

  filter: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed #c4b5fd",
    borderRadius: "22px",
    padding: "45px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#6b7280"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  card: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "22px",
    boxShadow:
      "0 10px 25px rgba(15,23,42,0.04)"
  },

  cardTop: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start"
  },

  packageIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "20px",
    background: "white",
    border: "1px solid #ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    flexShrink: 0
  },

  cardContent: {
    flex: 1
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  status: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  dateBadge: {
    background: "#faf5ff",
    color: "#6d28d9",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  packageTitle: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "22px"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 14px"
  },

  infoGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px"
  },

  waitingBox: {
    marginTop: "30px",
    borderTop: "1px solid #ddd6fe",
    paddingTop: "24px"
  },

  waitingHeader: {
    marginBottom: "16px"
  },

  waitingList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  waitingCard: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start"
  },

  waitingStatus: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "9px"
  },

  waitingType: {
    margin: "0 0 8px",
    color: "#111827"
  },

  waitingDescription: {
    color: "#374151",
    margin: "0 0 12px"
  },

  cancelButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px 14px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800",
    whiteSpace: "nowrap"
  }
};

export default EncomendasMorador;