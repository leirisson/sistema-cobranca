import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/infra/http/app.js";
import { env } from "../../src/shared/config/env.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { JwtGeradorToken } from "../../src/infra/auth/jwt-gerador-token.js";

describe("Rotas /configuracoes", () => {
  let app: FastifyInstance;
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const token = geradorToken.gerar({ sub: "usuario-teste", email: "dono@cobracerta.com" });
  const authHeader = { authorization: `Bearer ${token}` };

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.configuracao.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("GET devolve defaults quando nunca foi configurado nada", async () => {
    const response = await app.inject({ method: "GET", url: "/configuracoes", headers: authHeader });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      asaasApiKeyConfigurada: false,
      asaasApiKeyUltimosDigitos: null,
      nomeRemetente: null,
      confirmacaoPagamentoHabilitada: false,
    });
  });

  it("nunca retorna a chave Asaas em texto plano em nenhuma resposta HTTP nem no banco", async () => {
    const chaveSecreta = "chave-secreta-de-teste-123456";

    const putResponse = await app.inject({
      method: "PUT",
      url: "/configuracoes",
      headers: authHeader,
      payload: { asaasApiKey: chaveSecreta },
    });

    expect(putResponse.statusCode).toBe(200);
    expect(JSON.stringify(putResponse.json())).not.toContain(chaveSecreta);

    const getResponse = await app.inject({ method: "GET", url: "/configuracoes", headers: authHeader });
    expect(JSON.stringify(getResponse.json())).not.toContain(chaveSecreta);

    const registro = await prisma.configuracao.findUnique({ where: { id: "default" } });
    expect(registro?.asaasApiKeyCifrada).not.toContain(chaveSecreta);
    expect(registro?.asaasApiKeyCifrada).not.toBe(chaveSecreta);

    expect(getResponse.json().asaasApiKeyConfigurada).toBe(true);
    expect(getResponse.json().asaasApiKeyUltimosDigitos).toBe("3456");
  });

  it("PUT parcial (só nomeRemetente) não apaga a chave Asaas já salva", async () => {
    await app.inject({
      method: "PUT",
      url: "/configuracoes",
      headers: authHeader,
      payload: { asaasApiKey: "chave-secreta-de-teste-123456" },
    });

    const response = await app.inject({
      method: "PUT",
      url: "/configuracoes",
      headers: authHeader,
      payload: { nomeRemetente: "Minha Empresa" },
    });

    expect(response.json().nomeRemetente).toBe("Minha Empresa");
    expect(response.json().asaasApiKeyConfigurada).toBe(true);
  });

  it("PUT com asaasApiKey vazia remove a chave salva", async () => {
    await app.inject({
      method: "PUT",
      url: "/configuracoes",
      headers: authHeader,
      payload: { asaasApiKey: "chave-secreta-de-teste-123456" },
    });

    const response = await app.inject({
      method: "PUT",
      url: "/configuracoes",
      headers: authHeader,
      payload: { asaasApiKey: "" },
    });

    expect(response.json().asaasApiKeyConfigurada).toBe(false);
  });

  it("GET sem token devolve 401", async () => {
    const response = await app.inject({ method: "GET", url: "/configuracoes" });

    expect(response.statusCode).toBe(401);
  });

  it("PUT sem token devolve 401", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/configuracoes",
      payload: { nomeRemetente: "Minha Empresa" },
    });

    expect(response.statusCode).toBe(401);
  });

  describe("integração com a Evolution API (fetch mockado)", () => {
    const fetchOriginal = global.fetch;

    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      global.fetch = fetchOriginal;
    });

    it("POST /configuracoes/whatsapp/conectar devolve o QR Code", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            instance: { instanceName: "cobracerta", state: "connecting" },
            qrcode: { base64: "data:image/png;base64,abc123" },
          }),
          { status: 200 },
        ),
      );

      const response = await app.inject({
        method: "POST",
        url: "/configuracoes/whatsapp/conectar",
        headers: authHeader,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ qrCodeBase64: "data:image/png;base64,abc123", status: "connecting" });
    });

    it("GET /configuracoes/whatsapp/status devolve o status ao vivo", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ instance: { instanceName: "cobracerta", state: "open" } }), { status: 200 }),
      );

      const response = await app.inject({
        method: "GET",
        url: "/configuracoes/whatsapp/status",
        headers: authHeader,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: "open" });
    });

    it("devolve 502 quando a Evolution API está indisponível", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 500 }));

      const response = await app.inject({
        method: "GET",
        url: "/configuracoes/whatsapp/status",
        headers: authHeader,
      });

      expect(response.statusCode).toBe(502);
    });
  });
});
