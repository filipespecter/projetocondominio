// Rótulo da unidade com bloco: "Bloco A · Apto 302". Sem bloco cadastrado: "Apto 302".
// Evita confundir apartamentos de mesmo número em blocos diferentes.
export function rotuloUnidade(ap) {
  if (!ap) return "";
  const bloco = ap.block ?? ap.bloco;
  const numero = ap.number ?? ap.numero;
  if (!numero) return "";
  return bloco ? `Bloco ${bloco} · Apto ${numero}` : `Apto ${numero}`;
}
