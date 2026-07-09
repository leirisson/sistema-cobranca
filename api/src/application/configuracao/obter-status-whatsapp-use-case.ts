import type {
  InstanciaWhatsappGateway,
  StatusWhatsappResultado,
} from "../../domain/configuracao/instancia-whatsapp-gateway.js";

export class ObterStatusWhatsappUseCase {
  constructor(private readonly gateway: InstanciaWhatsappGateway) {}

  async executar(): Promise<StatusWhatsappResultado> {
    return this.gateway.obterStatus();
  }
}
