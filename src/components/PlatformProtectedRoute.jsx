import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import authApi from "../Services/authApi.js";

/**
 * =====================================================
 * CENTRAL STAR - PROTEÇÃO DE ROTA
 * =====================================================
 *
 * Diferente do ProtectedRoute legado dos condomínios,
 * esta proteção confirma a sessão diretamente no backend.
 *
 * Somente usuários internos da plataforma podem continuar:
 *
 * - PLATFORM_OWNER
 * - PLATFORM_ADMIN
 * - PLATFORM_SUPPORT
 */
function PlatformProtectedRoute({
  children,
}) {
  const location =
    useLocation();

  const [
    status,
    setStatus,
  ] = useState("CHECKING");

  useEffect(() => {
    let mounted = true;

    async function validateSession() {
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

        const role =
          String(
            user?.role ?? ""
          ).toUpperCase();

        const allowedRoles = [
          "PLATFORM_OWNER",
          "PLATFORM_ADMIN",
          "PLATFORM_SUPPORT",
        ];

        if (
          !allowedRoles.includes(
            role
          ) ||
          (
            user?.condominiumId !==
              null &&
            user?.condominiumId !==
              undefined
          )
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

    validateSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (
    status === "CHECKING"
  ) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />

        <strong>
          Validando acesso à Central Star...
        </strong>
      </div>
    );
  }

  if (
    status ===
      "UNAUTHENTICATED" ||
    status === "FORBIDDEN"
  ) {
    return (
      <Navigate
        to="/login/platform"
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  return children;
}

const styles = {
  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    background:
      "linear-gradient(135deg,#0f0a1f,#1b1038,var(--ic-primary-deepest))",
    color: "#ffffff",
    fontFamily: "Arial",
  },

  spinner: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border:
      "4px solid rgba(255,255,255,0.22)",
    borderTopColor:
      "#c084fc",
    animation:
      "spin 1s linear infinite",
  },
};

export default PlatformProtectedRoute;
