import { DomainError } from "../../shared/errors/domain-error.js";

export class ClienteInativoError extends DomainError {
  constructor(clienteId: string) {
    super(`Cliente ${clienteId} está inativo, cobrança não pode ser gerada`);
  }
}
