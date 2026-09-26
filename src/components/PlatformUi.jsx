export function PlatformPageHeader({
  eyebrow,
  title,
  description,
  action = null,
}) {
  return (
    <div style={styles.header}>
      <div>
        <span style={styles.eyebrow}>
          {eyebrow}
        </span>

        <h2 style={styles.title}>
          {title}
        </h2>

        {description && (
          <p style={styles.description}>
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

export function PlatformLoading({
  text = "Carregando dados...",
}) {
  return (
    <div style={styles.state}>
      {text}
    </div>
  );
}

export function PlatformError({
  message,
}) {
  if (!message) {
    return null;
  }

  return (
    <div style={styles.error}>
      {message}
    </div>
  );
}

export function PlatformEmpty({
  text = "Nenhum registro encontrado.",
}) {
  return (
    <div style={styles.state}>
      {text}
    </div>
  );
}

export function PlatformCard({
  children,
  style = {},
}) {
  return (
    <div
      style={{
        ...styles.card,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PlatformButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  type = "button",
}) {
  const variants = {
    primary: {
      background: "linear-gradient(135deg,#6d28d9,#4c1d95)",
      color: "#ffffff",
      border: "1px solid #c8a85c",
    },
    secondary: {
      background: "#ffffff",
      color: "#5b21b6",
      border: "1px solid #ddd6fe",
    },
    danger: {
      background: "#ffffff",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    },
    success: {
      background: "#ffffff",
      color: "#15803d",
      border: "1px solid #bbf7d0",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        ...variants[variant],
        opacity:
          disabled
            ? 0.55
            : 1,
        cursor:
          disabled
            ? "not-allowed"
            : "pointer",
      }}
    >
      {children}
    </button>
  );
}

export const platformTableStyles = {
  wrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "760px",
  },

  th: {
    padding: "12px 14px",
    textAlign: "left",
    borderBottom: "1px solid #e9e5f0",
    color: "#6b6474",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.45px",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #f0edf5",
    color: "#342b40",
    fontSize: "13px",
    verticalAlign: "middle",
  },
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  eyebrow: {
    color: "#a17a28",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1.35px",
  },

  title: {
    margin: "7px 0 7px",
    fontSize: "clamp(28px,3vw,36px)",
    lineHeight: 1.08,
    letterSpacing: "-0.7px",
    color: "#21172d",
  },

  description: {
    margin: 0,
    color: "#71687b",
    lineHeight: 1.55,
    maxWidth: "760px",
    fontSize: "14px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e9e1ef",
    borderRadius: "20px",
    boxShadow:
      "0 14px 36px rgba(46,16,101,0.06)",
    padding: "22px",
  },

  state: {
    padding: "26px",
    background: "#ffffff",
    border: "1px solid #ece7f3",
    borderRadius: "16px",
    color: "#71687b",
    textAlign: "center",
  },

  error: {
    marginBottom: "18px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecdd3",
    fontSize: "13px",
  },

  button: {
    minHeight: "38px",
    padding: "0 14px",
    borderRadius: "10px",
    fontWeight: "800",
    fontSize: "12px",
  },
};

export default PlatformCard;
