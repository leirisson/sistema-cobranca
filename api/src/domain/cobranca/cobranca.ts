import { randomUUID } from "node:crypto";
import { z } from "zod";

import { CobrancaInvalidaError } from "./cobranca-invalida-error.js";

export type StatusCobranca = "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";

const propsSchema = z.object({
  clienteId: z.string().trim().min(1, "clienteId não pode ser vazio"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  vencimento: z.date(),
  gatewayChargeId: z.string().trim().min(1, "gatewayChargeId não pode ser vazio"),
  linkPagamento: z.string().trim().min(1, "linkPagamento não pode ser vazio"),
  pixCopiaECola: z.string().trim().min(1).nullish(),
});

export interface CobrancaProps {
  clienteId: string;
  valor: number;
  vencimento: Date;
  gatewayChargeId: string;
  linkPagamento: string;
  pixCopiaECola?: string | null;
}

export interface CobrancaRestauracao extends CobrancaProps {
  id: string;
  status: StatusCobranca;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Cobranca {
  readonly id: string;
  private readonly _clienteId: string;
  private readonly _valor: number;
  private readonly _vencimento: Date;
  private _status: StatusCobranca;
  private readonly _gatewayChargeId: string;
  private readonly _linkPagamento: string;
  private readonly _pixCopiaECola: string | null;
  private _paidAt: Date | null;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: string,
    props: CobrancaProps,
    status: StatusCobranca,
    paidAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this._clienteId = props.clienteId;
    this._valor = props.valor;
    this._vencimento = props.vencimento;
    this._status = status;
    this._gatewayChargeId = props.gatewayChargeId;
    this._linkPagamento = props.linkPagamento;
    this._pixCopiaECola = props.pixCopiaECola ?? null;
    this._paidAt = paidAt;
    this.createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static criar(props: CobrancaProps): Cobranca {
    const validado = Cobranca.validar(props);
    const agora = new Date();

    return new Cobranca(randomUUID(), validado, "PENDENTE", null, agora, agora);
  }

  static restaurar(props: CobrancaRestauracao): Cobranca {
    return new Cobranca(props.id, props, props.status, props.paidAt, props.createdAt, props.updatedAt);
  }

  private static validar(props: CobrancaProps): CobrancaProps {
    const resultado = propsSchema.safeParse(props);

    if (!resultado.success) {
      const mensagem = resultado.error.issues[0]?.message ?? "Dados da cobrança inválidos";
      throw new CobrancaInvalidaError(mensagem);
    }

    return resultado.data;
  }

  marcarComoPaga(paidAt: Date): void {
    if (this._status !== "PENDENTE" && this._status !== "ATRASADO") {
      throw new CobrancaInvalidaError(`Não é possível marcar como paga uma cobrança com status ${this._status}`);
    }

    this._status = "PAGO";
    this._paidAt = paidAt;
    this._updatedAt = new Date();
  }

  marcarComoAtrasada(): void {
    if (this._status !== "PENDENTE") {
      throw new CobrancaInvalidaError(`Não é possível marcar como atrasada uma cobrança com status ${this._status}`);
    }

    this._status = "ATRASADO";
    this._updatedAt = new Date();
  }

  cancelar(): void {
    if (this._status !== "PENDENTE" && this._status !== "ATRASADO") {
      throw new CobrancaInvalidaError(`Não é possível cancelar uma cobrança com status ${this._status}`);
    }

    this._status = "CANCELADO";
    this._updatedAt = new Date();
  }

  get clienteId(): string {
    return this._clienteId;
  }

  get valor(): number {
    return this._valor;
  }

  get vencimento(): Date {
    return this._vencimento;
  }

  get status(): StatusCobranca {
    return this._status;
  }

  get gatewayChargeId(): string {
    return this._gatewayChargeId;
  }

  get linkPagamento(): string {
    return this._linkPagamento;
  }

  get pixCopiaECola(): string | null {
    return this._pixCopiaECola;
  }

  get paidAt(): Date | null {
    return this._paidAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
