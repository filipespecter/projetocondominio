import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FaBell,
  FaCheckDouble,
  FaTrash,
} from "react-icons/fa";

import {
  listarMinhasNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  removerNotificacao,
  removerLidas,
} from "../Services/notificacaoService.js";

function NotificationCenter() {
  const [open, setOpen] =
    useState(false);

  const [items, setItems] =
    useState([]);

  const [unread, setUnread] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const carregar =
    useCallback(
      async () => {
        try {
          const [
            notifications,
            unreadCount,
          ] =
            await Promise.all([
              listarMinhasNotificacoes(),
              contarNaoLidas(),
            ]);

          setItems(
            notifications ?? []
          );

          setUnread(
            unreadCount
          );
        } catch {
          // Não bloqueia o restante do painel
          // caso a central esteja indisponível.
        }
      },
      []
    );

  useEffect(() => {
    carregar();

    const interval =
      setInterval(
        carregar,
        15000
      );

    return () =>
      clearInterval(interval);
  }, [carregar]);

  async function abrir() {
    setOpen(
      (current) =>
        !current
    );

    if (!open) {
      await carregar();
    }
  }

  async function ler(item) {
    if (item.readAt) {
      return;
    }

    try {
      await marcarComoLida(
        item.id
      );

      await carregar();
    } catch {
      // Mantém a central utilizável.
    }
  }

  async function lerTodas() {
    try {
      setLoading(true);

      await marcarTodasComoLidas();
      await carregar();
    } finally {
      setLoading(false);
    }
  }

  async function excluir(item) {
    try {
      await removerNotificacao(
        item.id
      );

      await carregar();
    } catch {
      // Mantém a lista atual.
    }
  }

  async function limparLidas() {
    try {
      setLoading(true);

      await removerLidas();
      await carregar();
    } finally {
      setLoading(false);
    }
  }

  function prioridade(item) {
    if (
      item.priority ===
      "URGENT"
    ) {
      return "Urgente";
    }

    if (
      item.priority ===
      "HIGH"
    ) {
      return "Alta";
    }

    return null;
  }

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        aria-label="Central de notificações"
        title="Central de notificações"
        style={styles.bell}
        onClick={abrir}
      >
        <FaBell />

        {unread > 0 && (
          <span style={styles.count}>
            {unread > 99
              ? "99+"
              : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <div>
              <span style={styles.eyebrow}>
                CENTRAL
              </span>

              <h3 style={styles.title}>
                Notificações
              </h3>
            </div>

            <span style={styles.unread}>
              {unread} não lida
              {unread === 1
                ? ""
                : "s"}
            </span>
          </div>

          <div style={styles.toolbar}>
            <button
              type="button"
              style={styles.toolButton}
              disabled={
                loading ||
                unread === 0
              }
              onClick={lerTodas}
            >
              <FaCheckDouble />
              Marcar lidas
            </button>

            <button
              type="button"
              style={styles.toolButton}
              disabled={loading}
              onClick={limparLidas}
            >
              <FaTrash />
              Limpar lidas
            </button>
          </div>

          <div style={styles.list}>
            {items.length === 0 ? (
              <div style={styles.empty}>
                <span style={styles.emptyIcon}>
                  🔔
                </span>

                <strong>
                  Nenhuma notificação
                </strong>

                <small>
                  Novos eventos do sistema aparecerão aqui.
                </small>
              </div>
            ) : (
              items
                .slice(0, 40)
                .map(
                  (item) => (
                    <article
                      key={item.id}
                      style={{
                        ...styles.item,
                        ...(!item.readAt
                          ? styles.itemUnread
                          : {}),
                      }}
                      onClick={() =>
                        ler(item)
                      }
                    >
                      <div style={styles.itemTop}>
                        <strong style={styles.itemTitle}>
                          {item.title}
                        </strong>

                        {prioridade(item) && (
                          <span style={styles.priority}>
                            {prioridade(item)}
                          </span>
                        )}
                      </div>

                      <p style={styles.message}>
                        {item.message}
                      </p>

                      <div style={styles.meta}>
                        <span>
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleString(
                                "pt-BR"
                              )
                            : ""}
                        </span>

                        {item.apartmentLabel && (
                          <span>
                            🏢 {item.apartmentLabel}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        style={styles.delete}
                        title="Remover notificação"
                        onClick={(event) => {
                          event.stopPropagation();
                          excluir(item);
                        }}
                      >
                        ×
                      </button>
                    </article>
                  )
                )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    top: "18px",
    right: "22px",
    zIndex: 9800,
    fontFamily: "Arial",
  },

  bell: {
    position: "relative",
    width: "48px",
    height: "48px",
    border: "1px solid #ddd6fe",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg,#ffffff,#f5f3ff)",
    color: "#6d28d9",
    boxShadow:
      "0 12px 32px rgba(76,29,149,0.18)",
    cursor: "pointer",
    fontSize: "18px",
    display: "grid",
    placeItems: "center",
  },

  count: {
    position: "absolute",
    top: "-7px",
    right: "-7px",
    minWidth: "21px",
    height: "21px",
    padding: "0 5px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "white",
    border: "2px solid white",
    fontSize: "10px",
    fontWeight: "900",
    display: "grid",
    placeItems: "center",
    boxSizing: "border-box",
  },

  panel: {
    position: "absolute",
    top: "58px",
    right: 0,
    width: "min(390px,calc(100vw - 30px))",
    maxHeight: "76vh",
    overflow: "hidden",
    background: "white",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    boxShadow:
      "0 28px 80px rgba(46,16,101,0.28)",
  },

  header: {
    padding: "18px 18px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    borderBottom: "1px solid #ede9fe",
  },

  eyebrow: {
    display: "block",
    fontSize: "9px",
    letterSpacing: "2px",
    color: "#8b5cf6",
    fontWeight: "900",
  },

  title: {
    margin: "3px 0 0",
    color: "#4c1d95",
    fontSize: "19px",
  },

  unread: {
    background: "#f3e8ff",
    color: "#6d28d9",
    borderRadius: "999px",
    padding: "6px 9px",
    fontSize: "10px",
    fontWeight: "900",
  },

  toolbar: {
    display: "flex",
    gap: "8px",
    padding: "10px 12px",
    background: "#faf5ff",
    borderBottom: "1px solid #ede9fe",
  },

  toolButton: {
    border: "1px solid #ddd6fe",
    background: "white",
    color: "#6d28d9",
    padding: "8px 10px",
    borderRadius: "11px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  list: {
    maxHeight: "58vh",
    overflowY: "auto",
    padding: "10px",
  },

  item: {
    position: "relative",
    padding: "13px 36px 13px 13px",
    border: "1px solid #ede9fe",
    borderRadius: "15px",
    marginBottom: "8px",
    cursor: "pointer",
    background: "white",
  },

  itemUnread: {
    background:
      "linear-gradient(135deg,#faf5ff,#ffffff)",
    borderColor: "#c4b5fd",
  },

  itemTop: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "space-between",
  },

  itemTitle: {
    color: "#312e81",
    fontSize: "12px",
  },

  priority: {
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "999px",
    padding: "4px 7px",
    fontSize: "8px",
    fontWeight: "900",
  },

  message: {
    color: "#4b5563",
    fontSize: "11px",
    lineHeight: 1.45,
    margin: "7px 0",
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    color: "#9ca3af",
    fontSize: "9px",
  },

  delete: {
    position: "absolute",
    right: "9px",
    top: "9px",
    width: "23px",
    height: "23px",
    borderRadius: "8px",
    border: "none",
    background: "#f3f4f6",
    color: "#6b7280",
    cursor: "pointer",
  },

  empty: {
    padding: "34px 20px",
    textAlign: "center",
    color: "#6b7280",
    display: "grid",
    gap: "7px",
  },

  emptyIcon: {
    fontSize: "28px",
  },
};

export default NotificationCenter;
