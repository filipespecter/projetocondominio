import operationalRecordApi from "./operationalRecordApi.js";

export async function salvarMovimentacao(tipo, mensagem, dados = {}) {
  return operationalRecordApi.create({ tipo, mensagem, ...dados });
}

export async function buscarMovimentacoes() {
  return operationalRecordApi.list();
}