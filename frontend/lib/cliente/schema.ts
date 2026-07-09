import { z } from "zod";

const TELEFONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;
const DOCUMENTO_REGEX = /^\d{11}$|^\d{14}$/;

export const telefoneSchema = z.object({
  id: z.string().optional(),
  numero: z.string().regex(TELEFONE_E164_REGEX, "Telefone deve seguir o formato E.164, ex: +5592999999999"),
  principal: z.boolean(),
});

export const enderecoSchema = z.object({
  rua: z.string().trim().min(1, "Rua não pode ser vazia"),
  numero: z.string().trim().min(1).nullish(),
  bairro: z.string().trim().min(1).nullish(),
  cidade: z.string().trim().min(1, "Cidade não pode ser vazia"),
  uf: z.string().trim().length(2, "UF deve ter 2 letras"),
  cep: z.string().trim().min(1, "CEP não pode ser vazio"),
});

export const clienteSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome não pode ser vazio"),
    documento: z.string().regex(DOCUMENTO_REGEX, "Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)"),
    telefones: z.array(telefoneSchema).min(1, "Cliente deve ter pelo menos 1 telefone"),
    email: z.string().trim().email("E-mail inválido").nullish().or(z.literal("")),
    valorCobranca: z.number().positive("Valor de cobrança deve ser maior que zero"),
    diaVencimento: z
      .number()
      .int("Dia de vencimento deve ser um número inteiro")
      .min(1, "Dia de vencimento deve estar entre 1 e 28")
      .max(28, "Dia de vencimento deve estar entre 1 e 28"),
    inscricaoEstadual: z.string().trim().min(1).nullish().or(z.literal("")),
    endereco: enderecoSchema.nullish(),
    nomeContato: z.string().trim().min(1).nullish().or(z.literal("")),
    referenciaServico: z.string().trim().min(1).nullish().or(z.literal("")),
  })
  .superRefine((props, ctx) => {
    const principais = props.telefones.filter((telefone) => telefone.principal);

    if (principais.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Marque exatamente 1 telefone como principal",
        path: ["telefones"],
      });
    }
  });

export type ClienteFormValues = z.infer<typeof clienteSchema>;
