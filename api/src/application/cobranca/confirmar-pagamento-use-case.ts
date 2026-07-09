import { CobrancaNaoEncontradaError } from "../../domain/cobranca/cobranca-nao-encontrada-error.js";
import type { CobrancaRepository } from "../../domain/cobranca/cobranca-repository.js";
import type { NotificadorConfirmacao } from "../../domain/cobranca/notificador-confirmacao.js";

export interface ConfirmarPagamentoInput {
  gatewayChargeId: string;
  paidAt: Date;
}

export class ConfirmarPagamentoUseCase {
  constructor(
    private readonly cobrancaRepository: CobrancaRepository,
    private readonly notificadorConfirmacao: NotificadorConfirmacao,
    private readonly confirmacaoHabilitada: boolean,
  ) {}

  async executar(input: ConfirmarPagamentoInput): Promise<void> {
    const cobranca = await this.cobrancaRepository.buscarPorGatewayChargeId(input.gatewayChargeId);

    if (!cobranca) {
      throw CobrancaNaoEncontradaError.porGatewayChargeId(input.gatewayChargeId);
    }

    if (cobranca.status === "PAGO" || cobranca.status === "CANCELADO") {
      return;
    }

    cobranca.marcarComoPaga(input.paidAt);
    await this.cobrancaRepository.salvar(cobranca);

    if (this.confirmacaoHabilitada) {
      await this.notificadorConfirmacao.notificarPagamentoConfirmado(cobranca);
    }
  }
}
