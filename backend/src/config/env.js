import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production",
    ])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3333),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

  /**
   * URL oficial do PostgreSQL utilizada pelo Prisma.
   */
  DATABASE_URL: z
    .string()
    .min(1)
    .optional(),

  /**
   * Chave usada para assinar o token de acesso.
   */
  JWT_ACCESS_SECRET: z
    .string()
    .min(
      32,
      "JWT_ACCESS_SECRET deve possuir pelo menos 32 caracteres."
    )
    .optional(),

  /**
   * Chave usada para assinar o refresh token.
   */
  JWT_REFRESH_SECRET: z
    .string()
    .min(
      32,
      "JWT_REFRESH_SECRET deve possuir pelo menos 32 caracteres."
    )
    .optional(),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default("15m"),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default("7d"),

  LOGIN_MAX_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(5),

  LOGIN_LOCK_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15),

  BCRYPT_ROUNDS: z.coerce
    .number()
    .int()
    .min(10)
    .max(14)
    .default(12),

  /**
   * =====================================================
   * JOBS / SCHEDULER
   * =====================================================
   */

  JOBS_ENABLED: z
    .enum([
      "true",
      "false",
    ])
    .default("true"),

  JOBS_TICK_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(60000),
});

const resultado = envSchema.safeParse(
  process.env
);

if (!resultado.success) {
  console.error(
    "Erro nas variáveis de ambiente:",
    resultado.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const env = resultado.data;

export default env;
