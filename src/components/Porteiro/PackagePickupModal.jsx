import {
  useMemo,
  useState,
} from "react";

import packageApi from "../../Services/packageApi.js";
import QrCameraScanner from "./QrCameraScanner.jsx";
import { imageFileToDataUrl } from "../../utils/imageCompression.js";

function PackagePickupModal({
  method,
  onClose,
  onCompleted,
}) {
  const [credential, setCredential] =
    useState("");
  const [validated, setValidated] =
    useState(null);
  const [loading, setLoading] =
    useState(false);
  const [deliveryProofImageDataUrl, setDeliveryProofImageDataUrl] = useState(null);
  const [deliveryProofName, setDeliveryProofName] = useState("");

  const [isPrimary, setIsPrimary] =
    useState(true);
  const [nonPrimaryType, setNonPrimaryType] =
    useState("DEPENDENT");
  const [pickupResidentId, setPickupResidentId] =
    useState("");

  const [thirdParty, setThirdParty] =
    useState({
      name: "",
      document: "",
      block: "",
      apartment: "",
    });

  const dependents =
    useMemo(
      () =>
        (validated?.residents ?? [])
          .filter(
            (resident) =>
              !resident.isPrimary
          ),
      [validated]
    );

  const packageRecord =
    validated?.package ??
    null;

  async function validateValue(value) {
    const normalized =
      method === "CODE"
        ? String(value ?? "")
            .replace(/\D/g, "")
        : String(value ?? "").trim();

    if (!normalized) {
      alert(
        method === "CODE"
          ? "Informe o código do cliente."
          : "Leia o QR Code do morador."
      );
      return;
    }

    if (
      method === "CODE" &&
      normalized.length !== 6
    ) {
      alert(
        "O código do cliente deve possuir 6 dígitos."
      );
      return;
    }

    try {
      setLoading(true);

      const data =
        await packageApi
          .validatePickup(
            method,
            normalized
          );

      setCredential(normalized);
      setValidated(data);
      setIsPrimary(true);
      setNonPrimaryType(
        "DEPENDENT"
      );
      setPickupResidentId("");
    } catch (error) {
      alert(
        error?.message ??
        "QR/código inválido ou já utilizado."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleProofFile(file) {
    if (!file) { setDeliveryProofImageDataUrl(null); setDeliveryProofName(""); return; }
    try {
      const dataUrl = await imageFileToDataUrl(file, { maxWidth: 1280, quality: 0.7 });
      setDeliveryProofImageDataUrl(dataUrl);
      setDeliveryProofName(file.name);
    } catch (error) {
      alert(error?.message ?? "Não foi possível preparar a foto.");
    }
  }

  async function confirm() {
    if (!packageRecord?.id) {
      return;
    }

    const payload = {
      method,
      value: credential,
      isPrimary,
      pickupResidentId: null,
      withdrawnBy: null,
      withdrawnDocument: null,
      withdrawnResidentBlock: null,
      withdrawnResidentApartment: null,
      deliveryProofImageDataUrl,
    };

    if (!isPrimary) {
      if (
        nonPrimaryType ===
        "DEPENDENT"
      ) {
        if (!pickupResidentId) {
          alert(
            "Selecione o dependente que está retirando."
          );
          return;
        }

        payload.pickupResidentId =
          pickupResidentId;
      } else {
        if (
          thirdParty.name
            .trim()
            .length < 3 ||
          thirdParty.document
            .trim()
            .length < 5 ||
          !thirdParty.block
            .trim() ||
          !thirdParty.apartment
            .trim()
        ) {
          alert(
            "Informe nome completo, documento, bloco e apartamento de quem está retirando."
          );
          return;
        }

        payload.withdrawnBy =
          thirdParty.name.trim();

        payload.withdrawnDocument =
          thirdParty.document.trim();

        payload.withdrawnResidentBlock =
          thirdParty.block.trim();

        payload.withdrawnResidentApartment =
          thirdParty.apartment.trim();
      }
    }

    try {
      setLoading(true);

      const updated =
        await packageApi
          .confirmPickup(
            packageRecord.id,
            payload
          );

      alert(
        `Retirada confirmada${
          updated?.withdrawnBy
            ? ` por ${updated.withdrawnBy}`
            : ""
        }.`
      );

      await onCompleted?.(
        updated
      );

      onClose?.();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível confirmar a retirada."
      );
    } finally {
      setLoading(false);
    }
  }

  const apartmentLabel =
    packageRecord
      ? `${packageRecord.apartment?.block ?? ""} - ${packageRecord.apartment?.number ?? ""}`
      : "";

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <span style={styles.badge}>
              {method === "QR"
                ? "📷 QR Code"
                : "🔢 Código do cliente"}
            </span>

            <h2 style={styles.title}>
              Dar baixa na encomenda
            </h2>

            <p style={styles.subtitle}>
              A validação identifica a encomenda.
              A baixa só acontece depois da confirmação final.
            </p>
          </div>

          <button
            type="button"
            style={styles.close}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {!validated && (
          <>
            {method === "QR" ? (
              <QrCameraScanner
                active
                onDetected={
                  validateValue
                }
              />
            ) : (
              <div style={styles.codePanel}>
                <label style={styles.label}>
                  Código do cliente
                </label>

                <input
                  autoFocus
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="000000"
                  value={credential}
                  onChange={(event) =>
                    setCredential(
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(0, 6)
                    )
                  }
                  style={styles.input}
                />

                <button
                  type="button"
                  disabled={loading}
                  style={styles.primary}
                  onClick={() =>
                    validateValue(
                      credential
                    )
                  }
                >
                  {loading
                    ? "Validando..."
                    : "Validar código"}
                </button>
              </div>
            )}
          </>
        )}

        {validated && (
          <div style={styles.confirmArea}>
            <div style={styles.packageCard}>
              <span style={styles.valid}>
                ✅ Credencial válida
              </span>

              <h3 style={styles.packageTitle}>
                {packageRecord?.type ??
                  "Encomenda"}
              </h3>

              <div style={styles.infoGrid}>
                <span>
                  🏢 Unidade:{" "}
                  <strong>
                    {apartmentLabel ||
                      "-"}
                  </strong>
                </span>

                <span>
                  🚚 Transportadora:{" "}
                  <strong>
                    {packageRecord?.carrier ||
                      "Não informada"}
                  </strong>
                </span>

                <span>
                  🔖 Rastreio:{" "}
                  <strong>
                    {packageRecord?.trackingCode ||
                      "Não informado"}
                  </strong>
                </span>

                <span>
                  🕒 Recebida:{" "}
                  <strong>
                    {packageRecord?.receivedAt
                      ? new Date(
                          packageRecord.receivedAt
                        ).toLocaleString(
                          "pt-BR"
                        )
                      : "-"}
                  </strong>
                </span>
              </div>
            </div>

            <div style={styles.question}>
              <label style={styles.label}>
                Retirado pelo morador principal?
              </label>

              <div style={styles.choiceRow}>
                <button
                  type="button"
                  style={{
                    ...styles.choice,
                    ...(isPrimary
                      ? styles.choiceActive
                      : {}),
                  }}
                  onClick={() =>
                    setIsPrimary(true)
                  }
                >
                  Sim
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.choice,
                    ...(!isPrimary
                      ? styles.choiceActive
                      : {}),
                  }}
                  onClick={() =>
                    setIsPrimary(false)
                  }
                >
                  Não
                </button>
              </div>
            </div>

            {isPrimary ? (
              <div style={styles.personCard}>
                <span style={styles.personType}>
                  Morador principal
                </span>

                <strong style={styles.personName}>
                  {
                    validated.residents?.find(
                      (resident) =>
                        resident.isPrimary
                    )?.name ??
                    "Morador principal não encontrado"
                  }
                </strong>
              </div>
            ) : (
              <>
                <label style={styles.label}>
                  Quem está retirando?
                </label>

                <select
                  value={nonPrimaryType}
                  onChange={(event) =>
                    setNonPrimaryType(
                      event.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="DEPENDENT">
                    Dependente cadastrado
                  </option>

                  <option value="OTHER">
                    Outra pessoa
                  </option>
                </select>

                {nonPrimaryType ===
                "DEPENDENT" ? (
                  <div style={styles.question}>
                    <label style={styles.label}>
                      Dependente do apartamento
                    </label>

                    <select
                      value={pickupResidentId}
                      onChange={(event) =>
                        setPickupResidentId(
                          event.target.value
                        )
                      }
                      style={styles.input}
                    >
                      <option value="">
                        Selecione
                      </option>

                      {dependents.map(
                        (resident) => (
                          <option
                            key={resident.id}
                            value={resident.id}
                          >
                            {resident.name}
                            {resident.document
                              ? ` • ${resident.document}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    {dependents.length ===
                      0 && (
                      <div style={styles.warning}>
                        Nenhum dependente cadastrado nesta unidade.
                        Cadastre-o no módulo Moradores ou escolha
                        “Outra pessoa”.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.thirdPartyGrid}>
                    <input
                      placeholder="Nome completo"
                      value={thirdParty.name}
                      onChange={(event) =>
                        setThirdParty({
                          ...thirdParty,
                          name:
                            event.target
                              .value,
                        })
                      }
                      style={styles.input}
                    />

                    <input
                      placeholder="Documento"
                      value={thirdParty.document}
                      onChange={(event) =>
                        setThirdParty({
                          ...thirdParty,
                          document:
                            event.target
                              .value,
                        })
                      }
                      style={styles.input}
                    />

                    <input
                      placeholder="Bloco onde reside"
                      value={thirdParty.block}
                      onChange={(event) =>
                        setThirdParty({
                          ...thirdParty,
                          block:
                            event.target
                              .value,
                        })
                      }
                      style={styles.input}
                    />

                    <input
                      placeholder="Apartamento onde reside"
                      value={thirdParty.apartment}
                      onChange={(event) =>
                        setThirdParty({
                          ...thirdParty,
                          apartment:
                            event.target
                              .value,
                        })
                      }
                      style={styles.input}
                    />
                  </div>
                )}
              </>
            )}

            <div style={styles.footer}>
              <button
                type="button"
                style={styles.secondary}
                onClick={() => {
                  setValidated(null);
                  setCredential("");
                }}
              >
                Voltar
              </button>

              <div style={styles.proofBox}>
              <div>
                <strong>📷 Comprovante de entrega (opcional)</strong>
                <p style={styles.proofText}>Anexe uma foto do pacote ou comprovante. A imagem é compactada antes do envio.</p>
              </div>
              <label style={styles.fileLabel}>
                {deliveryProofName ? "✓ Foto pronta" : "Selecionar foto"}
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" style={{display:"none"}} onChange={(e)=>handleProofFile(e.target.files?.[0])} />
              </label>
            </div>

            <button
                type="button"
                disabled={loading}
                style={styles.primary}
                onClick={confirm}
              >
                {loading
                  ? "Confirmando..."
                  : "Confirmar retirada"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,24,39,0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },

  modal: {
    width: "min(720px,100%)",
    maxHeight: "94vh",
    overflowY: "auto",
    background:
      "linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ddd6fe",
    borderRadius: "30px",
    padding: "26px",
    boxShadow:
      "0 30px 90px rgba(46,16,101,0.32)",
    fontFamily: "Arial",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  badge: {
    display: "inline-block",
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
  },

  title: {
    margin: "12px 0 0",
    color: "#4c1d95",
    fontSize: "27px",
  },

  subtitle: {
    color: "#6b7280",
    lineHeight: 1.5,
    marginBottom: 0,
  },

  close: {
    border: "none",
    background: "#f3e8ff",
    color: "#6d28d9",
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "24px",
  },

  codePanel: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "22px",
    padding: "20px",
  },

  label: {
    display: "block",
    color: "#4c1d95",
    fontWeight: "900",
    fontSize: "13px",
    margin: "0 0 8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "white",
    color: "#111827",
    marginBottom: "12px",
  },

  primary: {
    border: "none",
    borderRadius: "15px",
    padding: "14px 18px",
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
  },

  secondary: {
    border: "1px solid #ddd6fe",
    borderRadius: "15px",
    padding: "14px 18px",
    background: "white",
    color: "#6d28d9",
    fontWeight: "900",
    cursor: "pointer",
  },

  confirmArea: {
    display: "grid",
    gap: "16px",
  },

  packageCard: {
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
    color: "white",
    borderRadius: "22px",
    padding: "20px",
  },

  valid: {
    background: "rgba(255,255,255,0.15)",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
  },

  packageTitle: {
    margin: "14px 0",
    fontSize: "24px",
  },

  infoGrid: {
    display: "grid",
    gap: "8px",
    fontSize: "13px",
    color: "#f5f3ff",
  },

  question: {
    background: "#faf5ff",
    border: "1px solid #ede9fe",
    borderRadius: "18px",
    padding: "16px",
  },

  choiceRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  choice: {
    padding: "13px",
    borderRadius: "14px",
    border: "1px solid #c4b5fd",
    background: "white",
    color: "#6d28d9",
    fontWeight: "900",
    cursor: "pointer",
  },

  choiceActive: {
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    color: "white",
  },

  personCard: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    borderRadius: "18px",
    padding: "16px",
  },

  personType: {
    display: "block",
    color: "#166534",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "7px",
  },

  personName: {
    color: "#14532d",
    fontSize: "18px",
  },

  warning: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
    borderRadius: "14px",
    padding: "12px",
    fontSize: "12px",
  },

  thirdPartyGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "10px",
  },

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
  },
  proofBox: { marginTop: "18px", padding: "16px", borderRadius: "16px", border: "1px solid #ddd6fe", background: "linear-gradient(135deg,#faf5ff,#ffffff)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" },
  proofText: { margin: "5px 0 0", color: "#6b7280", fontSize: "12px", lineHeight: 1.45 },
  fileLabel: { cursor: "pointer", background: "#6d28d9", color: "white", padding: "10px 13px", borderRadius: "11px", fontSize: "12px", fontWeight: "800", whiteSpace: "nowrap" },
};

export default PackagePickupModal;
