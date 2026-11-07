const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
export function packageEmail({condominiumName, recipientName, apartmentLabel, packageRecord, instructions}) {
  const date = new Date(packageRecord.receivedAt);
  const received = Number.isNaN(date.getTime()) ? "Não informado" : date.toLocaleString("pt-BR", {timeZone:"America/Recife"});
  const rows = [["Unidade",apartmentLabel],["Tipo",packageRecord.type],["Descrição",packageRecord.description],["Remetente / transportadora",packageRecord.carrier],["Recebimento",received]].filter(([,value]) => value);
  const title = "Encomenda recebida na portaria";
  return {
    subject:`${title} — ${String(apartmentLabel).replace(/[\r\n]/g," ")}`,
    content:[condominiumName,`Olá, ${recipientName || "morador(a)"}.`,title,...rows.map(([label,value]) => `${label}: ${value}`),instructions,"Mensagem automática do InfinityCondo. Em caso de dúvida, procure a administração do condomínio."].join("\n\n"),
    html:`<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;background:#f6f5f9;color:#20202a;font-family:Arial,sans-serif"><main style="max-width:600px;margin:auto;background:#fff;border:1px solid #e6e2ee;border-radius:12px;padding:24px"><p>${escapeHtml(condominiumName)}</p><h1 style="font-size:24px;color:#6629a3">${title}</h1><p>Olá, ${escapeHtml(recipientName || "morador(a)")}.</p>${rows.map(([label,value])=>`<p style="overflow-wrap:anywhere"><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("")}<div style="padding:16px;background:#f2eafb;border-radius:8px;font-size:18px;overflow-wrap:anywhere">${escapeHtml(instructions)}</div><p style="font-size:13px;color:#555">Mensagem automática do InfinityCondo. Em caso de dúvida, procure a administração do condomínio.</p></main></body></html>`,
  };
}
