import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EvolutionInstanceGateway } from "../../../../src/infra/gateways/evolution-instance-gateway.js";

function config() {
  return { baseUrl: "http://localhost:8080", apiKey: "test-key", instance: "cobracerta" };
}

describe("EvolutionInstanceGateway", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("conectar() devolve o QR Code em base64 quando a instância está desconectada", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          instance: { instanceName: "cobracerta", state: "connecting" },
          qrcode: { base64: "data:image/png;base64,abc123" },
        }),
        { status: 200 },
      ),
    );

    const gateway = new EvolutionInstanceGateway(config());
    const resultado = await gateway.conectar();

    expect(resultado.qrCodeBase64).toBe("data:image/png;base64,abc123");
    expect(resultado.status).toBe("connecting");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/instance/connect/cobracerta",
      expect.objectContaining({ headers: { apikey: "test-key" } }),
    );
  });

  it("conectar() devolve qrCodeBase64 null quando a instância já está conectada", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ instance: { instanceName: "cobracerta", state: "open" } }), { status: 200 }),
    );

    const gateway = new EvolutionInstanceGateway(config());
    const resultado = await gateway.conectar();

    expect(resultado.qrCodeBase64).toBeNull();
    expect(resultado.status).toBe("open");
  });

  it("conectar() lança erro quando a Evolution API responde com status não-ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 500 }));

    const gateway = new EvolutionInstanceGateway(config());

    await expect(gateway.conectar()).rejects.toThrow();
  });

  it("obterStatus() devolve o status ao vivo da instância", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ instance: { instanceName: "cobracerta", state: "open" } }), { status: 200 }),
    );

    const gateway = new EvolutionInstanceGateway(config());
    const resultado = await gateway.obterStatus();

    expect(resultado.status).toBe("open");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/instance/connectionState/cobracerta",
      expect.objectContaining({ headers: { apikey: "test-key" } }),
    );
  });

  it("obterStatus() lança erro quando a Evolution API responde com status não-ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 500 }));

    const gateway = new EvolutionInstanceGateway(config());

    await expect(gateway.obterStatus()).rejects.toThrow();
  });
});
