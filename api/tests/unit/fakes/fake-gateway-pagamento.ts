import type {
  CriarCobrancaGatewayInput,
  CriarCobrancaGatewayOutput,
  GatewayPagamento,
} from "../../../src/domain/cobranca/gateway-pagamento.js";

export class FakeGatewayPagamento implements GatewayPagamento {
  chamadas: CriarCobrancaGatewayInput[] = [];
  deveFalhar = false;

  async criarCobranca(input: CriarCobrancaGatewayInput): Promise<CriarCobrancaGatewayOutput> {
    this.chamadas.push(input);

    if (this.deveFalhar) {
      throw new Error("Falha ao criar cobrança no gateway de pagamento");
    }

    const id = `asaas_${this.chamadas.length}`;

    return {
      gatewayChargeId: id,
      linkPagamento: `https://sandbox.asaas.com/i/${id}`,
      pixCopiaECola: `00020126...${id}`,
    };
  }
}
