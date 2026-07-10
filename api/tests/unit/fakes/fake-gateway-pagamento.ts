import type {
  CriarCobrancaGatewayInput,
  CriarCobrancaGatewayOutput,
  GatewayPagamento,
} from "../../../src/domain/cobranca/gateway-pagamento.js";

export class FakeGatewayPagamento implements GatewayPagamento {
  chamadas: CriarCobrancaGatewayInput[] = [];
  cancelamentos: string[] = [];
  deveFalhar = false;
  deveFalharPara: Set<string> = new Set();
  deveFalharAoCancelar = false;

  async criarCobranca(input: CriarCobrancaGatewayInput): Promise<CriarCobrancaGatewayOutput> {
    this.chamadas.push(input);

    if (this.deveFalhar || this.deveFalharPara.has(input.clienteId)) {
      throw new Error("Falha ao criar cobrança no gateway de pagamento");
    }

    const id = `asaas_${this.chamadas.length}`;

    return {
      gatewayChargeId: id,
      linkPagamento: `https://sandbox.asaas.com/i/${id}`,
      pixCopiaECola: `00020126...${id}`,
    };
  }

  async cancelarCobranca(gatewayChargeId: string): Promise<void> {
    this.cancelamentos.push(gatewayChargeId);

    if (this.deveFalharAoCancelar) {
      throw new Error("Falha ao cancelar cobrança no gateway de pagamento");
    }
  }
}
