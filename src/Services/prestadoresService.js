const STORAGE_PRESTADORES = "condominio_prestadores";

function lerStorage() {
  try {
    const dados = JSON.parse(localStorage.getItem(STORAGE_PRESTADORES));

    if (!Array.isArray(dados)) return [];

    return dados;
  } catch {
    return [];
  }
}

function salvarStorage(lista) {
  localStorage.setItem(
    STORAGE_PRESTADORES,
    JSON.stringify(lista)
  );

  window.dispatchEvent(
    new CustomEvent("prestadoresAtualizados")
  );
}

export function buscarPrestadores() {
  return lerStorage().sort((a, b) => {
    const da = new Date(
      b.updatedAt ||
      b.createdAt ||
      b.criadoEm ||
      0
    );

    const db = new Date(
      a.updatedAt ||
      a.createdAt ||
      a.criadoEm ||
      0
    );

    return da - db;
  });
}

export function buscarPrestador(id) {
  return buscarPrestadores().find(
    p => String(p.id) === String(id)
  );
}

export function salvarPrestadores(lista) {
  salvarStorage(lista);
}

export function adicionarPrestador(prestador) {

  const lista = buscarPrestadores();

  lista.unshift(prestador);

  salvarStorage(lista);

  return prestador;
}

export function atualizarPrestador(id, dados) {

  const lista = buscarPrestadores().map(item =>

    String(item.id) === String(id)
      ? {
          ...item,
          ...dados,
          updatedAt: new Date().toISOString()
        }
      : item

  );

  salvarStorage(lista);

  return lista.find(
    p => String(p.id) === String(id)
  );
}

export function excluirPrestador(id) {

  const lista = buscarPrestadores().filter(
    item => String(item.id) !== String(id)
  );

  salvarStorage(lista);

  return true;
}

export function alterarStatusPrestador(id, status) {

  return atualizarPrestador(id, {

    status,

    dataSaida:
      status === "Finalizado"
        ? new Date().toISOString().slice(0,10)
        : undefined,

    horaSaida:
      status === "Finalizado"
        ? new Date().toLocaleTimeString("pt-BR",{
            hour:"2-digit",
            minute:"2-digit"
          })
        : undefined

  });

}

export function buscarPrestadoresAtivos() {

  return buscarPrestadores().filter(

    p =>
      p.status === "Em execução" ||
      p.status === "Aguardando liberação"

  );

}

export function buscarPrestadoresFinalizados() {

  return buscarPrestadores().filter(

    p => p.status === "Finalizado"

  );

}

export function buscarPrestadoresPorApartamento(apartamento) {

  return buscarPrestadores().filter(

    p =>
      String(p.apartamento) ===
      String(apartamento)

  );

}

export function buscarPrestadoresPorMorador(moradorId){

  return buscarPrestadores().filter(

    p =>
      String(p.moradorId) ===
      String(moradorId)

  );

}

export function buscarPrestadoresPorStatus(status){

  return buscarPrestadores().filter(

    p => p.status === status

  );

}

export function existeCpfDuplicado(cpf,id=null){

  const numero = String(cpf || "")
      .replace(/\D/g,"");

  return buscarPrestadores().some(item=>{

      if(String(item.id)===String(id))
          return false;

      return String(item.cpf || "")
        .replace(/\D/g,"")===numero;

  });

}