import { describe, expect, it } from "vitest";

import { DesconectarWhatsappUseCase } from "../../../../src/application/configuracao/desconectar-whatsapp-use-case.js";
import { FakeInstanciaWhatsappGateway } from "../../fakes/fake-instancia-whatsapp-gateway.js";

describe("DesconectarWhatsappUseCase", () => {
  it("chama o gateway para desconectar a instância", async () => {
    const gateway = new FakeInstanciaWhatsappGateway();
    const useCase = new DesconectarWhatsappUseCase(gateway);

    await useCase.executar();

    expect(gateway.desconectarChamado).toBe(true);
  });
});
