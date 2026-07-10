import type { InstanciaWhatsappGateway } from "../../domain/configuracao/instancia-whatsapp-gateway.js";

export class DesconectarWhatsappUseCase {
  constructor(private readonly gateway: InstanciaWhatsappGateway) {}

  async executar(): Promise<void> {
    await this.gateway.desconectar();
  }
}
