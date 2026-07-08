import { DomainError } from "../../shared/errors/domain-error.js";

export class CobrancaDuplicadaError extends DomainError {
  constructor(clienteId: string) {
    super(`Já existe cobrança gerada para o ciclo vigente do cliente ${clienteId}`);
  }
}
