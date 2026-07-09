import { beforeEach, describe, expect, it } from "vitest";

import { LoginUseCase } from "../../../../src/application/auth/login-use-case.js";
import { CredenciaisInvalidasError } from "../../../../src/domain/usuario/credenciais-invalidas-error.js";
import type { GeradorToken } from "../../../../src/domain/usuario/gerador-token.js";
import type { HasherSenha } from "../../../../src/domain/usuario/hasher-senha.js";
import { Usuario } from "../../../../src/domain/usuario/usuario.js";
import { FakeUsuarioRepository } from "../../fakes/fake-usuario-repository.js";

class FakeHasherSenha implements HasherSenha {
  async hash(senha: string): Promise<string> {
    return `hash(${senha})`;
  }

  async comparar(senha: string, hash: string): Promise<boolean> {
    return hash === `hash(${senha})`;
  }
}

class FakeGeradorToken implements GeradorToken {
  gerar(payload: { sub: string; email: string }): string {
    return `token(${payload.sub},${payload.email})`;
  }
}

describe("LoginUseCase", () => {
  let repository: FakeUsuarioRepository;
  let hasherSenha: FakeHasherSenha;
  let geradorToken: FakeGeradorToken;
  let useCase: LoginUseCase;

  beforeEach(() => {
    repository = new FakeUsuarioRepository();
    hasherSenha = new FakeHasherSenha();
    geradorToken = new FakeGeradorToken();
    useCase = new LoginUseCase(repository, hasherSenha, geradorToken);
  });

  it("devolve token para credenciais válidas (AUTH-03)", async () => {
    const senhaHash = await hasherSenha.hash("senha-correta");
    const usuario = Usuario.criar({ email: "usuario@example.com", senhaHash });
    repository.usuarios.push(usuario);

    const resultado = await useCase.executar({ email: "usuario@example.com", senha: "senha-correta" });

    expect(resultado.token).toBe(`token(${usuario.id},usuario@example.com)`);
  });

  it("lança CredenciaisInvalidasError para e-mail inexistente", async () => {
    await expect(useCase.executar({ email: "ausente@example.com", senha: "qualquer" })).rejects.toThrow(
      CredenciaisInvalidasError,
    );
  });

  it("lança CredenciaisInvalidasError para senha errada, sem diferenciar do e-mail inexistente", async () => {
    const senhaHash = await hasherSenha.hash("senha-correta");
    const usuario = Usuario.criar({ email: "usuario@example.com", senhaHash });
    repository.usuarios.push(usuario);

    await expect(useCase.executar({ email: "usuario@example.com", senha: "senha-errada" })).rejects.toThrow(
      CredenciaisInvalidasError,
    );
  });
});
