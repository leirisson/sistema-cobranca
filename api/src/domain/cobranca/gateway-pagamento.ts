export interface CriarCobrancaGatewayInput {
  clienteId: string;
  valor: number;
  vencimento: Date;
}

export interface CriarCobrancaGatewayOutput {
  gatewayChargeId: string;
  linkPagamento: string;
}

export interface GatewayPagamento {
  criarCobranca(input: CriarCobrancaGatewayInput): Promise<CriarCobrancaGatewayOutput>;
}
