import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3333),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:5173")
});

const resultado = envSchema.safeParse(process.env);

if (!resultado.success) {
  console.error(
    "Erro nas variáveis de ambiente:",
    resultado.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const env = resultado.data;