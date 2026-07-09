import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  CobrancaDashboardItem,
  DashboardCobrancaQuery,
  FiltroDashboardCobranca,
  TotaisDashboard,
} from "../../domain/cobranca/dashboard-cobranca-query.js";

export class PrismaDashboardCobrancaQuery implements DashboardCobrancaQuery {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(filtro: FiltroDashboardCobranca): Promise<CobrancaDashboardItem[]> {
    const registros = await this.prisma.cobranca.findMany({
      where: this.montarWhere(filtro),
      include: { cliente: { select: { nome: true } } },
      orderBy: { vencimento: "asc" },
    });

    return registros.map((registro) => ({
      id: registro.id,
      nomeCliente: registro.cliente.nome,
      valor: registro.valor.toNumber(),
      vencimento: registro.vencimento,
      status: registro.status,
    }));
  }

  async calcularTotais(filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">): Promise<TotaisDashboard> {
    const { inicio, fim } = this.intervaloDoMes(filtro.mes, filtro.ano);

    const agregados = await this.prisma.cobranca.groupBy({
      by: ["status"],
      where: { vencimento: { gte: inicio, lt: fim } },
      _sum: { valor: true },
    });

    const somaPorStatus = (status: string) =>
      agregados.find((agregado) => agregado.status === status)?._sum.valor?.toNumber() ?? 0;

    return {
      totalAReceber: somaPorStatus("PENDENTE") + somaPorStatus("ATRASADO"),
      totalRecebido: somaPorStatus("PAGO"),
      totalEmAtraso: somaPorStatus("ATRASADO"),
    };
  }

  private montarWhere(filtro: FiltroDashboardCobranca): Prisma.CobrancaWhereInput {
    const { inicio, fim } = this.intervaloDoMes(filtro.mes, filtro.ano);

    return {
      vencimento: { gte: inicio, lt: fim },
      ...(filtro.status ? { status: filtro.status } : {}),
      ...(filtro.busca
        ? { cliente: { nome: { contains: filtro.busca, mode: "insensitive" } } }
        : {}),
    };
  }

  private intervaloDoMes(mes: number, ano: number): { inicio: Date; fim: Date } {
    return {
      inicio: new Date(Date.UTC(ano, mes - 1, 1)),
      fim: new Date(Date.UTC(ano, mes, 1)),
    };
  }
}
