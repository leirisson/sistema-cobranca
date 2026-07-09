import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/infra/http/app.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { BcryptHasherSenha } from "../../src/infra/auth/bcrypt-hasher-senha.js";

describe("POST /auth/login", () => {
  let app: FastifyInstance;
  const hasherSenha = new BcryptHasherSenha();

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.usuario.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function criarUsuario(email: string, senha: string) {
    const senhaHash = await hasherSenha.hash(senha);
    await prisma.usuario.create({ data: { email, senhaHash } });
  }

  it("devolve 200 com token para credenciais válidas (AUTH-03)", async () => {
    await criarUsuario("dono@cobracerta.com", "senha-super-secreta");

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "dono@cobracerta.com", senha: "senha-super-secreta" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().token).toEqual(expect.any(String));
  });

  it("devolve 401 com mensagem genérica para senha errada", async () => {
    await criarUsuario("dono@cobracerta.com", "senha-super-secreta");

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "dono@cobracerta.com", senha: "senha-errada" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe("E-mail ou senha inválidos");
  });

  it("devolve 401 com a mesma mensagem genérica para e-mail inexistente", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "ausente@cobracerta.com", senha: "qualquer" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe("E-mail ou senha inválidos");
  });
});
