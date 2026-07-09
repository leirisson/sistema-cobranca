import { DomainError } from "../../shared/errors/domain-error.js";

export class CredenciaisInvalidasError extends DomainError {
  constructor() {
    super("E-mail ou senha inválidos");
  }
}
