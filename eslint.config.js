import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import {
  defineConfig,
  globalIgnores,
} from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist/**",
    "node_modules/**",
    "backend/generated/**",
    "backend/prisma/migrations/**",
  ]),

  {
    files: [
      "src/**/*.{js,jsx}",
    ],

    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      globals:
        globals.browser,

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      /**
       * O InfinityCondo carrega dados remotos ao montar telas.
       * Essas regras mais novas do plugin tratam esse padrão
       * arquitetural válido como erro de "React Compiler".
       *
       * Mantemos rules-of-hooks ativa, mas não bloqueamos
       * o projeto por esses diagnósticos de otimização.
       */
      "react-hooks/set-state-in-effect":
        "off",

      "react-hooks/immutability":
        "off",

      /**
       * Os loaders são funções locais assíncronas chamadas
       * no mount e em refresh explícito. Transformá-los todos
       * em useCallback agora aumentaria complexidade sem ganho
       * funcional e poderia criar loops de dependência.
       */
      "react-hooks/exhaustive-deps":
        "off",

      /**
       * PlatformUi.jsx exporta componentes e estilos
       * compartilhados propositalmente.
       */
      "react-refresh/only-export-components":
        "off",
    },
  },

  {
    files: [
      "backend/src/**/*.js",
      "backend/prisma/**/*.js",
      "vite.config.js",
    ],

    extends: [
      js.configs.recommended,
    ],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
