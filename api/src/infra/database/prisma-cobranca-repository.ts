import type { PrismaClient, Cobranca as CobrancaPrisma } from "@prisma/client";

import { Cobranca } from "../../domain/cobranca/cobranca.js";
import type { CobrancaRepository } from "../../domain/cobranca/cobranca-repository.js";

export class PrismaCobrancaRepository implements CobrancaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(cobranca: Cobranca): Promise<void> {
    await this.prisma.cobranca.upsert({
      where: { id: cobranca.id },
      create: {
        id: cobranca.id,
        clienteId: cobranca.clienteId,
        valor: cobranca.valor,
        vencimento: cobranca.vencimento,
        status: cobranca.status,
        gatewayChargeId: cobranca.gatewayChargeId,
        linkPagamento: cobranca.linkPagamento,
        paidAt: cobranca.paidAt,
        createdAt: cobranca.createdAt,
        updatedAt: cobranca.updatedAt,
      },
      update: {
        status: cobranca.status,
        paidAt: cobranca.paidAt,
        updatedAt: cobranca.updatedAt,
      },
    });
  }

  async buscarPorId(id: string): Promise<Cobranca | null> {
    const registro = await this.prisma.cobranca.findUnique({ where: { id } });

    return registro ? this.paraEntidade(registro) : null;
  }

  async buscarPorGatewayChargeId(gatewayChargeId: string): Promise<Cobranca | null> {
    const registro = await this.prisma.cobranca.findUnique({ where: { gatewayChargeId } });

    return registro ? this.paraEntidade(registro) : null;
  }

  async existeParaCicloVigente(clienteId: string, vencimento: Date): Promise<boolean> {
    const inicioDoMes = new Date(Date.UTC(vencimento.getUTCFullYear(), vencimento.getUTCMonth(), 1));
    const inicioDoProximoMes = new Date(Date.UTC(vencimento.getUTCFullYear(), vencimento.getUTCMonth() + 1, 1));

    const registro = await this.prisma.cobranca.findFirst({
      where: {
        clienteId,
        status: { not: "CANCELADO" },
        vencimento: { gte: inicioDoMes, lt: inicioDoProximoMes },
      },
    });

    return registro !== null;
  }

  async listarPendentesOuAtrasadas(): Promise<Cobranca[]> {
    const registros = await this.prisma.cobranca.findMany({
      where: { status: { in: ["PENDENTE", "ATRASADO"] } },
    });

    return registros.map((registro) => this.paraEntidade(registro));
  }

  private paraEntidade(registro: CobrancaPrisma): Cobranca {
    return Cobranca.restaurar({
      id: registro.id,
      clienteId: registro.clienteId,
      valor: registro.valor.toNumber(),
      vencimento: registro.vencimento,
      status: registro.status,
      gatewayChargeId: registro.gatewayChargeId ?? "",
      linkPagamento: registro.linkPagamento ?? "",
      paidAt: registro.paidAt,
      createdAt: registro.createdAt,
      updatedAt: registro.updatedAt,
    });
  }
}
