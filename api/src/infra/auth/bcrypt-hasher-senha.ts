import bcrypt from "bcryptjs";

import type { HasherSenha } from "../../domain/usuario/hasher-senha.js";

const SALT_ROUNDS = 10;

export class BcryptHasherSenha implements HasherSenha {
  async hash(senha: string): Promise<string> {
    return bcrypt.hash(senha, SALT_ROUNDS);
  }

  async comparar(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }
}
