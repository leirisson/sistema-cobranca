import type {
  CriarCobrancaGatewayInput,
  CriarCobrancaGatewayOutput,
  GatewayPagamento,
} from "../../domain/cobranca/gateway-pagamento.js";

export interface AsaasGatewayConfig {
  baseUrl: string;
  apiKey: string;
}

interface AsaasCustomer {
  id: string;
}

interface AsaasCustomerListResponse {
  data: AsaasCustomer[];
}

interface AsaasPaymentResponse {
  id: string;
  invoiceUrl: string;
}

interface AsaasPixQrCodeResponse {
  payload: string;
}

export class AsaasGateway implements GatewayPagamento {
  constructor(private readonly config: AsaasGatewayConfig) {}

  async criarCobranca(input: CriarCobrancaGatewayInput): Promise<CriarCobrancaGatewayOutput> {
    const customerId = await this.buscarOuCriarCustomer(input);

    const response = await fetch(`${this.config.baseUrl}/payments`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value: input.valor,
        dueDate: this.formatarData(input.vencimento),
      }),
    });

    if (!response.ok) {
      throw new Error(`Asaas retornou status ${response.status} ao criar cobrança`);
    }

    const payment = (await response.json()) as AsaasPaymentResponse;
    const pixCopiaECola = await this.buscarPixCopiaECola(payment.id);

    return {
      gatewayChargeId: payment.id,
      linkPagamento: payment.invoiceUrl,
      pixCopiaECola,
    };
  }

  private async buscarPixCopiaECola(paymentId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/payments/${paymentId}/pixQrCode`, {
        headers: this.headers(),
      });

      if (!response.ok) {
        return null;
      }

      const pix = (await response.json()) as AsaasPixQrCodeResponse;

      return pix.payload;
    } catch {
      return null;
    }
  }

  private async buscarOuCriarCustomer(input: CriarCobrancaGatewayInput): Promise<string> {
    const buscaResponse = await fetch(
      `${this.config.baseUrl}/customers?cpfCnpj=${input.documentoCliente}`,
      { headers: this.headers() },
    );

    if (!buscaResponse.ok) {
      throw new Error(`Asaas retornou status ${buscaResponse.status} ao buscar customer`);
    }

    const busca = (await buscaResponse.json()) as AsaasCustomerListResponse;

    if (busca.data.length > 0) {
      return busca.data[0]!.id;
    }

    const criacaoResponse = await fetch(`${this.config.baseUrl}/customers`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        name: input.nomeCliente,
        cpfCnpj: input.documentoCliente,
        email: input.emailCliente ?? undefined,
      }),
    });

    if (!criacaoResponse.ok) {
      throw new Error(`Asaas retornou status ${criacaoResponse.status} ao criar customer`);
    }

    const customer = (await criacaoResponse.json()) as AsaasCustomer;

    return customer.id;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      access_token: this.config.apiKey,
    };
  }

  private formatarData(data: Date): string {
    return data.toISOString().slice(0, 10);
  }
}
