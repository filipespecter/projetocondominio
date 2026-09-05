import { ApiError } from "../../utils/ApiError.js";

class EmailProvider {
  get providerName() { return String(process.env.EMAIL_PROVIDER ?? "").trim().toUpperCase(); }

  async send({ recipient, subject, content }) {
    const email = String(recipient ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) throw new ApiError("E-mail de destino inválido.", 400);

    if (this.providerName === "CONSOLE" && process.env.NODE_ENV !== "production") {
      console.log(`[EMAIL DEV] Para: ${email} | ${subject ?? "InfinityCondo"} | ${content}`);
      return { provider: "CONSOLE", providerMessageId: `dev-${Date.now()}` };
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
        body: JSON.stringify({ from, to: [email], subject: subject ?? "InfinityCondo", text: String(content ?? "") }),
      });
    } catch (error) {
      throw new ApiError(`Falha de conexão com o serviço de e-mail: ${error.message}`, 502);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(data?.message ?? "O serviço de e-mail recusou o envio.", 502);
    return { provider: "RESEND", providerMessageId: data?.id ?? null };
  }
}

export default new EmailProvider();
