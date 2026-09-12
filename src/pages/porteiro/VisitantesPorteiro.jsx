import { useEffect, useState } from "react";
import authApi from "../../Services/authApi.js";
import visitorApi from "../../Services/visitorApi.js";
import QrCameraScanner from "../../components/Porteiro/QrCameraScanner.jsx";

function VisitantesPorteiro() {
  const estadoInicial = {
    nome: "",
    apartamento: "",
    observacao: "",
    tipoVisitante: "Pessoa comum",
    documento: ""
  };

  const [visitantes, setVisitantes] = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [form, setForm] = useState(estadoInicial);
  const [porteiro, setPorteiro] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [qrToken, setQrToken] = useState("");
  const [qrCameraAtiva, setQrCameraAtiva] = useState(false);
  const [qrValidando, setQrValidando] = useState(false);
  const [qrMensagem, setQrMensagem] = useState(null);
  const [qrResultado, setQrResultado] = useState(null);

  const statusFront = {
    WAITING: "Aguardando",
    AUTHORIZED: "Autorizado",
    INSIDE: "Em Visita",
    EXITED: "Saiu",
    DENIED: "Bloqueado",
    CANCELED: "Bloqueado",
  };

  function mapResident(r) {
    return {
      ...r,
      nome: r.user?.name ?? r.name ?? "",
      apartamento:
        r.apartment?.number ?? "",
      apartamentoId:
        r.apartmentId ??
        r.apartment?.id ??
        null,
      moradorPrincipal:
        Boolean(r.isPrimary),
    };
  }

  function mapVisitor(v, residentList = moradores) {
    const resident =
      residentList.find(
        (r) =>
          String(r.apartamentoId) ===
            String(v.apartmentId) &&
          r.moradorPrincipal
      ) ??
      residentList.find(
        (r) =>
          String(r.apartamentoId) ===
          String(v.apartmentId)
      );

    return {
      ...v,
      nome: v.name ?? "",
      documento: v.document ?? "",
      apartamento:
        v.apartment?.number ??
        resident?.apartamento ??
        "",
      apartamentoId:
        v.apartmentId ??
        v.apartment?.id ??
        null,
      morador:
        resident?.nome ?? "",
      tipoVisitante:
        v.visitType ??
        "Pessoa comum",
      observacao:
        v.notes ?? "",
      status:
        statusFront[v.status] ??
        v.status ??
        "Aguardando",
      data:
        v.createdAt
          ? new Date(v.createdAt).toLocaleString("pt-BR")
          : "",
    };
  }

  async function carregarDados() {
    try {
      const [
        user,
        visitorData,
        apartmentData,
        residentData,
      ] = await Promise.all([
        authApi.me(),
        visitorApi.list(),
        visitorApi.apartmentsDirectory(),
        visitorApi.residentsDirectory(),
      ]);

      const mappedResidents =
        (residentData ?? []).map(mapResident);

      setPorteiro({
        ...user,
        nome:
          user?.name ??
          "Porteiro",
      });

      setMoradores(
        mappedResidents
      );

      setApartamentos(
        (apartmentData ?? []).map(
          (ap) => ({
            id: ap.id,
            numero: ap.number ?? "",
            bloco: ap.block ?? "",
          })
        )
      );

      setVisitantes(
        (visitorData ?? []).map((v) =>
          mapVisitor(
            v,
            mappedResidents
          )
        )
      );
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível carregar a portaria."
      );
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function validarConviteQr(tokenRecebido = qrToken) {
    const token = String(tokenRecebido ?? "").trim();

    if (!token) {
      setQrMensagem({
        tipo: "erro",
        texto: "Leia o QR pela câmera ou informe a credencial do convite.",
      });
      return;
    }

    setQrValidando(true);
    setQrMensagem(null);
    setQrResultado(null);

    try {
      const result = await visitorApi.validateInvitation(token);
      setQrResultado(result);
      setQrMensagem({
        tipo: "sucesso",
        texto: "QR válido. A entrada do visitante foi registrada e o convite não poderá ser reutilizado.",
      });
      setQrToken("");
      setQrCameraAtiva(false);
      await carregarDados();
    } catch (error) {
      setQrMensagem({
        tipo: "erro",
        texto:
          error?.details?.[0]?.message ??
          error?.message ??
          "Não foi possível validar o QR do visitante.",
      });
    } finally {
      setQrValidando(false);
    }
  }

  function limparFormulario() {
    setForm(estadoInicial);
  }

  function buscarApartamento(apartamento) {
    return (
      apartamentos.find(
        (ap) =>
          String(ap.numero) ===
          String(apartamento)
      ) ?? {}
    );
  }

  async function cadastrarVisitante() {
    if (
      form.nome.trim().length < 2 ||
      !form.apartamento
    ) {
      alert(
        "Informe nome e apartamento."
      );
      return;
    }

    const apartment =
      buscarApartamento(
        form.apartamento
      );

    if (!apartment?.id) {
      alert(
        "Apartamento não encontrado."
      );
      return;
    }

    try {
      await visitorApi.create({
        apartmentId:
          apartment.id,
        name:
          form.nome.trim(),
        document:
          form.documento?.trim() ||
          null,
        phone: null,
        visitType:
          form.tipoVisitante?.trim() ||
          null,
        vehicle: null,
        plate: null,
        notes:
          form.observacao?.trim() ||
          null,
        expectedAt: null,
      });

      limparFormulario();
      await carregarDados();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível cadastrar o visitante."
      );
    }
  }

  async function alterarStatus(
    id,
    novoStatus
  ) {
    try {
      if (
        novoStatus === "Autorizado"
      ) {
        await visitorApi.authorize(id);
      } else if (
        novoStatus === "Em Visita"
      ) {
        await visitorApi.registerEntry(id);
      } else if (
        novoStatus === "Saiu"
      ) {
        await visitorApi.registerExit(id);
      } else if (
        novoStatus === "Bloqueado"
      ) {
        await visitorApi.deny(id);
      }

      await carregarDados();
    } catch (error) {
      alert(
        error?.message ??
        "Não foi possível alterar o status."
      );
    }
  }

  function excluirVisitante() {
    alert(
      "A exclusão de visitante é restrita ao síndico/administrador."
    );
  }

  function obterStatus(status) {
    if (status === "Aguardando") {
      return {
        texto: "Aguardando",
        fundo: "#fef3c7",
        cor: "#92400e"
      };
    }

    if (status === "Autorizado") {
      return {
        texto: "Autorizado",
        fundo: "#dcfce7",
        cor: "#166534"
      };
    }

    if (status === "Em Visita") {
      return {
        texto: "Em Visita",
        fundo: "#dbeafe",
        cor: "#1d4ed8"
      };
    }

    if (status === "Saiu") {
      return {
        texto: "Saiu",
        fundo: "#f3f4f6",
        cor: "#4b5563"
      };
    }

    if (status === "Bloqueado") {
      return {
        texto: "Bloqueado",
        fundo: "#fee2e2",
        cor: "#b91c1c"
      };
    }

    return {
      texto: status,
      fundo: "var(--ic-primary-soft-4)",
      cor: "#111827"
    };
  }

  const visitantesFiltrados =
    visitantes.filter((item) => {
      const texto =
        busca.toLowerCase();

      const correspondeBusca =
        item.nome?.toLowerCase().includes(texto) ||
        item.apartamento?.toLowerCase().includes(texto) ||
        item.tipoVisitante?.toLowerCase().includes(texto) ||
        item.documento?.toLowerCase().includes(texto);

      return (
        correspondeBusca &&
        (
          filtroStatus === "Todos" ||
          item.status === filtroStatus
        )
      );
    });

  const aguardando =
    visitantes.filter(
      (v) => v.status === "Aguardando"
    ).length;

  const liberados =
    visitantes.filter(
      (v) => v.status === "Autorizado"
    ).length;

  const dentro =
    visitantes.filter(
      (v) => v.status === "Em Visita"
    ).length;

  const saiu =
    visitantes.filter(
      (v) => v.status === "Saiu"
    ).length;

    return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            🚶 Controle de acesso
          </span>

          <h1 style={styles.title}>
            Visitantes da Portaria
          </h1>

          <p style={styles.subtitle}>
            Registre visitantes, libere entradas, acompanhe saídas
            e mantenha o plantão organizado em tempo real.
          </p>

          {porteiro && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Porteiro responsável:{" "}
                <strong>
                  {porteiro.nome}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Dentro agora
          </p>

          <h3 style={styles.heroNumber}>
            {dentro}
          </h3>

          <span style={styles.heroStatus}>
            Visitantes ativos
          </span>
        </div>
      </div>

      <div style={styles.cards}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Aguardando
            </p>

            <h2 style={styles.cardNumberLight}>
              {aguardando}
            </h2>

            <span style={styles.cardHintLight}>
              aguardando autorização
            </span>
          </div>

          <div style={styles.cardIconLight}>
            ⏳
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBlue}>
            🔓
          </div>

          <div>
            <p style={styles.cardLabel}>
              Autorizados
            </p>

            <h2 style={styles.cardNumberBlue}>
              {liberados}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconGreen}>
            🚶
          </div>

          <div>
            <p style={styles.cardLabel}>
              Dentro
            </p>

            <h2 style={styles.cardNumberGreen}>
              {dentro}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconDark}>
            ✅
          </div>

          <div>
            <p style={styles.cardLabel}>
              Saíram
            </p>

            <h2 style={styles.cardNumberDark}>
              {saiu}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.formCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Validar convite por QR
            </h2>

            <p style={styles.sectionSubtitle}>
              Leia o QR enviado pelo morador. A validação ocorre no backend e o convite é consumido uma única vez.
            </p>
          </div>

          <span style={styles.sectionBadge}>
            Acesso antecipado
          </span>
        </div>

        <div style={styles.formGrid}>
          <input
            placeholder="Credencial do QR"
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            style={styles.input}
            autoComplete="off"
          />

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              style={styles.button}
              disabled={qrValidando}
              onClick={() => validarConviteQr()}
            >
              {qrValidando ? "Validando..." : "Validar QR"}
            </button>

            <button
              type="button"
              style={styles.gray}
              onClick={() => {
                setQrMensagem(null);
                setQrCameraAtiva((value) => !value);
              }}
            >
              {qrCameraAtiva ? "Fechar câmera" : "Ler pela câmera"}
            </button>
          </div>
        </div>

        {qrCameraAtiva && (
          <div style={{ marginTop: "16px" }}>
            <QrCameraScanner
              active={qrCameraAtiva}
              onDetected={(value) => {
                setQrToken(value);
                validarConviteQr(value);
              }}
            />
          </div>
        )}

        {qrMensagem && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: qrMensagem.tipo === "sucesso" ? "#dcfce7" : "#fee2e2",
              color: qrMensagem.tipo === "sucesso" ? "#166534" : "#991b1b",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            {qrMensagem.texto}
          </div>
        )}

        {qrResultado && (
          <div style={{ ...styles.infoGrid, marginTop: "14px" }}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Visitante</span>
              <strong>{qrResultado.name}</strong>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Apartamento</span>
              <strong>{qrResultado.apartment?.number ?? "-"}</strong>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Morador responsável</span>
              <strong>{qrResultado.responsibleResident?.name ?? "-"}</strong>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Status</span>
              <strong>Entrada registrada</strong>
            </div>
          </div>
        )}
      </div>

      <div style={styles.formCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Novo visitante
            </h2>

            <p style={styles.sectionSubtitle}>
              Preencha os dados para registrar uma nova entrada.
            </p>
          </div>

          <span style={styles.sectionBadge}>
            Registro rápido
          </span>
        </div>

        <div style={styles.formGrid}>
          <input
            placeholder="Nome do visitante"
            value={form.nome}
            onChange={(e) =>
              setForm({
                ...form,
                nome: e.target.value
              })
            }
            style={styles.input}
          />

          <select
            value={form.apartamento}
            onChange={(e) =>
              setForm({
                ...form,
                apartamento: e.target.value
              })
            }
            style={styles.input}
          >
            <option value="">
              Selecione o apartamento
            </option>

            {apartamentos.map((ap) => (
              <option key={ap.id} value={ap.numero}>
                {ap.bloco ? `Bloco ${ap.bloco} · ` : ""}Apartamento {ap.numero}
              </option>
            ))}
          </select>

          <select
            value={form.tipoVisitante}
            onChange={(e) =>
              setForm({
                ...form,
                tipoVisitante: e.target.value
              })
            }
            style={styles.input}
          >
            <option>Pessoa comum</option>
            <option>Prestador de serviço</option>
          </select>

          <input
            placeholder={
              form.tipoVisitante === "Prestador de serviço"
                ? "Documento obrigatório"
                : "Documento opcional"
            }
            value={form.documento}
            onChange={(e) =>
              setForm({
                ...form,
                documento: e.target.value
              })
            }
            style={styles.input}
          />
        </div>

        <textarea
          placeholder="Observação sobre a visita"
          value={form.observacao}
          onChange={(e) =>
            setForm({
              ...form,
              observacao: e.target.value
            })
          }
          style={styles.textarea}
        />

        <button
          style={styles.button}
          onClick={cadastrarVisitante}
        >
          Cadastrar visitante
        </button>
      </div>

      <div style={styles.listCard}>
        <div style={styles.listHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Registros de visitantes
            </h2>

            <p style={styles.sectionSubtitle}>
              Controle operacional de entradas e saídas.
            </p>
          </div>

          <div style={styles.filters}>
            <input
              placeholder="Buscar visitante..."
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              style={styles.search}
            />

            <select
              value={filtroStatus}
              onChange={(e) =>
                setFiltroStatus(e.target.value)
              }
              style={styles.filter}
            >
              <option>Todos</option>
              <option value="Aguardando">Aguardando</option>
              <option value="Autorizado">Autorizado</option>
              <option value="Em Visita">Em Visita</option>
              <option value="Saiu">Saiu</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>

        {visitantesFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📭
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhum visitante encontrado
            </h3>

            <p style={styles.emptyText}>
              Os registros aparecerão aqui conforme forem cadastrados.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {visitantesFiltrados.map((item) => {
              const status = obterStatus(item.status);

              return (
                <div
                  key={item.id}
                  style={styles.visitorCard}
                >
                  <div style={styles.cardTop}>
                    <div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background: status.fundo,
                          color: status.cor
                        }}
                      >
                        {status.texto}
                      </span>

                      <h3 style={styles.nome}>
                        {item.nome}
                      </h3>
                    </div>

                    <div style={styles.visitorIcon}>
                      🚶
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Apartamento
                      </span>

                      <strong>
                        {item.apartamento}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Morador
                      </span>

                      <strong>
                        {item.morador || "-"}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Tipo
                      </span>

                      <strong>
                        {item.tipoVisitante}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Entrada
                      </span>

                      <strong>
                        {item.horarioEntrada}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        Saída
                      </span>

                      <strong>
                        {item.horarioSaida || "-"}
                      </strong>
                    </div>
                  </div>

                  {item.documento && (
                    <p style={styles.documento}>
                      Documento: {item.documento}
                    </p>
                  )}

                  {item.observacao && (
                    <p style={styles.obs}>
                      {item.observacao}
                    </p>
                  )}

                  <p style={styles.porteiroInfo}>
                    Registrado por{" "}
                    <strong>
                      {item.porteiro || "Porteiro"}
                    </strong>{" "}
                    • Turno {item.turno || "-"}
                  </p>

                  <div style={styles.actions}>
                    <button
                      style={styles.blue}
                      onClick={() =>
                        alterarStatus(item.id, "Autorizado")
                      }
                    >
                      Autorizar
                    </button>

                    <button
                      style={styles.green}
                      onClick={() =>
                        alterarStatus(item.id, "Em Visita")
                      }
                    >
                      Entrada
                    </button>

                    <button
                      style={styles.gray}
                      onClick={() =>
                        alterarStatus(item.id, "Saiu")
                      }
                    >
                      Saída
                    </button>

                    <button
                      style={styles.red}
                      onClick={() =>
                        excluirVisitante(item.id)
                      }
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
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

  cards: {
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

  cardIconDark: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "var(--ic-primary-soft-4)",
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

  cardNumberDark: {
    margin: "8px 0 0",
    color: "#374151",
    fontSize: "34px"
  },

  formCard: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid var(--ic-primary-soft-2)"
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
    color: "var(--ic-primary)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "14px"
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    boxSizing: "border-box"
  },

  textarea: {
    width: "100%",
    minHeight: "95px",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    boxSizing: "border-box",
    marginTop: "14px",
    resize: "vertical",
    fontFamily: "Arial"
  },

  button: {
    marginTop: "14px",
    width: "100%",
    background:
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow:
      "0 12px 25px rgb(var(--ic-primary-rgb) / 0.18)"
  },

  listCard: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid var(--ic-primary-soft-2)"
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "22px"
  },

  filters: {
    display: "flex",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    background: "#fbfaff",
    minWidth: "230px"
  },

  filter: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    background: "#fbfaff"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed var(--ic-primary-border)",
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

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(310px,1fr))",
    gap: "18px"
  },

  visitorCard: {
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "24px",
    padding: "22px",
    boxShadow:
      "0 10px 25px rgba(15,23,42,0.04)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "16px"
  },

  statusBadge: {
    display: "inline-block",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "10px"
  },

  nome: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  visitorIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "17px",
    background: "var(--ic-primary-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "14px"
  },

  infoItem: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.08),transparent 34%), white",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "16px",
    padding: "12px"
  },

  infoLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "5px"
  },

  documento: {
    background: "var(--ic-primary-soft-3)",
    border: "1px solid var(--ic-primary-border-soft)",
    color: "var(--ic-primary-strong)",
    padding: "12px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "700"
  },

  obs: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.08),transparent 34%), white",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "14px",
    padding: "12px",
    color: "#374151",
    fontStyle: "italic",
    lineHeight: "1.5"
  },

  porteiroInfo: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "14px"
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "10px",
    marginTop: "16px"
  },

  blue: {
    background: "var(--ic-primary)",
    color: "white",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  },

  green: {
    background: "var(--ic-primary-light)",
    color: "white",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  },

  gray: {
    background: "#6b7280",
    color: "white",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  },

  red: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  }
};

export default VisitantesPorteiro;