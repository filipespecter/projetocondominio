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
   * A URL será utilizada pelo Prisma quando o
   * PostgreSQL for conectado.
   *
   * Por enquanto, ela pode permanecer ausente,
   * porque ainda não iniciaremos a conexão real.
   */
  DATABASE_URL: z
    .string()
    .min(1)
    .optional(),

  /**
   * Chave usada para assinar o token de acesso.
   *
   * Em produção, deverá possuir um valor longo,
   * aleatório e diferente da chave de refresh.
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

  /**
   * Tempo de duração do access token.
   *
   * Exemplos:
   * 15m
   * 30m
   * 1h
   */
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default("15m"),

  /**
   * Tempo de duração do refresh token.
   *
   * Exemplos:
   * 7d
   * 15d
   * 30d
   */
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default("7d"),

  /**
   * Número máximo de tentativas incorretas
   * antes do bloqueio temporário.
   */
  LOGIN_MAX_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(5),

  /**
   * Tempo do bloqueio após exceder as tentativas.
   */
  LOGIN_LOCK_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15),

  /**
   * Quantidade de salt rounds utilizada pelo bcrypt.
   */
  BCRYPT_ROUNDS: z.coerce
    .number()
    .int()
    .min(10)
    .max(14)
    .default(12),
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