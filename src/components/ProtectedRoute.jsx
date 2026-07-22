import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, tipoPermitido }) {
  const location = useLocation();

  function obterChavesSessao() {
    switch (tipoPermitido) {
      case "sindico":
        return ["sessaoSindico", "usuarioSindico"];

      case "porteiro":
        return ["sessaoPorteiro", "usuarioPorteiro"];

      case "morador":
        return ["sessaoMorador", "usuarioMorador"];

      default:
        return ["sessao"];
    }
  }

  function limparSessao(chaves) {
    chaves.forEach((chave) => {
      localStorage.removeItem(chave);
      sessionStorage.removeItem(chave);
    });

    localStorage.removeItem("usuarioLogado");
    sessionStorage.removeItem("usuarioLogado");
  }

  function normalizarTipo(usuario) {
    if (!usuario) return "";

    const tipo =
      usuario.tipo ||
      usuario.perfilTipo ||
      usuario.perfilAcesso ||
      usuario.perfil ||
      usuario.tipoUsuario ||
      "";

    return String(tipo)
      .trim()
      .toLowerCase();
  }

  function usuarioEhValidoParaRota(usuario) {
    const tipoUsuario = normalizarTipo(usuario);

    if (!tipoUsuario) {
      return false;
    }

    if (tipoPermitido === "morador") {
      return (
        tipoUsuario === "morador" ||
        tipoUsuario === "principal" ||
        tipoUsuario === "dependente"
      );
    }

    if (tipoPermitido === "sindico") {
      return (
        tipoUsuario === "sindico" ||
        tipoUsuario === "admin" ||
        tipoUsuario === "mestre" ||
        tipoUsuario === "sub"
      );
    }

    if (tipoPermitido === "porteiro") {
      return tipoUsuario === "porteiro";
    }

    return tipoUsuario === tipoPermitido;
  }

  const chavesSessao = obterChavesSessao();

  const usuarioSalvo = chavesSessao
    .map((chave) => ({
      chave,
      valor:
        localStorage.getItem(chave) ||
        sessionStorage.getItem(chave)
    }))
    .find((item) => item.valor);

  if (!usuarioSalvo) {
    return (
      <Navigate
        to={`/login/${tipoPermitido}`}
        state={{ from: location }}
        replace
      />
    );
  }

  let usuarioLogado = null;

  try {
    usuarioLogado = JSON.parse(usuarioSalvo.valor);
  } catch {
    limparSessao(chavesSessao);

    return (
      <Navigate
        to={`/login/${tipoPermitido}`}
        state={{ from: location }}
        replace
      />
    );
  }

  if (
    !usuarioLogado ||
    typeof usuarioLogado !== "object" ||
    Array.isArray(usuarioLogado)
  ) {
    limparSessao(chavesSessao);

    return (
      <Navigate
        to={`/login/${tipoPermitido}`}
        state={{ from: location }}
        replace
      />
    );
  }

  if (!usuarioEhValidoParaRota(usuarioLogado)) {
    limparSessao(chavesSessao);

    return (
      <Navigate
        to={`/login/${tipoPermitido}`}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;