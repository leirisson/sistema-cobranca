import { CredenciaisInvalidasError } from "../../domain/usuario/credenciais-invalidas-error.js";
import type { GeradorToken } from "../../domain/usuario/gerador-token.js";
import type { HasherSenha } from "../../domain/usuario/hasher-senha.js";
import type { UsuarioRepository } from "../../domain/usuario/usuario-repository.js";

export interface LoginInput {
  email: string;
  senha: string;
}

export interface LoginOutput {
  token: string;
}

export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly hasherSenha: HasherSenha,
    private readonly geradorToken: GeradorToken,
  ) {}

  async executar({ email, senha }: LoginInput): Promise<LoginOutput> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);

    if (!usuario) {
      throw new CredenciaisInvalidasError();
    }

    const senhaValida = await this.hasherSenha.comparar(senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new CredenciaisInvalidasError();
    }

    const token = this.geradorToken.gerar({ sub: usuario.id, email: usuario.email });

    return { token };
  }
}
