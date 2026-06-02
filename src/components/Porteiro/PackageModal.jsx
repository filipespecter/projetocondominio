import { useEffect, useState } from "react";

import {
  salvarMovimentacao
} from "../../Services/movimentacaoService";

function PackageModal({
  apartamento,
  onClose
}) {

  const [descricao, setDescricao] =
    useState("");

  const [tipo, setTipo] =
    useState("");

  const [transportadora, setTransportadora] =
    useState("");

  const [rastreio, setRastreio] =
    useState("");

  const [retiradoPor, setRetiradoPor] =
    useState("");

  const [encomendas, setEncomendas] =
    useState([]);

  const [morador, setMorador] =
    useState(null);

  const [porteiro, setPorteiro] =
    useState(null);

  const [abaAtiva, setAbaAtiva] =
    useState("pendentes");

  useEffect(() => {

    carregarSessao();

    carregarMorador();

    carregarEncomendas();

  }, []);

  function carregarSessao() {

    const sessao =
      localStorage.getItem("sessaoPorteiro") ||
      sessionStorage.getItem("sessaoPorteiro");

    try {

      const usuario =
        sessao
          ? JSON.parse(sessao)
          : null;

      setPorteiro(usuario);

    } catch {

      setPorteiro(null);

    }

  }

  function carregarMorador() {

    const moradores =
      JSON.parse(
        localStorage.getItem("moradores")
      ) || [];

    const encontrado =
      moradores.find(
        (m) =>
          String(m.apartamento) === String(apartamento) ||
          String(m.apto) === String(apartamento)
      );

    setMorador(encontrado || null);

  }

  function carregarEncomendas() {

    const data =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const filtradas = data.filter(
      (e) =>
        String(e.apartamento) === String(apartamento)
    );

    filtradas.sort(
      (a, b) => b.id - a.id
    );

    setEncomendas(filtradas);

  }

  function limparFormulario() {

    setDescricao("");

    setTipo("");

    setTransportadora("");

    setRastreio("");

  }

  function registrarEncomenda() {

    if (!descricao || !tipo) {

      alert(
        "Preencha o tipo e a descrição da encomenda"
      );

      return;

    }

    const todas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const agora = new Date();

    const codigo =
      `${apartamento}-${Date.now()
        .toString()
        .slice(-5)}`;

    const nova = {

      id: Date.now(),

      codigo,

      apartamento,

      moradorId:
        morador?.id || null,

      morador:
        morador?.nome || "",

      nome:
        morador?.nome || "Morador",

      tipo,

      descricao,

      transportadora:
        transportadora || "Não informada",

      rastreio:
        rastreio || "Não informado",

      status: "pendente",

      data:
        agora.toLocaleString(),

      dataRecebimento:
        agora.toLocaleDateString(),

      horaRecebimento:
        agora.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),

      porteiroRecebimento:
        porteiro?.nome || "Porteiro",

      porteiroUsuario:
        porteiro?.usuario || ""

    };

    const atualizadas = [
      ...todas,
      nova
    ];

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    salvarMovimentacao({

      id: Date.now(),

      tipo: "encomenda_recebida",

      apartamento,

      mensagem:
        `Nova encomenda registrada no AP ${apartamento}`,

      porteiro:
        porteiro?.nome || "Porteiro",

      data:
        agora.toLocaleString()

    });

    limparFormulario();

    carregarEncomendas();

    setAbaAtiva("pendentes");

  }

  function retirarEncomenda(id) {

    if (!retiradoPor.trim()) {

      alert(
        "Informe quem retirou a encomenda"
      );

      return;

    }

    const todas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const agora = new Date();

    const atualizadas = todas.map((e) =>

      e.id === id

        ? {

            ...e,

            status: "retirada",

            retiradoPor:
              retiradoPor.trim(),

            retiradaEm:
              agora.toLocaleString(),

            dataRetirada:
              agora.toLocaleDateString(),

            horaRetirada:
              agora.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              }),

            porteiroRetirada:
              porteiro?.nome || "Porteiro",

            porteiroRetiradaUsuario:
              porteiro?.usuario || ""

          }

        : e

    );

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    salvarMovimentacao({

      id: Date.now(),

      tipo: "encomenda_retirada",

      apartamento,

      mensagem:
        `Encomenda retirada no AP ${apartamento} por ${retiradoPor.trim()}`,

      porteiro:
        porteiro?.nome || "Porteiro",

      data:
        agora.toLocaleString()

    });

    setRetiradoPor("");

    carregarEncomendas();

  }

  function excluirEncomenda(id) {

    const confirmar =
      window.confirm(
        "Deseja excluir esta encomenda?"
      );

    if (!confirmar) return;

    const todas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const atualizadas =
      todas.filter(
        (e) => e.id !== id
      );

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    carregarEncomendas();

  }

  const pendentes =
    encomendas.filter(
      (item) => item.status === "pendente"
    );

  const retiradas =
    encomendas.filter(
      (item) => item.status === "retirada"
    );

  const listaExibida =
    abaAtiva === "pendentes"
      ? pendentes
      : retiradas;

  return (

    <div style={styles.overlay}>

      <div style={styles.modal}>

        {/* HEADER */}

        <div style={styles.hero}>

          <div>

            <span style={styles.heroBadge}>
              📦 Gestão logística
            </span>

            <h2 style={styles.title}>
              Apartamento {apartamento}
            </h2>

            <p style={styles.subtitle}>
              Registro, retirada e histórico de encomendas
              vinculadas ao apartamento.
            </p>

            <div style={styles.ownerBox}>

              <span style={styles.ownerIcon}>
                👤
              </span>

              <div>

                <p style={styles.ownerLabel}>
                  Morador vinculado
                </p>

                <strong style={styles.ownerName}>
                  {morador?.nome ||
                    "Nenhum morador vinculado"}
                </strong>

              </div>

            </div>

          </div>

          <div style={styles.heroStats}>

            <div style={styles.statBoxLight}>

              <p style={styles.statLabelLight}>
                Pendentes
              </p>

              <h3 style={styles.statNumberLight}>
                {pendentes.length}
              </h3>

            </div>

            <div style={styles.statBoxGlass}>

              <p style={styles.statLabelLight}>
                Retiradas
              </p>

              <h3 style={styles.statNumberLight}>
                {retiradas.length}
              </h3>

            </div>

          </div>

        </div>

        {/* FORM */}

        <div style={styles.formCard}>

          <div style={styles.sectionHeader}>

            <div>

              <h3 style={styles.sectionTitle}>
                Registrar nova encomenda
              </h3>

              <p style={styles.sectionSubtitle}>
                Ao registrar, a encomenda fica pendente
                aguardando retirada.
              </p>

            </div>

            <span style={styles.sectionBadge}>
              Recebimento
            </span>

          </div>

          <div style={styles.formGrid}>

            <select
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value)
              }
              style={styles.input}
            >

              <option value="">
                Tipo da encomenda
              </option>

              <option value="Pacote pequeno">
                Pacote pequeno
              </option>

              <option value="Pacote médio">
                Pacote médio
              </option>

              <option value="Pacote grande">
                Pacote grande
              </option>

              <option value="Documento">
                Documento
              </option>

              <option value="Caixa">
                Caixa
              </option>

              <option value="Outro">
                Outro
              </option>

            </select>

            <input
              placeholder="Transportadora"
              value={transportadora}
              onChange={(e) =>
                setTransportadora(e.target.value)
              }
              style={styles.input}
            />

          </div>

          <input
            placeholder="Código de rastreio"
            value={rastreio}
            onChange={(e) =>
              setRastreio(e.target.value)
            }
            style={styles.input}
          />

          <textarea
            placeholder="Descrição / observação da encomenda"
            value={descricao}
            onChange={(e) =>
              setDescricao(e.target.value)
            }
            style={styles.textarea}
          />

          <button
            style={styles.primary}
            onClick={registrarEncomenda}
          >

            + Registrar encomenda

          </button>

        </div>

        {/* ABAS */}

        <div style={styles.tabs}>

          <button
            style={{
              ...styles.tab,
              ...(abaAtiva === "pendentes"
                ? styles.tabActive
                : {})
            }}
            onClick={() =>
              setAbaAtiva("pendentes")
            }
          >
            Pendentes
          </button>

          <button
            style={{
              ...styles.tab,
              ...(abaAtiva === "retiradas"
                ? styles.tabActive
                : {})
            }}
            onClick={() =>
              setAbaAtiva("retiradas")
            }
          >
            Histórico de retiradas
          </button>

        </div>

        {/* LISTA */}

        <div style={styles.list}>

          {listaExibida.length === 0 && (

            <div style={styles.empty}>

              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhuma encomenda encontrada
              </h3>

              <p style={styles.emptyText}>
                Os registros desta etapa aparecerão aqui.
              </p>

            </div>

          )}

          {listaExibida.map((item) => (

            <div
              key={item.id}
              style={styles.package}
            >

              <div style={styles.packageTop}>

                <div>

                  <span
                    style={{
                      ...styles.status,
                      ...(item.status === "pendente"
                        ? styles.statusPending
                        : styles.statusSuccess)
                    }}
                  >

                    {item.status === "pendente"
                      ? "Pendente"
                      : "Retirada"}

                  </span>

                  <h3 style={styles.packageTitle}>
                    📦 {item.tipo}
                  </h3>

                </div>

                <div style={styles.codeBox}>
                  {item.codigo}
                </div>

              </div>

              <p style={styles.description}>
                {item.descricao}
              </p>

              <div style={styles.infoGrid}>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    Transportadora
                  </span>

                  <strong>
                    {item.transportadora ||
                      "Não informada"}
                  </strong>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    Rastreio
                  </span>

                  <strong>
                    {item.rastreio ||
                      "Não informado"}
                  </strong>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    Recebida em
                  </span>

                  <strong>
                    {item.data}
                  </strong>
                </div>

                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>
                    Porteiro
                  </span>

                  <strong>
                    {item.porteiroRecebimento ||
                      "Não informado"}
                  </strong>
                </div>

              </div>

              {item.status === "pendente" && (

                <div style={styles.withdrawBox}>

                  <input
                    placeholder="Nome de quem retirou"
                    value={retiradoPor}
                    onChange={(e) =>
                      setRetiradoPor(e.target.value)
                    }
                    style={styles.withdrawInput}
                  />

                  <button
                    style={styles.success}
                    onClick={() =>
                      retirarEncomenda(item.id)
                    }
                  >

                    Confirmar retirada

                  </button>

                </div>

              )}

              {item.status === "retirada" && (

                <div style={styles.retirada}>

                  ✅ Retirada por{" "}

                  <strong>
                    {item.retiradoPor ||
                      "Não informado"}
                  </strong>

                  {" "}em{" "}

                  <strong>
                    {item.retiradaEm}
                  </strong>

                </div>

              )}

              <div style={styles.actions}>

                <button
                  style={styles.delete}
                  onClick={() =>
                    excluirEncomenda(item.id)
                  }
                >

                  Excluir registro

                </button>

              </div>

            </div>

          ))}

        </div>

        {/* FOOTER */}

        <button
          style={styles.close}
          onClick={onClose}
        >

          Fechar painel

        </button>

      </div>

    </div>

  );

}

