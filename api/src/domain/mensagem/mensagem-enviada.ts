import { randomUUID } from "node:crypto";
import { z } from "zod";

import { MensagemInvalidaError } from "./mensagem-invalida-error.js";

export type TipoMensagem = "LEMBRETE" | "VENCIMENTO" | "ATRASO" | "CONFIRMACAO";
export type StatusEnvioMensagem = "ENVIADO" | "FALHA";
export type CanalNotificacaoTipo = "whatsapp" | "email";

const propsSchema = z.object({
  cobrancaId: z.string().trim().min(1, "cobrancaId não pode ser vazio"),
  tipo: z.enum(["LEMBRETE", "VENCIMENTO", "ATRASO", "CONFIRMACAO"]),
  statusEnvio: z.enum(["ENVIADO", "FALHA"]),
  canal: z.enum(["whatsapp", "email"]).default("whatsapp"),
});

export interface MensagemEnviadaProps {
  cobrancaId: string;
  tipo: TipoMensagem;
  statusEnvio: StatusEnvioMensagem;
  canal?: CanalNotificacaoTipo;
}

export interface MensagemEnviadaRestauracao extends MensagemEnviadaProps {
  id: string;
  canal: CanalNotificacaoTipo;
  enviadoEm: Date;
}

export class MensagemEnviada {
  readonly id: string;
  private readonly _cobrancaId: string;
  private readonly _tipo: TipoMensagem;
  private readonly _statusEnvio: StatusEnvioMensagem;
  private readonly _canal: CanalNotificacaoTipo;
  readonly enviadoEm: Date;

  private constructor(id: string, props: MensagemEnviadaProps & { canal: CanalNotificacaoTipo }, enviadoEm: Date) {
    this.id = id;
    this._cobrancaId = props.cobrancaId;
    this._tipo = props.tipo;
    this._statusEnvio = props.statusEnvio;
    this._canal = props.canal;
    this.enviadoEm = enviadoEm;
  }

  static criar(props: MensagemEnviadaProps): MensagemEnviada {
    const validado = MensagemEnviada.validar(props);

    return new MensagemEnviada(randomUUID(), validado, new Date());
  }

  static restaurar(props: MensagemEnviadaRestauracao): MensagemEnviada {
    return new MensagemEnviada(props.id, props, props.enviadoEm);
  }

  private static validar(props: MensagemEnviadaProps): MensagemEnviadaProps & { canal: CanalNotificacaoTipo } {
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

  get canal(): CanalNotificacaoTipo {
    return this._canal;
  }
}
