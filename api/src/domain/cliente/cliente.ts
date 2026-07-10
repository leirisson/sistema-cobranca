import { randomUUID } from "node:crypto";
import { z } from "zod";

import { ClienteInvalidoError } from "./cliente-invalido-error.js";

export type StatusCliente = "ATIVO" | "INATIVO";
export type TipoDocumento = "CPF" | "CNPJ";

const TELEFONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;
const DOCUMENTO_REGEX = /^\d{11}$|^\d{14}$/;

const telefoneSchema = z.object({
  id: z.string().optional(),
  numero: z.string().regex(TELEFONE_E164_REGEX, "Telefone deve seguir o formato E.164"),
  principal: z.boolean(),
});

const enderecoSchema = z
  .object({
    rua: z.string().trim().min(1),
    numero: z.string().trim().min(1).nullish(),
    bairro: z.string().trim().min(1).nullish(),
    cidade: z.string().trim().min(1),
    uf: z.string().trim().length(2),
    cep: z.string().trim().min(1),
  })
  .nullish();

const propsSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome não pode ser vazio"),
    documento: z.string().regex(DOCUMENTO_REGEX, "Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)"),
    telefones: z.array(telefoneSchema).min(1, "Cliente deve ter pelo menos 1 telefone"),
    email: z.string().trim().email("E-mail inválido").nullish(),
    valorCobranca: z.number().positive("Valor de cobrança deve ser maior que zero"),
    diaVencimento: z
      .number()
      .int("Dia de vencimento deve ser um número inteiro")
      .min(1, "Dia de vencimento deve estar entre 1 e 28")
      .max(28, "Dia de vencimento deve estar entre 1 e 28"),
    inscricaoEstadual: z.string().trim().min(1).nullish(),
    endereco: enderecoSchema,
    nomeContato: z.string().trim().min(1).nullish(),
    referenciaServico: z.string().trim().min(1).nullish(),
  })
  .superRefine((props, ctx) => {
    const principais = props.telefones.filter((telefone) => telefone.principal);

    if (principais.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cliente deve ter exatamente 1 telefone marcado como principal",
        path: ["telefones"],
      });
    }
  });

export interface TelefoneClienteProps {
  id?: string;
  numero: string;
  principal: boolean;
}

