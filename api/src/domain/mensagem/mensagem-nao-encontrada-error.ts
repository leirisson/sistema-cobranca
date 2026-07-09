import { DomainError } from "../../shared/errors/domain-error.js";

export class MensagemNaoEncontradaError extends DomainError {
  constructor(id: string) {
    super(`Mensagem com id ${id} não encontrada`);
  }
}
