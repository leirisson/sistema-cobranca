import { config } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "test") {
  config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  ASAAS_API_KEY: z.string(),
  ASAAS_BASE_URL: z.string().url(),
  ASAAS_WEBHOOK_TOKEN: z.string(),

  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string(),
  EVOLUTION_INSTANCE: z.string(),

  GMAIL_USUARIO: z.string().email(),
  GMAIL_SENHA_APP: z.string(),
  GMAIL_REMETENTE: z.string().email(),

  COBRANCA_ANTECEDENCIA_DIAS: z.coerce.number().int().positive().default(5),
  CONFIRMACAO_PAGAMENTO_HABILITADA: z.coerce.boolean().default(false),

  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("7d"),

  CONFIG_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "CONFIG_ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
    throw new Error("Configuração de ambiente inválida. Verifique o .env.");
  }

  return parsed.data;
}

export const env = loadEnv();
