export function salvarMovimentacao(novaMovimentacao) {

  const movimentacoes =
    JSON.parse(
      localStorage.getItem("movimentacoes")
    ) || [];

  movimentacoes.unshift(novaMovimentacao);

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