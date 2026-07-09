import type {
  ConectarWhatsappResultado,
  InstanciaWhatsappGateway,
  StatusWhatsappResultado,
} from "../../../src/domain/configuracao/instancia-whatsapp-gateway.js";

export class FakeInstanciaWhatsappGateway implements InstanciaWhatsappGateway {
  resultadoConectar: ConectarWhatsappResultado = { qrCodeBase64: "data:image/png;base64,abc", status: "connecting" };
  resultadoStatus: StatusWhatsappResultado = { status: "connecting" };

  async conectar(): Promise<ConectarWhatsappResultado> {
    return this.resultadoConectar;
  }

  async obterStatus(): Promise<StatusWhatsappResultado> {
    return this.resultadoStatus;
  }
}
