import type {
  ConectarWhatsappResultado,
  InstanciaWhatsappGateway,
  StatusWhatsappResultado,
} from "../../domain/configuracao/instancia-whatsapp-gateway.js";

export interface EvolutionInstanceGatewayConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

interface EvolutionInstanceStateResponse {
  instance?: { instanceName?: string; state?: string; status?: string };
  qrcode?: { base64?: string };
}

export class EvolutionInstanceGateway implements InstanciaWhatsappGateway {
  constructor(private readonly config: EvolutionInstanceGatewayConfig) {}

  async conectar(): Promise<ConectarWhatsappResultado> {
    const response = await fetch(`${this.config.baseUrl}/instance/connect/${this.config.instance}`, {
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new Error(`Evolution API retornou status ${response.status} ao conectar instância`);
    }

    const dados = (await response.json()) as EvolutionInstanceStateResponse;

    return {
      qrCodeBase64: dados.qrcode?.base64 ?? null,
      status: this.extrairStatus(dados),
    };
  }

  async obterStatus(): Promise<StatusWhatsappResultado> {
    const response = await fetch(`${this.config.baseUrl}/instance/connectionState/${this.config.instance}`, {
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new Error(`Evolution API retornou status ${response.status} ao consultar status da instância`);
    }

    const dados = (await response.json()) as EvolutionInstanceStateResponse;

    return { status: this.extrairStatus(dados) };
  }

  private extrairStatus(dados: EvolutionInstanceStateResponse): string {
    return dados.instance?.state ?? dados.instance?.status ?? "desconhecido";
  }

  private headers(): Record<string, string> {
    return { apikey: this.config.apiKey };
  }
}
