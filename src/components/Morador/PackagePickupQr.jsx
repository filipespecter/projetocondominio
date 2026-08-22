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
    border: "1px solid #ddd6fe",
    borderRadius: "30px",
    padding: "26px",
    boxShadow:
      "0 30px 90px rgba(46,16,101,0.30)",
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
    fontSize: "26px",
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

  qrArea: {
    margin: "24px auto 18px",
    minHeight: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "24px",
  },

  qr: {
    width: "280px",
    maxWidth: "90%",
    height: "auto",
  },

  loading: {
    color: "#7c3aed",
    fontWeight: "800",
  },

  codeBox: {
    textAlign: "center",
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
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
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
  },
};

export default PackagePickupQr;
