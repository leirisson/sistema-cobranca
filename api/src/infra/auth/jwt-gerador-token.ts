import jwt from "jsonwebtoken";

import type { GeradorToken } from "../../domain/usuario/gerador-token.js";

export interface JwtGeradorTokenConfig {
  secret: string;
  expiresIn: string;
}

export class JwtGeradorToken implements GeradorToken {
  constructor(private readonly config: JwtGeradorTokenConfig) {}

  gerar(payload: { sub: string; email: string }): string {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn,
    } as jwt.SignOptions);
  }
}
