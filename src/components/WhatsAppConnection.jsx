import { useState } from "react";
import api from "../Services/api.js";
import { loadMetaSDK, authorizeMeta } from "../utils/whatsappSignup.js";

const unwrap = response => response.data?.data ?? response.data;
export default function WhatsAppConnection({ config = {}, onUpdated }) {
  const [prepared, setPrepared] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const hasConnection = Boolean(config.numeroEmpresa || config.phoneNumberId);
  const guided = Boolean(config.onboardingStatus && config.onboardingStatus !== "MANUAL");
  const status = !hasConnection ? "Nenhum número conectado" : ({
    MANUAL: config.verifiedAt ? "Credenciais verificadas" : "Conexão ainda não verificada",
    READY: "Número e modelo verificados",
    PENDING_TEMPLATE: "Número autorizado; verificação do modelo pendente",
  })[config.onboardingStatus] || "Conexão ainda não verificada";

  async function refresh() {
    try { await onUpdated?.(); }
    catch { setMessage(current => `${current} Atualize a página para conferir o estado salvo.`); }
  }
  async function prepare() {
    setBusy(true);
    setPrepared(null);
    setMessage("");
    try {
      const data = unwrap(await api.post("/v1/configuration/whatsapp/connect/start", {}));
      await loadMetaSDK(data);
      setPrepared(data);
      setMessage("Clique em Autorizar na Meta. O responsável pelo número deve entrar com a própria conta.");
    } catch (error) {
      setMessage(error.message || "Não foi possível preparar a conexão.");
    } finally { setBusy(false); }
  }
  function authorize() {
    if (!prepared || busy) return;
    setBusy(true);
    setMessage("Conclua a autorização na janela da Meta. Mantenha o WhatsApp Business no celular.");
    // Preserva a abertura síncrona do popup no clique; não inserir await antes.
    authorizeMeta(prepared)
      .then(data => {
        setMessage("Autorização recebida. Concluindo a conexão do condomínio…");
        return api.post("/v1/configuration/whatsapp/connect/finish", data);
      })
      .then(async response => {
        setMessage(unwrap(response).message || "Autorização processada. Confira o estado da conexão.");
        await refresh();
      })
      .catch(error => setMessage(error.message || "Não foi possível concluir a conexão."))
      .finally(() => { setPrepared(null); setBusy(false); });
  }
  async function check() {
    setBusy(true);
    setMessage("");
    try {
      const path = guided ? "/v1/configuration/whatsapp/connect/check" : "/v1/configuration/whatsapp/test";
      const result = unwrap(await api.post(path, {}));
      setMessage(result.message);
      await refresh();
    } catch (error) {
      setMessage(error.message || "Não foi possível verificar a conexão.");
    } finally { setBusy(false); }
  }
  return <section style={{ border: "1px solid #ddd", borderRadius: 16, padding: 16, marginBottom: 20 }} aria-busy={busy}>
    <h3>WhatsApp do condomínio</h3>
    <p>{config.numeroEmpresa ? `Número: ${config.numeroEmpresa}` : "Nenhum número confirmado para exibição."}</p>
    <p>O responsável autoriza o número na Meta. Os porteiros enviam os avisos com seus próprios logins, sem acesso às credenciais. A ativação depende da verificação do número e do modelo de aviso.</p>
    <button disabled={busy} type="button" onClick={prepared ? authorize : prepare}>{busy ? "Aguarde…" : prepared ? "Autorizar na Meta" : "Conectar WhatsApp do condomínio"}</button>{" "}
    {hasConnection && <button disabled={busy} type="button" onClick={check}>Verificar aprovação da conexão</button>}
    <p>Estado: {status}. {config.ativo && config.channel === "WHATSAPP" ? "Canal WhatsApp ativado." : "Canal WhatsApp desativado."} A entrega real deve ser conferida no histórico dos avisos.</p>
    {message && <p role="status" aria-live="polite">{message}</p>}
  </section>;
}
