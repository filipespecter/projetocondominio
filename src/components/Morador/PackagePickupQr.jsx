import { useEffect, useState } from "react";
import QRCode from "qrcode";

function PackagePickupQr({
  credential,
  onClose,
}) {
  const [qrImage, setQrImage] =
    useState("");

  useEffect(() => {
    let active = true;

    async function generate() {
      if (!credential?.qrToken) {
        setQrImage("");
        return;
      }

      try {
        const dataUrl =
          await QRCode.toDataURL(
            credential.qrToken,
            {
              width: 280,
              margin: 2,
              errorCorrectionLevel: "M",
            }
          );

        if (active) {
          setQrImage(dataUrl);
        }
      } catch {
        if (active) {
          setQrImage("");
        }
      }
    }

    generate();

    return () => {
      active = false;
    };
  }, [credential]);

  if (!credential) {
    return null;
  }

  const code =
    String(
      credential.code ?? ""
    ).replace(
      /(\d{3})(\d{3})/,
      "$1 $2"
    );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <span style={styles.badge}>
              🔐 Retirada segura
            </span>

            <h2 style={styles.title}>
              QR Code da encomenda
            </h2>

            <p style={styles.subtitle}>
              Mostre o QR à portaria. Se o computador não possuir câmera,
              informe o código de 6 dígitos.
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

        <div style={styles.qrArea}>
          {qrImage ? (
            <img
              src={qrImage}
              alt="QR Code de retirada"
              style={styles.qr}
            />
          ) : (
            <div style={styles.loading}>
              Gerando QR...
            </div>
          )}
        </div>

        <div style={styles.codeBox}>
          <span style={styles.codeLabel}>
            Código do cliente
          </span>

          <strong style={styles.code}>
            {code || "------"}
          </strong>
        </div>

        <div style={styles.warning}>
          ⚠️ O QR e o código dão acesso à validação da retirada.
          Não compartilhe com terceiros.
        </div>

        <button
          type="button"
          style={styles.primary}
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,24,39,0.58)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },

  modal: {
    width: "min(520px,100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background:
      "linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "30px",
    padding: "26px",
    boxShadow:
      "0 30px 90px rgb(var(--ic-primary-deepest-rgb) / 0.30)",
    fontFamily: "Arial",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },

  badge: {
    display: "inline-block",
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
  },

  title: {
    margin: "12px 0 0",
    color: "var(--ic-primary-deep)",
    fontSize: "26px",
  },

  subtitle: {
    color: "#6b7280",
    lineHeight: 1.5,
    marginBottom: 0,
  },

  close: {
    border: "none",
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary-strong)",
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "24px",
  },

  qrArea: {
    margin: "24px auto 18px",
    minHeight: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "24px",
  },

  qr: {
    width: "280px",
    maxWidth: "90%",
    height: "auto",
  },

  loading: {
    color: "var(--ic-primary)",
    fontWeight: "800",
  },

  codeBox: {
    textAlign: "center",
    background:
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary))",
    color: "white",
    borderRadius: "22px",
    padding: "18px",
  },

  codeLabel: {
    display: "block",
    fontSize: "12px",
    opacity: 0.8,
    marginBottom: "8px",
  },

  code: {
    fontSize: "32px",
    letterSpacing: "5px",
  },

  warning: {
    marginTop: "16px",
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
    borderRadius: "16px",
    padding: "13px",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  primary: {
    width: "100%",
    marginTop: "18px",
    border: "none",
    borderRadius: "16px",
    padding: "14px",
    background:
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-light))",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
  },
};

export default PackagePickupQr;
