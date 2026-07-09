import { describe, expect, it } from "vitest";

import { ObterStatusWhatsappUseCase } from "../../../../src/application/configuracao/obter-status-whatsapp-use-case.js";
import { FakeInstanciaWhatsappGateway } from "../../fakes/fake-instancia-whatsapp-gateway.js";

describe("ObterStatusWhatsappUseCase", () => {
  it("devolve o status vindo do gateway", async () => {
    const gateway = new FakeInstanciaWhatsappGateway();
    gateway.resultadoStatus = { status: "open" };
    const useCase = new ObterStatusWhatsappUseCase(gateway);

    const resultado = await useCase.executar();

    expect(resultado).toEqual({ status: "open" });
  });
});
