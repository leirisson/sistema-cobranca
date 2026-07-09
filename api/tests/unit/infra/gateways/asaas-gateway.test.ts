import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AsaasGateway } from "../../../../src/infra/gateways/asaas-gateway.js";

const CONFIG = {
  baseUrl: "https://sandbox.asaas.com/api/v3",
  apiKey: "asaas-api-key",
};

const INPUT_BASE = {
  clienteId: "cliente-1",
  valor: 150,
  vencimento: new Date("2026-08-10T00:00:00Z"),
  nomeCliente: "Maria Silva",
  documentoCliente: "12345678900",
  emailCliente: "maria@example.com",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("AsaasGateway", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reaproveita customer existente (buscado por cpfCnpj), cria a cobrança e busca o PIX (COB-03)", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: "cus_existente" }] }))
      .mockResolvedValueOnce(
        jsonResponse(200, { id: "pay_123", invoiceUrl: "https://sandbox.asaas.com/i/pay_123" }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, payload: "00020126...pix_123" }));

    const gateway = new AsaasGateway(CONFIG);
    const resultado = await gateway.criarCobranca(INPUT_BASE);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]![0]).toContain("/customers?cpfCnpj=12345678900");
    expect(fetchMock.mock.calls[1]![0]).toBe(`${CONFIG.baseUrl}/payments`);
    const payloadCobranca = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);
    expect(payloadCobranca).toMatchObject({ customer: "cus_existente", value: 150, dueDate: "2026-08-10" });
    expect(fetchMock.mock.calls[2]![0]).toBe(`${CONFIG.baseUrl}/payments/pay_123/pixQrCode`);
    expect(resultado).toEqual({
      gatewayChargeId: "pay_123",
      linkPagamento: "https://sandbox.asaas.com/i/pay_123",
      pixCopiaECola: "00020126...pix_123",
    });
  });

  it("cria customer novo quando não encontra por cpfCnpj", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }))
      .mockResolvedValueOnce(jsonResponse(200, { id: "cus_novo" }))
      .mockResolvedValueOnce(
        jsonResponse(200, { id: "pay_456", invoiceUrl: "https://sandbox.asaas.com/i/pay_456" }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, payload: "00020126...pix_456" }));

    const gateway = new AsaasGateway(CONFIG);
    const resultado = await gateway.criarCobranca(INPUT_BASE);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[1]![0]).toBe(`${CONFIG.baseUrl}/customers`);
    const payloadCustomer = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);
    expect(payloadCustomer).toMatchObject({
      name: "Maria Silva",
      cpfCnpj: "12345678900",
      email: "maria@example.com",
    });
    expect(resultado.gatewayChargeId).toBe("pay_456");
    expect(resultado.pixCopiaECola).toBe("00020126...pix_456");
  });

  it("lança erro quando a busca de customer falha", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response("erro", { status: 500 }));

    const gateway = new AsaasGateway(CONFIG);

    await expect(gateway.criarCobranca(INPUT_BASE)).rejects.toThrow();
  });

  it("lança erro quando a criação da cobrança falha", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: "cus_existente" }] }))
      .mockResolvedValueOnce(new Response("erro", { status: 400 }));

    const gateway = new AsaasGateway(CONFIG);

    await expect(gateway.criarCobranca(INPUT_BASE)).rejects.toThrow();
  });

  it("devolve pixCopiaECola null quando a busca do PIX falha, sem quebrar a criação da cobrança", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: "cus_existente" }] }))
      .mockResolvedValueOnce(
        jsonResponse(200, { id: "pay_789", invoiceUrl: "https://sandbox.asaas.com/i/pay_789" }),
      )
      .mockResolvedValueOnce(new Response("erro", { status: 400 }));

    const gateway = new AsaasGateway(CONFIG);
    const resultado = await gateway.criarCobranca(INPUT_BASE);

    expect(resultado).toEqual({
      gatewayChargeId: "pay_789",
      linkPagamento: "https://sandbox.asaas.com/i/pay_789",
      pixCopiaECola: null,
    });
  });

  it("envia apikey no header access_token em todas as chamadas", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: "cus_existente" }] }))
      .mockResolvedValueOnce(jsonResponse(200, { id: "pay_1", invoiceUrl: "https://x" }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, payload: "pix" }));

    const gateway = new AsaasGateway(CONFIG);
    await gateway.criarCobranca(INPUT_BASE);

    for (const call of fetchMock.mock.calls) {
      const headers = call[1]!.headers as Record<string, string>;
      expect(headers.access_token).toBe(CONFIG.apiKey);
    }
  });
});
