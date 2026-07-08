import { DomainError } from "../../shared/errors/domain-error.js";

export class CobrancaNaoEncontradaError extends DomainError {
  constructor(gatewayChargeId: string) {
    super(`Cobrança com gatewayChargeId ${gatewayChargeId} não encontrada`);
  }
}
