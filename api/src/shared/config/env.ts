import { z } from "zod";

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

  GMAIL_CLIENT_ID: z.string(),
  GMAIL_CLIENT_SECRET: z.string(),
  GMAIL_REFRESH_TOKEN: z.string(),
  GMAIL_REMETENTE: z.string().email(),

  COBRANCA_ANTECEDENCIA_DIAS: z.coerce.number().int().positive().default(5),
  CONFIRMACAO_PAGAMENTO_HABILITADA: z.coerce.boolean().default(false),
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
