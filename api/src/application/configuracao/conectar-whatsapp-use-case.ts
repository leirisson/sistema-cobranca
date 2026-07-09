import type {
  ConectarWhatsappResultado,
  InstanciaWhatsappGateway,
} from "../../domain/configuracao/instancia-whatsapp-gateway.js";

export class ConectarWhatsappUseCase {
  constructor(private readonly gateway: InstanciaWhatsappGateway) {}

  async executar(): Promise<ConectarWhatsappResultado> {
    return this.gateway.conectar();
  }
}
