import { CobrancaNaoEncontradaError } from "../../domain/cobranca/cobranca-nao-encontrada-error.js";
import type { CobrancaRepository } from "../../domain/cobranca/cobranca-repository.js";
import type { GatewayPagamento } from "../../domain/cobranca/gateway-pagamento.js";

export class CancelarCobrancaUseCase {
  constructor(
    private readonly cobrancaRepository: CobrancaRepository,
    private readonly gatewayPagamento: GatewayPagamento,
  ) {}

  async executar(id: string): Promise<void> {
    const cobranca = await this.cobrancaRepository.buscarPorId(id);

    if (!cobranca) {
      throw CobrancaNaoEncontradaError.porId(id);
    }

    cobranca.cancelar();

    try {
      await this.gatewayPagamento.cancelarCobranca(cobranca.gatewayChargeId);
    } catch {
      // Falha no gateway não bloqueia o cancelamento local (CANC-R-04, mesma filosofia da busca do PIX).
    }

    await this.cobrancaRepository.salvar(cobranca);
  }
}
