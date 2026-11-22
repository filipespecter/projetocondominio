import { useEffect } from "react";
import { notify } from "../components/GlobalDialogs.jsx";

// Substitui o balão nativo de validação do navegador ("Preencha este campo")
// pelo aviso padrão do sistema (toast do GlobalDialogs) e destaca o campo.
// Não muda regras: os mesmos campos continuam obrigatórios e o envio continua bloqueado.

function rotuloDoCampo(el) {
  const candidatos = [
    el.labels?.[0],
    el.closest("label"),
    el.closest(".icm-field, .ic-structure-field, [data-field]")?.querySelector("label, span"),
    el.previousElementSibling?.tagName === "LABEL" ? el.previousElementSibling : null,
    el.parentElement?.querySelector(":scope > label"),
  ].filter(Boolean);
  for (const no of candidatos) {
    const copia = no.cloneNode(true);
    copia.querySelectorAll("input, select, textarea, option, button, small").forEach((x) => x.remove());
    const texto = copia.textContent.replace(/\s+/g, " ").replace(/[*:]\s*$/, "").trim();
    if (texto) return texto;
  }
  return (el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || "").trim();
}

export function mensagemDeValidacao(el) {
  const v = el.validity;
  const rotulo = rotuloDoCampo(el);
  const nome = rotulo ? `"${rotulo}"` : "este campo";
  if (v.valueMissing) {
    if (el.tagName === "SELECT") return rotulo ? `Selecione uma opção em ${nome}.` : "Selecione uma opção.";
    if (el.type === "checkbox") return `Marque ${nome} para continuar.`;
    if (el.type === "file") return rotulo ? `Anexe o arquivo em ${nome}.` : "Anexe o arquivo.";
    return rotulo ? `Preencha o campo ${nome}.` : "Preencha o campo obrigatório.";
  }
  if (v.typeMismatch && el.type === "email") return `Informe um e-mail válido em ${nome}.`;
  if (v.typeMismatch && el.type === "url") return `Informe um link válido em ${nome}.`;
  if (v.tooShort) return `${rotulo || "O campo"} deve ter pelo menos ${el.minLength} caracteres.`;
  if (v.tooLong) return `${rotulo || "O campo"} deve ter no máximo ${el.maxLength} caracteres.`;
  if (v.rangeUnderflow) return `${rotulo || "O valor"} deve ser no mínimo ${el.min}.`;
  if (v.rangeOverflow) return `${rotulo || "O valor"} deve ser no máximo ${el.max}.`;
  if (v.patternMismatch) return el.title || `${rotulo || "O campo"} está em formato inválido.`;
  if (v.badInput || v.stepMismatch || v.typeMismatch) return `${rotulo || "O campo"} tem um valor inválido.`;
  return el.validationMessage || "Revise os campos destacados.";
}

function destacar(el) {
  if (el.dataset.icInvalido) return;
  el.dataset.icInvalido = "1";
  const anterior = { borderColor: el.style.borderColor, boxShadow: el.style.boxShadow };
  el.setAttribute("aria-invalid", "true");
  el.style.borderColor = "#dc2626";
  el.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.15)";
  const limpar = () => {
    el.style.borderColor = anterior.borderColor;
    el.style.boxShadow = anterior.boxShadow;
    el.removeAttribute("aria-invalid");
    delete el.dataset.icInvalido;
    el.removeEventListener("input", limpar);
    el.removeEventListener("change", limpar);
  };
  el.addEventListener("input", limpar);
  el.addEventListener("change", limpar);
}

export function useValidacaoEstilizada() {
  useEffect(() => {
    let tratandoEnvio = false;
    const aoInvalidar = (event) => {
      const el = event.target;
      if (!(el instanceof HTMLElement) || !el.validity) return;
      event.preventDefault(); // sem balão nativo do navegador
      destacar(el);
      if (tratandoEnvio) return; // só o primeiro campo inválido gera aviso
      tratandoEnvio = true;
      window.setTimeout(() => { tratandoEnvio = false; }, 0);
      notify(mensagemDeValidacao(el), "error");
      el.scrollIntoView?.({ block: "center", behavior: "smooth" });
      el.focus?.({ preventScroll: true });
    };
    document.addEventListener("invalid", aoInvalidar, true);
    return () => document.removeEventListener("invalid", aoInvalidar, true);
  }, []);
}
