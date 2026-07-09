export interface ConectarWhatsappResultado {
  qrCodeBase64: string | null;
  status: string;
}

export interface StatusWhatsappResultado {
  status: string;
}

export interface InstanciaWhatsappGateway {
  conectar(): Promise<ConectarWhatsappResultado>;
  obterStatus(): Promise<StatusWhatsappResultado>;
}
