function AccessCard({ icon, title, description, color, buttonColor }) {

    const styles = {
        card: {
            width: "260px",
            height: "320px",
            backgroundColor: "white",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "20px",
            boxShadow: "0px 6px 15px rgba(0,0,0,0.25)",
            cursor: "pointer",
            transition: "0.2s"
        },

        icon: {
            fontSize: "80px",
            marginBottom: "20px",
            color: color
        },

        title: {
            fontSize: "22px",
            fontWeight: "bold",
            color: color,
            marginBottom: "10px"
        },

        description: {
            fontSize: "14px",
            color: "#555",
            marginBottom: "20px",
            lineHeight: "1.4"
        },

        button: {
            padding: "10px 25px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: buttonColor,
            color: "white",
            fontWeight: "bold",
            cursor: "pointer"
        }
    };

    return (
        <div
            style={styles.card}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
            }}
        >
            <div style={styles.icon}>{icon}</div>

            <div style={styles.title}>{title}</div>

            <div style={styles.description}>{description}</div>

            <button style={styles.button}>Entrar</button>
        </div>
    );
}

export default AccessCard;