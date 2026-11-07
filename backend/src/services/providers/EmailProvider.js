import { ApiError } from "../../utils/ApiError.js";

class EmailProvider {
  get providerName() { return String(process.env.EMAIL_PROVIDER ?? "").trim().toUpperCase(); }

  async send({ recipient, subject, content, html }) {
    const email = String(recipient ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) throw new ApiError("E-mail de destino inválido.", 400);

    if (this.providerName === "CONSOLE" && process.env.NODE_ENV !== "production") {
      throw new ApiError("Envio real indisponível: provedor de homologação está em modo CONSOLE.",503);
    }

    if (this.providerName !== "RESEND") {
      throw new ApiError("Provider de e-mail ainda não configurado no servidor.", 503);
    }

    const apiKey = String(process.env.EMAIL_API_KEY ?? "").trim();
    const from = String(process.env.EMAIL_FROM ?? "").trim();
    if (!apiKey || !from) throw new ApiError("E-mail transacional ainda não está configurado no servidor.", 503);

    let response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [email], subject: subject ?? "InfinityCondo", text: String(content ?? ""), ...(html ? {html:String(html)} : {}) }),
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new ApiError("Falha de conexão com o serviço de e-mail. Confira o histórico antes de reenviar.", 502);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error=new ApiError("O serviço de e-mail recusou o envio. Confira a configuração do remetente e do provedor.", response.status >= 500 ? 502 : 422);
      throw error;
    }
    if (typeof data.id !== "string" || !data.id) throw new ApiError("O serviço de e-mail não confirmou o identificador do envio. Confira o provedor antes de reenviar.",502);
    return { provider: "RESEND", providerMessageId: data?.id ?? null };
  }
}

export default new EmailProvider();
