import { randomUUID } from "node:crypto";
import { z } from "zod";

import { ClienteInvalidoError } from "./cliente-invalido-error.js";

export type StatusCliente = "ATIVO" | "INATIVO";

const TELEFONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;

const propsSchema = z.object({
  nome: z.string().trim().min(1, "Nome não pode ser vazio"),
  telefone: z.string().regex(TELEFONE_E164_REGEX, "Telefone deve seguir o formato E.164"),
  email: z.string().email().nullish(),
  documento: z.string().trim().min(1).nullish(),
  valorCobranca: z.number().positive("Valor de cobrança deve ser maior que zero"),
  diaVencimento: z
    .number()
    .int("Dia de vencimento deve ser um número inteiro")
    .min(1, "Dia de vencimento deve estar entre 1 e 28")
    .max(28, "Dia de vencimento deve estar entre 1 e 28"),
});

export interface ClienteProps {
  nome: string;
  telefone: string;
  email?: string | null;
  documento?: string | null;
  valorCobranca: number;
  diaVencimento: number;
}

export interface ClienteEdicao {
  nome?: string;
  telefone?: string;
  email?: string | null;
  documento?: string | null;
  valorCobranca?: number;
  diaVencimento?: number;
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
  private _telefone: string;
  private _email: string | null;
  private _documento: string | null;
  private _valorCobranca: number;
  private _diaVencimento: number;
  private _status: StatusCliente;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: ClienteProps, status: StatusCliente, createdAt: Date, updatedAt: Date) {
    this.id = id;
    this._nome = props.nome;
    this._telefone = props.telefone;
    this._email = props.email ?? null;
    this._documento = props.documento ?? null;
    this._valorCobranca = props.valorCobranca;
    this._diaVencimento = props.diaVencimento;
    this._status = status;
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
      telefone: edicao.telefone ?? this._telefone,
      email: edicao.email !== undefined ? edicao.email : this._email,
      documento: edicao.documento !== undefined ? edicao.documento : this._documento,
      valorCobranca: edicao.valorCobranca ?? this._valorCobranca,
      diaVencimento: edicao.diaVencimento ?? this._diaVencimento,
    });

    this._nome = propsAtualizadas.nome;
    this._telefone = propsAtualizadas.telefone;
    this._email = propsAtualizadas.email ?? null;
    this._documento = propsAtualizadas.documento ?? null;
    this._valorCobranca = propsAtualizadas.valorCobranca;
    this._diaVencimento = propsAtualizadas.diaVencimento;
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

  get telefone(): string {
    return this._telefone;
  }

  get email(): string | null {
    return this._email;
  }

  get documento(): string | null {
    return this._documento;
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

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
