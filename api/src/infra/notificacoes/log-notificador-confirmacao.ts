import type { FastifyBaseLogger } from "fastify";

import type { Cobranca } from "../../domain/cobranca/cobranca.js";
import type { NotificadorConfirmacao } from "../../domain/cobranca/notificador-confirmacao.js";

export class LogNotificadorConfirmacao implements NotificadorConfirmacao {
  constructor(private readonly logger: FastifyBaseLogger) {}

  async notificarPagamentoConfirmado(cobranca: Cobranca): Promise<void> {
    this.logger.info(
      { cobrancaId: cobranca.id, clienteId: cobranca.clienteId },
      "Confirmação de pagamento pendente de disparo (módulo mensagens ainda não implementado)",
    );
  }
}
