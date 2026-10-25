export function packageNotificationWarning(record) {
 if(record?.notifications?.whatsapp?.manualConfirmationRequired) return "Encomenda salva. Para enviar o aviso, confira os dados e confirme em Enviar aviso WhatsApp / e-mail.";
 const results=record?.notifications?.whatsapp?.results;
 if(!Array.isArray(results)) return "";
 if(!results.length) return "Encomenda salva. Nenhum morador ou contato autorizado elegível para o aviso.";
 if(results.some(item=>item.failed||item.queued===false)) return "Encomenda salva. Um ou mais avisos não foram enviados; confira telefone/e-mail, autorização e o histórico de comunicação.";
 return "";
}
