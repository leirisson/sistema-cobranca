export interface CriarCobrancaGatewayInput {
  clienteId: string;
  valor: number;
  vencimento: Date;
  nomeCliente: string;
  documentoCliente: string;
  emailCliente?: string | null;
}

export interface CriarCobrancaGatewayOutput {
  gatewayChargeId: string;
  linkPagamento: string;
  pixCopiaECola: string | null;
}

export interface GatewayPagamento {
  criarCobranca(input: CriarCobrancaGatewayInput): Promise<CriarCobrancaGatewayOutput>;
}
