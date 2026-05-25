import { Navigate } from "react-router-dom";

function ProtectedRoute({
  children,
  tipoPermitido
}) {

  const usuarioLogado =
    JSON.parse(
      localStorage.getItem("usuarioLogado")
    );

  // NÃO LOGADO
  if (!usuarioLogado) {

    return <Navigate to="/" />;

  }

  // PERFIL ERRADO
  if (
    usuarioLogado.tipo !== tipoPermitido
  ) {

    return <Navigate to="/" />;

  }

  return children;

}

export default ProtectedRoute;