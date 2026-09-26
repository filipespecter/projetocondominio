import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import authApi, {
  tipoFrontendAceitaRole,
} from "../Services/authApi.js";

function ProtectedRoute({
  children,
  tipoPermitido,
}) {
  const location =
    useLocation();

  const [
    status,
    setStatus,
  ] = useState("CHECKING");

  useEffect(() => {
    let mounted = true;

    async function validar() {
      if (
        !authApi.hasAccessToken()
      ) {
        if (mounted) {
          setStatus(
            "UNAUTHENTICATED"
          );
        }

        return;
      }

      try {
        const user =
          await authApi.me();

        if (!mounted) {
          return;
        }

        if (
          !user ||
          !tipoFrontendAceitaRole(
            tipoPermitido,
            user.role
          )
        ) {
          authApi.clearAuthTokens();

          setStatus(
            "FORBIDDEN"
          );

          return;
        }

        if (
          tipoPermitido !== "platform" &&
          !user.condominiumId
        ) {
          authApi.clearAuthTokens();

          setStatus(
            "FORBIDDEN"
          );

          return;
        }

        setStatus(
          "AUTHORIZED"
        );
      } catch {
        if (!mounted) {
          return;
        }

        authApi.clearAuthTokens();

        setStatus(
          "UNAUTHENTICATED"
        );
      }
    }

    validar();

    return () => {
      mounted = false;
    };
  }, [tipoPermitido]);

  if (
    status === "CHECKING"
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f6f8",
          color: "#374151",
          fontFamily: "Arial",
          fontWeight: 700,
        }}
      >
        Validando sessão...
      </div>
    );
  }

  if (
    status !== "AUTHORIZED"
  ) {
    return (
      <Navigate
        to={`/login/${tipoPermitido}`}
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
