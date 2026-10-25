import { useEffect, useState } from "react";
const rules = [[/senha|password/i, "Use uma senha exclusiva e respeite os requisitos exibidos. Nunca informe senhas em chamados de suporte."], [/email|e-mail/i, "Informe um e-mail válido da pessoa que receberá as comunicações. Confira o endereço antes de salvar."], [/whats|celular|phone|telefone/i, "Inclua DDD e confira o destinatário. Receber WhatsApp exige consentimento; o envio usa a conexão empresarial autorizada do condomínio."], [/cpf|cnpj|document/i, "Informe o documento correspondente ao titular. Use apenas dados necessários e autorizados."], [/bloco|andar|apartamento|unidade/i, "Identifique a unidade corretamente. Bloco, andar e número do apartamento não aceitam caracteres especiais."], [/data|date|horário|time/i, "Confira data, horário e fuso do condomínio. Reservas e acessos devem respeitar a janela válida do serviço."], [/motivo|reason|recusa|rejei/i, "Descreva um motivo objetivo. O motivo de rejeição é obrigatório e fica no histórico da decisão."], [/plano|plan|comercial/i, "Plano e situação comercial são controlados pela Central Star. O condomínio apenas consulta esses dados."], [/arquivo|file|anexo/i, "Envie somente formatos e tamanhos permitidos. Evite anexar informações pessoais sem necessidade."], [/código|code|qr/i, "Confira a credencial do registro correto. Código de retirada é pessoal e não deve ser compartilhado em suporte."], [/valor|cost|price|cents/i, "Confira a moeda e a unidade informada no campo. Valores em centavos devem ser inteiros."], [/categoria|tipo|status|situação/i, "Selecione a classificação que representa o registro real. Uma mudança pode alterar relatórios e permissões."], [/presen|voto|pauta|evidência/i, "Lance somente informações comprovadas por lista de presença ou ata. Este lançamento não é votação eletrônica."], [/descri|observa|nota|title|título|nome/i, "Descreva de forma objetiva, sem senhas, tokens ou dados pessoais desnecessários."]];
export function helpForField(label, type) {
  const match = rules.find(([regex]) => regex.test(label));
  return match?.[1] || (type === "date" ? "Confira a data e o período permitido." : type === "number" ? "Informe um número dentro dos limites exibidos." : "Confira os dados antes de salvar. Campos obrigatórios precisam ser preenchidos; erros aparecem junto à operação.");
}
export default function ContextualFormHelp() {
  const [field, setField] = useState(null);
  useEffect(() => {
    const focus = e => {
      const input = e.target;
      if (!input.matches?.("input,select,textarea") || input.closest(".ic-contextual-guide") || ["hidden", "submit", "button"].includes(input.type)) return;
      const copy = input.labels?.[0]?.cloneNode(true);
      copy?.querySelectorAll("input,select,textarea,button,small").forEach(n => n.remove());
      const label = copy?.textContent?.trim() || input.getAttribute("aria-label") || input.placeholder || input.name || "Campo selecionado";
      setField({
        label,
        text: helpForField(label, input.type),
        required: input.required,
        min: input.min,
        max: input.max,
        maxLength: input.maxLength
      });
    };
    document.addEventListener("focusin", focus);
    return () => document.removeEventListener("focusin", focus);
  }, []);
  return <div className="ic-contextual-guide"><details open={!!field}><summary>ⓘ Ajuda do campo {field?.label || "— selecione um campo"}</summary>{field && <><p>{field.text}</p><small>{field.required ? "Obrigatório. " : ""}{field.min ? `Mínimo: ${field.min}. ` : ""}{field.max ? `Máximo: ${field.max}. ` : ""}{field.maxLength > 0 ? `Até ${field.maxLength} caracteres.` : ""}</small></>}</details></div>;
}
