export function packageNotificationWarning(record) {
 const results=record?.notifications?.whatsapp?.results;
 if(!Array.isArray(results)) return "";
 if(!results.length) return "Encomenda salva. Nenhum morador ativo elegível para o aviso.";
 if(results.some(item=>item.failed||item.queued===false)) return "Encomenda salva. Um ou mais avisos não foram enviados; confira telefone/e-mail, autorização e o histórico de comunicação.";
 return "";
}