export interface EnderecoCliente {
  rua: string;
  numero?: string | null;
  bairro?: string | null;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ClienteProps {
  nome: string;
  documento: string;
  telefones: TelefoneClienteProps[];
  email?: string | null;
  valorCobranca: number;
  diaVencimento: number;
  inscricaoEstadual?: string | null;
  endereco?: EnderecoCliente | null;
  nomeContato?: string | null;
  referenciaServico?: string | null;
}

export interface ClienteEdicao {
  nome?: string;
  documento?: string;
  telefones?: TelefoneClienteProps[];
  email?: string | null;
  valorCobranca?: number;
  diaVencimento?: number;
  inscricaoEstadual?: string | null;
  endereco?: EnderecoCliente | null;
  nomeContato?: string | null;
  referenciaServico?: string | null;
}

export interface ClienteRestauracao extends ClienteProps {
  id: string;
  status: StatusCliente;
  createdAt: Date;
  updatedAt: Date;
}

export class Cliente {
  readonly id: string;
  private _nome: string;
  private _documento: string;
  private _telefones: TelefoneClienteProps[];
  private _email: string | null;
  private _valorCobranca: number;
  private _diaVencimento: number;
  private _status: StatusCliente;
  private _inscricaoEstadual: string | null;
  private _endereco: EnderecoCliente | null;
  private _nomeContato: string | null;
  private _referenciaServico: string | null;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: ClienteProps, status: StatusCliente, createdAt: Date, updatedAt: Date) {
    this.id = id;
    this._nome = props.nome;
    this._documento = props.documento;
    this._telefones = props.telefones;
    this._email = props.email ?? null;
    this._valorCobranca = props.valorCobranca;
    this._diaVencimento = props.diaVencimento;
    this._status = status;
    this._inscricaoEstadual = props.inscricaoEstadual ?? null;
    this._endereco = props.endereco ?? null;
    this._nomeContato = props.nomeContato ?? null;
    this._referenciaServico = props.referenciaServico ?? null;
    this.createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static criar(props: ClienteProps): Cliente {
    const validado = Cliente.validar(props);
    const agora = new Date();

    return new Cliente(randomUUID(), validado, "ATIVO", agora, agora);
  }

  static restaurar(props: ClienteRestauracao): Cliente {
    return new Cliente(props.id, props, props.status, props.createdAt, props.updatedAt);
  }

  private static validar(props: ClienteProps): ClienteProps {
    const resultado = propsSchema.safeParse(props);

    if (!resultado.success) {
      const mensagem = resultado.error.issues[0]?.message ?? "Dados do cliente inválidos";
      throw new ClienteInvalidoError(mensagem);
    }

    return resultado.data;
  }

  editar(edicao: ClienteEdicao): void {
    const propsAtualizadas = Cliente.validar({
      nome: edicao.nome ?? this._nome,
      documento: edicao.documento ?? this._documento,
      telefones: edicao.telefones ?? this._telefones,
      email: edicao.email !== undefined ? edicao.email : this._email,
      valorCobranca: edicao.valorCobranca ?? this._valorCobranca,
      diaVencimento: edicao.diaVencimento ?? this._diaVencimento,
      inscricaoEstadual: edicao.inscricaoEstadual !== undefined ? edicao.inscricaoEstadual : this._inscricaoEstadual,
      endereco: edicao.endereco !== undefined ? edicao.endereco : this._endereco,
      nomeContato: edicao.nomeContato !== undefined ? edicao.nomeContato : this._nomeContato,
      referenciaServico:
        edicao.referenciaServico !== undefined ? edicao.referenciaServico : this._referenciaServico,
    });

    this._nome = propsAtualizadas.nome;
    this._documento = propsAtualizadas.documento;
    this._telefones = propsAtualizadas.telefones;
    this._email = propsAtualizadas.email ?? null;
    this._valorCobranca = propsAtualizadas.valorCobranca;
    this._diaVencimento = propsAtualizadas.diaVencimento;
    this._inscricaoEstadual = propsAtualizadas.inscricaoEstadual ?? null;
    this._endereco = propsAtualizadas.endereco ?? null;
    this._nomeContato = propsAtualizadas.nomeContato ?? null;
    this._referenciaServico = propsAtualizadas.referenciaServico ?? null;
    this._updatedAt = new Date();
  }

  inativar(): void {
    this._status = "INATIVO";
    this._updatedAt = new Date();
  }

  reativar(): void {
    this._status = "ATIVO";
    this._updatedAt = new Date();
  }

  get nome(): string {
    return this._nome;
  }

  get documento(): string {
    return this._documento;
  }

  get tipoDocumento(): TipoDocumento {
    return this._documento.length === 11 ? "CPF" : "CNPJ";
  }

  get telefones(): TelefoneClienteProps[] {
    return this._telefones;
  }

  get telefonePrincipal(): TelefoneClienteProps | null {
    return this._telefones.find((telefone) => telefone.principal) ?? null;
  }

  get email(): string | null {
    return this._email;
  }

  get valorCobranca(): number {
    return this._valorCobranca;
  }

  get diaVencimento(): number {
    return this._diaVencimento;
  }

  get status(): StatusCliente {
    return this._status;
  }

  get inscricaoEstadual(): string | null {
    return this._inscricaoEstadual;
  }

  get endereco(): EnderecoCliente | null {
    return this._endereco;
  }

  get nomeContato(): string | null {
    return this._nomeContato;
  }

  get referenciaServico(): string | null {
    return this._referenciaServico;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
