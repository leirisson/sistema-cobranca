import type { Cobranca } from "./cobranca.js";

export interface NotificadorConfirmacao {
  notificarPagamentoConfirmado(cobranca: Cobranca): Promise<void>;
}
