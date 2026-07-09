import { z } from "zod";

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const cobrancaManualSchema = z.object({
  clienteId: z.string().trim().min(1, "Selecione um cliente"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  vencimento: z.string().regex(DATA_REGEX, "Data de vencimento inválida"),
  descricao: z.string().trim().min(1).nullish().or(z.literal("")),
});

export type CobrancaManualFormValues = z.infer<typeof cobrancaManualSchema>;
