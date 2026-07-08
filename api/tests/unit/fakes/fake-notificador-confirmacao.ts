import type { Cobranca } from "../../../src/domain/cobranca/cobranca.js";
import type { NotificadorConfirmacao } from "../../../src/domain/cobranca/notificador-confirmacao.js";

export class FakeNotificadorConfirmacao implements NotificadorConfirmacao {
  chamadas: Cobranca[] = [];

  async notificarPagamentoConfirmado(cobranca: Cobranca): Promise<void> {
    this.chamadas.push(cobranca);
  }
}
