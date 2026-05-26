export function salvarMovimentacao(
  tipo,
  mensagem,
  dados = {}
) {

  const movimentacoes =
    JSON.parse(
      localStorage.getItem("movimentacoes")
    ) || [];

  const novaMovimentacao = {

    id: Date.now(),

    tipo,

    mensagem,

    data:
      new Date().toLocaleString(),

    ...dados

  };

  movimentacoes.unshift(
    novaMovimentacao
  );

  localStorage.setItem(
    "movimentacoes",
    JSON.stringify(movimentacoes)
  );

}

export function buscarMovimentacoes() {

  return (
    JSON.parse(
      localStorage.getItem("movimentacoes")
    ) || []
  );

}