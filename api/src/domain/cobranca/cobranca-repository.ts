import type { Cobranca } from "./cobranca.js";

export interface CobrancaRepository {
  salvar(cobranca: Cobranca): Promise<void>;
  buscarPorId(id: string): Promise<Cobranca | null>;
  buscarPorGatewayChargeId(gatewayChargeId: string): Promise<Cobranca | null>;
  existeParaCicloVigente(clienteId: string, vencimento: Date): Promise<boolean>;
  listarPendentesOuAtrasadas(): Promise<Cobranca[]>;
  existePorClienteId(clienteId: string): Promise<boolean>;
}
