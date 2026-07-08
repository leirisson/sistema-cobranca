import { DomainError } from "../../shared/errors/domain-error.js";

export class ClienteNaoEncontradoError extends DomainError {
  constructor(id: string) {
    super(`Cliente ${id} não encontrado`);
  }
}
