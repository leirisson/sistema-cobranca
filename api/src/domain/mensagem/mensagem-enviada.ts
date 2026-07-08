import { randomUUID } from "node:crypto";
import { z } from "zod";

import { MensagemInvalidaError } from "./mensagem-invalida-error.js";

export type TipoMensagem = "LEMBRETE" | "VENCIMENTO" | "ATRASO" | "CONFIRMACAO";
export type StatusEnvioMensagem = "ENVIADO" | "FALHA";

const propsSchema = z.object({
  cobrancaId: z.string().trim().min(1, "cobrancaId não pode ser vazio"),
  tipo: z.enum(["LEMBRETE", "VENCIMENTO", "ATRASO", "CONFIRMACAO"]),
  statusEnvio: z.enum(["ENVIADO", "FALHA"]),
});

export interface MensagemEnviadaProps {
  cobrancaId: string;
  tipo: TipoMensagem;
  statusEnvio: StatusEnvioMensagem;
}

export interface MensagemEnviadaRestauracao extends MensagemEnviadaProps {
  id: string;
  enviadoEm: Date;
}

export class MensagemEnviada {
  readonly id: string;
  private readonly _cobrancaId: string;
  private readonly _tipo: TipoMensagem;
  private readonly _statusEnvio: StatusEnvioMensagem;
  readonly enviadoEm: Date;

  private constructor(id: string, props: MensagemEnviadaProps, enviadoEm: Date) {
    this.id = id;
    this._cobrancaId = props.cobrancaId;
    this._tipo = props.tipo;
    this._statusEnvio = props.statusEnvio;
    this.enviadoEm = enviadoEm;
  }

  static criar(props: MensagemEnviadaProps): MensagemEnviada {
    const validado = MensagemEnviada.validar(props);

    return new MensagemEnviada(randomUUID(), validado, new Date());
  }

  static restaurar(props: MensagemEnviadaRestauracao): MensagemEnviada {
    return new MensagemEnviada(props.id, props, props.enviadoEm);
  }

  private static validar(props: MensagemEnviadaProps): MensagemEnviadaProps {
    const resultado = propsSchema.safeParse(props);

    if (!resultado.success) {
      const mensagem = resultado.error.issues[0]?.message ?? "Dados da mensagem inválidos";
      throw new MensagemInvalidaError(mensagem);
    }

    return resultado.data;
  }

  get cobrancaId(): string {
    return this._cobrancaId;
  }

  get tipo(): TipoMensagem {
    return this._tipo;
  }

  get statusEnvio(): StatusEnvioMensagem {
    return this._statusEnvio;
  }
}
