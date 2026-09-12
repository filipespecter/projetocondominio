import { useEffect, useState } from "react";
import { me as getAuthenticatedUser } from "../../Services/authApi.js";
import packageApi from "../../Services/packageApi.js";
import PackagePickupModal from "../../components/Porteiro/PackagePickupModal.jsx";

import ApartmentGrid from "../../components/Porteiro/ApartmentGrid";

function EncomendasPorteiro() {
  const [encomendas, setEncomendas] = useState([]);
  const [porteiro, setPorteiro] = useState(null);
  const [pickupMethod, setPickupMethod] = useState(null);

  function mapPackage(item, residentList = []) {
    const resident =
      item.expectedByResident ??
      item.resident ??
      residentList.find(
        (r) =>
          String(r.id) ===
          String(
            item.expectedByResidentId ??
            item.residentId ??
            ""
          )
      ) ??
      residentList.find(
        (r) =>
          String(r.apartamentoId) ===
          String(item.apartmentId)
      );

    const user =
      resident?.user ??
      resident ??
      {};

    const statusMap = {
      EXPECTED: "Aguardando",
      RECEIVED: "Recebido",
      DELIVERED: "Entregue",
      CANCELED: "Cancelado",
    };

    return {
      ...item,
      codigoInterno:
        item.internalCode ??
        "",
      codigoRastreio:
        item.trackingCode ??
        "",
      codigo:
        item.trackingCode ??
        "",
      rastreio:
        item.trackingCode ??
        "",
      apartamento:
        item.apartment?.number ??
        resident?.apartment?.number ??
        resident?.apartamento ??
        "",
      apartamentoId:
        item.apartmentId ??
        item.apartment?.id ??
        null,
      moradorId:
        resident?.id ??
        null,
      morador:
        user.name ??
        resident?.nome ??
        "Morador",
      nome:
        user.name ??
        resident?.nome ??
        "Morador",
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
      status:
        statusMap[item.status] ??
        item.status ??
        "Recebido",
      data:
        item.receivedAt
          ? new Date(item.receivedAt).toLocaleString("pt-BR")
          : item.createdAt
            ? new Date(item.createdAt).toLocaleString("pt-BR")
            : "",
      dataRecebimento:
        item.receivedAt
          ? new Date(item.receivedAt).toLocaleDateString("pt-BR")
          : "",
      retiradaEm:
        item.deliveredAt
          ? new Date(item.deliveredAt).toLocaleString("pt-BR")
          : "",
      retiradoPor:
        item.withdrawnBy ??
        "",
      porteiroRecebimento:
        item.receivedBy?.name ??
        item.receivedBy?.user?.name ??
        "",
    };
  }

  async function atualizarTela() {
    try {
      const [
        user,
        data,
      ] = await Promise.all([
        getAuthenticatedUser(),
        packageApi.list(),
      ]);

      setPorteiro({
        ...user,
        nome:
          user?.name ??
          "Porteiro",
      });

      const mapped =
        (data ?? []).map(
          (item) =>
            mapPackage(item)
        );

      setEncomendas(mapped);
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar encomendas."
      );
    }
  }

  useEffect(() => {
    atualizarTela();
  }, []);

  const pendentes =
    encomendas.filter(
      (e) =>
        e.status === "Recebido"
    );

  const retiradas =
    encomendas.filter(
      (e) =>
        e.status === "Entregue"
    );

  const recebidasHoje =
    encomendas.filter((e) => {
      if (!e.dataRecebimento) {
        return false;
      }

      return (
        e.dataRecebimento ===
        new Date().toLocaleDateString(
          "pt-BR"
        )
      );
    });

  const retiradasHoje =
    encomendas.filter((e) => {
      if (!e.retiradaEm) {
        return false;
      }

      return e.retiradaEm.includes(
        new Date().toLocaleDateString(
          "pt-BR"
        )
      );
    });


  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📦 Central logística
          </span>

          <h1 style={styles.title}>
            Encomendas da Portaria
          </h1>

          <p style={styles.subtitle}>
            Controle premium de recebimentos, retiradas,
            entregas esperadas e movimentações dos apartamentos.
          </p>

          {porteiro && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Operador responsável:{" "}
                <strong>
                  {porteiro.nome}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Hoje
          </p>

          <h3 style={styles.heroNumber}>
            {recebidasHoje.length}
          </h3>

          <span style={styles.heroStatus}>
            Recebidas no plantão
          </span>
        </div>
      </div>

      <div style={styles.cardsGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Pendentes
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes.length}
            </h2>

            <span style={styles.cardHintLight}>
              aguardando retirada
            </span>
          </div>

          <div style={styles.cardIconLight}>
            📦
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBlue}>
            🔐
          </div>

          <div>
            <p style={styles.cardLabel}>
              Retirada segura
            </p>

            <h2 style={styles.cardNumberBlue}>
              QR / Código
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.cardLabel}>
              Retiradas
            </p>

            <h2 style={styles.cardNumberGreen}>
              {retiradas.length}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconYellow}>
            🕒
          </div>

          <div>
            <p style={styles.cardLabel}>
              Retiradas hoje
            </p>

            <h2 style={styles.cardNumberYellow}>
              {retiradasHoje.length}
            </h2>
          </div>
        </div>
      </div>
      <div style={styles.expectedSection}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Retirada segura
            </h2>

            <p style={styles.sectionSubtitle}>
              Escolha como validar a credencial apresentada pelo morador.
              A encomenda só é baixada após a confirmação final.
            </p>
          </div>

          <span style={styles.sectionBadge}>
            🔐 QR + código
          </span>
        </div>

        <div style={styles.expectedGrid}>
          <div style={styles.expectedCard}>
            <div style={styles.expectedTop}>
              <div>
                <span style={styles.expectedBadge}>
                  Opção 1
                </span>

                <h3 style={styles.expectedType}>
                  📷 Dar baixa com QR Code
                </h3>
              </div>

              <div style={styles.expectedIcon}>
                📷
              </div>
            </div>

            <p style={styles.expectedDescription}>
              Use a câmera do computador para ler o QR exibido
              no celular do morador.
            </p>

            <button
              style={styles.confirmButton}
              onClick={() =>
                setPickupMethod("QR")
              }
            >
              Abrir câmera
            </button>
          </div>

          <div style={styles.expectedCard}>
            <div style={styles.expectedTop}>
              <div>
                <span style={styles.expectedBadge}>
                  Opção 2
                </span>

                <h3 style={styles.expectedType}>
                  🔢 Dar baixa com código
                </h3>
              </div>

              <div style={styles.expectedIcon}>
                🔢
              </div>
            </div>

            <p style={styles.expectedDescription}>
              Se a portaria não possuir câmera, digite o código
              de 6 dígitos informado pelo morador.
            </p>

            <button
              style={styles.confirmButton}
              onClick={() =>
                setPickupMethod("CODE")
              }
            >
              Digitar código
            </button>
          </div>
        </div>
      </div>

      <div style={styles.apartmentSection}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Mapa de apartamentos
            </h2>

            <p style={styles.sectionSubtitle}>
              Clique em um apartamento para registrar ou consultar encomendas.
              A retirada segura é feita pelos botões acima.
            </p>
          </div>

          <span style={styles.sectionBadgeGreen}>
            🏢 Torre operacional
          </span>
        </div>

        <ApartmentGrid onRefresh={atualizarTela} />
      </div>

      {pickupMethod && (
        <PackagePickupModal
          method={pickupMethod}
          onClose={() =>
            setPickupMethod(null)
          }
          onCompleted={
            atualizarTela
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
    minWidth: 0,
    background:
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary-strong),var(--ic-primary))",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow:
      "0 22px 55px rgb(var(--ic-primary-rgb) / 0.24), 0 0 38px rgb(var(--ic-primary-bright-rgb) / 0.12)",
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
    color: "var(--ic-primary-soft)",
    fontSize: "14px",
    fontWeight: "600"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "var(--ic-primary-bright)",
    boxShadow:
      "0 0 0 5px rgb(var(--ic-primary-bright-rgb) / 0.18)"
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
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-light))",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 14px 35px rgb(var(--ic-primary-rgb) / 0.18)"
  },

  card: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.08),transparent 34%), white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid var(--ic-primary-soft-2)"
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

  cardIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "var(--ic-primary-soft-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "var(--ic-primary-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconYellow: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  cardNumberBlue: {
    margin: "8px 0 0",
    color: "var(--ic-primary)",
    fontSize: "34px"
  },

  cardNumberGreen: {
    margin: "8px 0 0",
    color: "var(--ic-primary)",
    fontSize: "34px"
  },

  cardNumberYellow: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  expectedSection: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid var(--ic-primary-soft-2)"
  },

  apartmentSection: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid var(--ic-primary-soft-2)"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "22px"
  },

  sectionTitle: {
    margin: 0,
    color: "var(--ic-primary-strong)",
    fontSize: "24px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "var(--ic-primary-soft-3)",
    color: "var(--ic-primary-strong)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  sectionBadgeGreen: {
    background: "var(--ic-primary-soft-3)",
    color: "var(--ic-primary)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  expectedGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px"
  },

  expectedCard: {
    minWidth: 0,
    background: "#fbfaff",
    borderRadius: "22px",
    padding: "22px",
    border: "1px solid var(--ic-primary-border-soft)"
  },

  expectedTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px"
  },

  expectedBadge: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "9px"
  },

  expectedType: {
    margin: 0,
    color: "#111827",
    fontSize: "18px"
  },

  expectedIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "var(--ic-primary-soft-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px"
  },

  expectedDescription: {
    color: "#374151",
    lineHeight: "1.5",
    margin: "0 0 16px"
  },

  expectedMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "18px"
  },

  confirmButton: {
    width: "100%",
    background:
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow:
      "0 12px 25px rgb(var(--ic-primary-rgb) / 0.18)"
  }
};

export default EncomendasPorteiro;