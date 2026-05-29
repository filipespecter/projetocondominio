import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, tipoPermitido }) {
  const location = useLocation();

  function obterChaveSessao() {
    switch (tipoPermitido) {
      case "sindico":
        return "sessaoSindico";

      case "porteiro":
        return "sessaoPorteiro";

      case "morador":
        return "sessaoMorador";

      default:
        return "sessao";
    }
  }

  const chaveSessao = obterChaveSessao();

  const usuarioSalvo =
    localStorage.getItem(chaveSessao) ||
    sessionStorage.getItem(chaveSessao);

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
    usuarioLogado = JSON.parse(usuarioSalvo);
  } catch {
    localStorage.removeItem(chaveSessao);
    sessionStorage.removeItem(chaveSessao);

    return (
      <Navigate
        to={`/login/${tipoPermitido}`}
        replace
      />
    );
  }

  if (usuarioLogado.tipo !== tipoPermitido) {
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