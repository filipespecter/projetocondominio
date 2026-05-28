export function buscarPrestadores() {

  return JSON.parse(
    localStorage.getItem("prestadores")
  ) || [];

}

export function salvarPrestadores(lista) {

  localStorage.setItem(
    "prestadores",
    JSON.stringify(lista)
  );

}