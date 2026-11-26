import { FiLock } from "react-icons/fi";

/**
 * Aviso exibido ao morador (geralmente dependente) quando o
 * condomínio não liberou o acesso a um módulo.
 */
export default function SemPermissaoMorador({ titulo, texto }) {
  return (
    <div className="ic-sem-permissao" style={styles.box} role="status">
      <span style={styles.icon} aria-hidden="true">
        <FiLock />
      </span>
      <div>
        <h2 style={styles.title}>{titulo}</h2>
        <p style={styles.text}>
          {texto ??
            "Seu perfil não tem acesso a este recurso. Se precisar, peça ao morador principal ou ao síndico para liberar a permissão."}
        </p>
      </div>
    </div>
  );
}

const styles = {
  box: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    padding: "24px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.92)",
    border: "1px dashed rgba(124,58,237,0.35)",
    boxShadow: "0 18px 40px rgba(76,29,149,0.08)",
  },
  icon: {
    flex: "0 0 auto",
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background: "rgba(124,58,237,0.12)",
    color: "#6d28d9",
    fontSize: "20px",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "18px",
    color: "#3b0764",
  },
  text: {
    margin: 0,
    color: "#5b5b73",
    lineHeight: 1.55,
  },
};
