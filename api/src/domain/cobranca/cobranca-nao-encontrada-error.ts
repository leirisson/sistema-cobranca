import { DomainError } from "../../shared/errors/domain-error.js";

export class CobrancaNaoEncontradaError extends DomainError {
  constructor(identificador: string) {
    super(`Cobrança ${identificador} não encontrada`);
  }

  static porId(id: string): CobrancaNaoEncontradaError {
    return new CobrancaNaoEncontradaError(`com id ${id}`);
  }

  static porGatewayChargeId(gatewayChargeId: string): CobrancaNaoEncontradaError {
    return new CobrancaNaoEncontradaError(`com gatewayChargeId ${gatewayChargeId}`);
  }
}
