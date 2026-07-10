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
  base64?: string;
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
    const qrCodeBase64 = dados.qrcode?.base64 ?? dados.base64 ?? null;

    return {
      qrCodeBase64,
      status: dados.instance?.state ?? dados.instance?.status ?? (qrCodeBase64 ? "connecting" : "desconhecido"),
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

  async desconectar(): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/instance/logout/${this.config.instance}`, {
      method: "DELETE",
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new Error(`Evolution API retornou status ${response.status} ao desconectar instância`);
    }
  }

  private extrairStatus(dados: EvolutionInstanceStateResponse): string {
    return dados.instance?.state ?? dados.instance?.status ?? "desconhecido";
  }

  private headers(): Record<string, string> {
    return { apikey: this.config.apiKey };
  }
}
