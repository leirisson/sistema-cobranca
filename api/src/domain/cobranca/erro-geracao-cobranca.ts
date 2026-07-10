import { randomUUID } from "node:crypto";
import { z } from "zod";

import { ErroGeracaoCobrancaInvalidoError } from "./erro-geracao-cobranca-invalido-error.js";

const propsSchema = z.object({
  clienteId: z.string().trim().min(1, "clienteId não pode ser vazio"),
  nomeCliente: z.string().trim().min(1, "nomeCliente não pode ser vazio"),
  mensagemErro: z.string().trim().min(1, "mensagemErro não pode ser vazia"),
});

export interface ErroGeracaoCobrancaProps {
  clienteId: string;
  nomeCliente: string;
  mensagemErro: string;
}

export interface ErroGeracaoCobrancaRestauracao extends ErroGeracaoCobrancaProps {
  id: string;
  ocorridoEm: Date;
}

export class ErroGeracaoCobranca {
  readonly id: string;
  private readonly _clienteId: string;
  private readonly _nomeCliente: string;
  private readonly _mensagemErro: string;
  readonly ocorridoEm: Date;

  private constructor(id: string, props: ErroGeracaoCobrancaProps, ocorridoEm: Date) {
    this.id = id;
    this._clienteId = props.clienteId;
    this._nomeCliente = props.nomeCliente;
    this._mensagemErro = props.mensagemErro;
    this.ocorridoEm = ocorridoEm;
  }

  static criar(props: ErroGeracaoCobrancaProps): ErroGeracaoCobranca {
    const validado = ErroGeracaoCobranca.validar(props);

    return new ErroGeracaoCobranca(randomUUID(), validado, new Date());
  }

  static restaurar(props: ErroGeracaoCobrancaRestauracao): ErroGeracaoCobranca {
    return new ErroGeracaoCobranca(props.id, props, props.ocorridoEm);
  }

  private static validar(props: ErroGeracaoCobrancaProps): ErroGeracaoCobrancaProps {
    const resultado = propsSchema.safeParse(props);

    if (!resultado.success) {
      const mensagem = resultado.error.issues[0]?.message ?? "Dados do erro de geração inválidos";
      throw new ErroGeracaoCobrancaInvalidoError(mensagem);
    }

    return resultado.data;
  }

  get clienteId(): string {
    return this._clienteId;
  }

  get nomeCliente(): string {
    return this._nomeCliente;
  }

  get mensagemErro(): string {
    return this._mensagemErro;
  }
}
