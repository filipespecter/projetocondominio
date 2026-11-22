/* =====================================================
   MÁSCARAS DE CAMPOS (frontend)

   Só formatam o que aparece no campo. Cada tela continua
   decidindo o que guarda/envia (ex.: telefones que já eram
   enviados só com dígitos continuam assim).

   As máscaras não adicionam separador no fim do texto, para
   o Backspace funcionar normalmente enquanto se digita.
===================================================== */

export function soDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

// (85) 3333-4444 | (85) 99999-8888 | +55 (85) 99999-8888 | +351912345678
export function mascaraTelefone(valor) {
  let d = soDigitos(valor).slice(0, 15);
  let prefixo = "";
  if (d.length > 11) {
    if (!d.startsWith("55") || d.length > 13) return `+${d}`; // outro país: só os dígitos
    prefixo = "+55 ";
    d = d.slice(2);
  }
  if (!d) return prefixo.trim();
  if (d.length <= 2) return `${prefixo}(${d}`;
  const ddd = d.slice(0, 2);
  if (d.length <= 6) return `${prefixo}(${ddd}) ${d.slice(2)}`;
  if (d.length <= 10) return `${prefixo}(${ddd}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `${prefixo}(${ddd}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// 123.456.789-09
export function mascaraCPF(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// 12.345.678/0001-90 — aceita o CNPJ alfanumérico (letras nas 12
// primeiras posições; os 2 dígitos verificadores são sempre números).
export function mascaraCNPJ(valor) {
  const bruto = String(valor ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  const d = (bruto.slice(0, 12) + bruto.slice(12).replace(/\D/g, "")).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

// Campo que aceita CPF, RG ou outro documento: só formata quando
// é claramente um CPF (11 dígitos) ou CNPJ (14 dígitos). RG e
// documentos com letras ficam como digitados.
export function mascaraDocumento(valor) {
  const texto = String(valor ?? "");
  if (/[A-Za-z]/.test(texto)) {
    const alnum = texto.toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (/^[0-9A-Z]{12}\d{2}$/.test(alnum)) return mascaraCNPJ(alnum); // CNPJ alfanumérico
    return texto.trimStart();
  }
  const d = soDigitos(texto);
  if (d.length === 11) return mascaraCPF(d);
  if (d.length === 14) return mascaraCNPJ(d);
  return texto.replace(/[^\d.\-/]/g, "");
}

// "08:00 às 22:00"
export function mascaraIntervaloHoras(valor) {
  const completo = String(valor ?? "").match(/^\s*(\d{1,2})[:h](\d{2})\s*(?:às|as|a|-|até)\s*(\d{1,2})[:h](\d{2})\s*$/i);
  if (completo) {
    const [, h1, m1, h2, m2] = completo;
    return `${h1.padStart(2, "0")}:${m1} às ${h2.padStart(2, "0")}:${m2}`;
  }
  const d = soDigitos(valor).slice(0, 8);
  const hora = (x) => (x.length <= 2 ? x : `${x.slice(0, 2)}:${x.slice(2)}`);
  if (d.length <= 4) return hora(d);
  return `${hora(d.slice(0, 4))} às ${hora(d.slice(4))}`;
}

// 1.234,56 (centavos digitados da direita para a esquerda)
export function mascaraMoeda(valor) {
  const d = soDigitos(valor).replace(/^0+(?=\d)/, "").slice(0, 13);
  if (!d) return "";
  const centavos = Number(d);
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
