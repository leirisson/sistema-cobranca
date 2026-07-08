import type { Cobranca } from "../../../src/domain/cobranca/cobranca.js";
import type { CobrancaRepository } from "../../../src/domain/cobranca/cobranca-repository.js";

export class FakeCobrancaRepository implements CobrancaRepository {
  readonly cobrancas: Cobranca[] = [];

  async salvar(cobranca: Cobranca): Promise<void> {
    const indice = this.cobrancas.findIndex((c) => c.id === cobranca.id);

    if (indice >= 0) {
      this.cobrancas[indice] = cobranca;
    } else {
      this.cobrancas.push(cobranca);
    }
  }

  async buscarPorId(id: string): Promise<Cobranca | null> {
    return this.cobrancas.find((cobranca) => cobranca.id === id) ?? null;
  }

  async buscarPorGatewayChargeId(gatewayChargeId: string): Promise<Cobranca | null> {
    return this.cobrancas.find((cobranca) => cobranca.gatewayChargeId === gatewayChargeId) ?? null;
  }

  async existeParaCicloVigente(clienteId: string, vencimento: Date): Promise<boolean> {
    return this.cobrancas.some(
      (cobranca) =>
        cobranca.clienteId === clienteId &&
        cobranca.status !== "CANCELADO" &&
        cobranca.vencimento.getUTCFullYear() === vencimento.getUTCFullYear() &&
        cobranca.vencimento.getUTCMonth() === vencimento.getUTCMonth(),
    );
  }
}
