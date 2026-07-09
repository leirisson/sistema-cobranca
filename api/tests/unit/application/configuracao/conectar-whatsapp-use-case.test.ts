import { describe, expect, it } from "vitest";

import { ConectarWhatsappUseCase } from "../../../../src/application/configuracao/conectar-whatsapp-use-case.js";
import { FakeInstanciaWhatsappGateway } from "../../fakes/fake-instancia-whatsapp-gateway.js";

describe("ConectarWhatsappUseCase", () => {
  it("devolve o QR Code e status vindos do gateway", async () => {
    const gateway = new FakeInstanciaWhatsappGateway();
    gateway.resultadoConectar = { qrCodeBase64: "data:image/png;base64,xyz", status: "connecting" };
    const useCase = new ConectarWhatsappUseCase(gateway);

    const resultado = await useCase.executar();

    expect(resultado).toEqual({ qrCodeBase64: "data:image/png;base64,xyz", status: "connecting" });
  });
});
