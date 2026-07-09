import { z } from "zod";

export const configuracaoSchema = z.object({
  asaasApiKey: z.string().optional(),
  nomeRemetente: z.string().trim().min(1).nullish().or(z.literal("")),
  confirmacaoPagamentoHabilitada: z.boolean(),
});

export type ConfiguracaoFormInput = z.infer<typeof configuracaoSchema>;
