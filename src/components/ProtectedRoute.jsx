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

  const chavesSessao = obterChavesSessao();

  const usuarioSalvo =
    chavesSessao
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
    chavesSessao.forEach((chave) => {
      localStorage.removeItem(chave);
      sessionStorage.removeItem(chave);
    });

    return (
      <Navigate
        to={`/login/${tipoPermitido}`}
        replace
      />
    );
  }

  const tipoUsuario =
    usuarioLogado.tipo ||
    usuarioLogado.perfilTipo ||
    usuarioLogado.perfilAcesso;

  if (tipoUsuario && tipoUsuario !== tipoPermitido) {
    return (
      <Navigate
        to={`/login/${tipoPermitido}`}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;