const styles = {

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "rgba(15,23,42,0.62)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px",
    boxSizing: "border-box"
  },

  modal: {
    background: "#f8fafc",
    width: "920px",
    borderRadius: "32px",
    padding: "26px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow:
      "0 30px 80px rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.45)"
  },

  hero: {
    background:
      "linear-gradient(135deg,#052e16,#14532d,#166534)",
    borderRadius: "28px",
    padding: "28px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "22px"
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    display: "inline-block",
    marginBottom: "14px"
  },

  title: {
    margin: 0,
    fontSize: "31px",
    letterSpacing: "-0.4px"
  },

  subtitle: {
    margin: "8px 0 16px",
    color: "rgba(255,255,255,0.75)",
    lineHeight: "1.5",
    maxWidth: "540px"
  },

  ownerBox: {
    background: "rgba(255,255,255,0.11)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "18px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    maxWidth: "360px"
  },

  ownerIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  ownerLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.68)",
    fontSize: "12px"
  },

  ownerName: {
    display: "block",
    marginTop: "3px",
    color: "white",
    fontSize: "14px"
  },

  heroStats: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "170px"
  },

  statBoxLight: {
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "20px",
    padding: "16px",
    textAlign: "center"
  },

  statBoxGlass: {
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px",
    padding: "16px",
    textAlign: "center"
  },

  statLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.70)",
    fontSize: "12px"
  },

  statNumberLight: {
    margin: "6px 0 0",
    color: "white",
    fontSize: "30px"
  },

  formCard: {
    background: "white",
    borderRadius: "26px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "18px"
  },

  sectionTitle: {
    margin: 0,
    color: "#14532d",
    fontSize: "22px"
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px"
  },

  sectionBadge: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "9px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    height: "fit-content"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "14px",
    background: "#f9fafb"
  },

  textarea: {
    width: "100%",
    minHeight: "95px",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "14px",
    background: "#f9fafb",
    resize: "vertical",
    fontFamily: "Arial"
  },

  primary: {
    width: "100%",
    background:
      "linear-gradient(135deg,#14532d,#16a34a)",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
    boxShadow:
      "0 12px 25px rgba(22,163,74,0.20)"
  },

  tabs: {
    display: "flex",
    gap: "8px",
    background: "#e5e7eb",
    padding: "7px",
    borderRadius: "18px",
    marginBottom: "20px"
  },

  tab: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800",
    color: "#6b7280"
  },

  tabActive: {
    background: "white",
    color: "#14532d",
    boxShadow:
      "0 8px 20px rgba(15,23,42,0.08)"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  empty: {
    background: "white",
    borderRadius: "24px",
    padding: "42px",
    textAlign: "center",
    color: "#6b7280",
    border: "1px dashed #d1d5db"
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "10px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#6b7280"
  },

  package: {
    background: "white",
    borderRadius: "24px",
    padding: "22px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)",
    border: "1px solid #eef2f7"
  },

  packageTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "14px"
  },

  packageTitle: {
    margin: "9px 0 0",
    color: "#111827",
    fontSize: "21px"
  },

  codeBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: "10px 13px",
    borderRadius: "14px",
    color: "#374151",
    fontWeight: "800",
    height: "fit-content"
  },

  status: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  statusPending: {
    background: "#fef3c7",
    color: "#92400e"
  },

  statusSuccess: {
    background: "#dcfce7",
    color: "#166534"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 16px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "12px",
    marginBottom: "16px"
  },

  infoItem: {
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "16px",
    padding: "13px"
  },

  infoLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "5px"
  },

  withdrawBox: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "18px",
    padding: "14px",
    marginTop: "12px"
  },

  withdrawInput: {
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "white"
  },

  success: {
    background:
      "linear-gradient(135deg,#14532d,#16a34a)",
    color: "white",
    border: "none",
    padding: "13px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800"
  },

  retirada: {
    marginTop: "14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "14px"
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "14px"
  },

  delete: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800"
  },

  close: {
    width: "100%",
    marginTop: "22px",
    padding: "15px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px"
  }

};

export default PackageModal;