import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  CobrancaDashboardDetalhe,
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
      origem: registro.origem,
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

  async buscarDetalhe(id: string): Promise<CobrancaDashboardDetalhe | null> {
    const registro = await this.prisma.cobranca.findUnique({
      where: { id },
      include: {
        cliente: { select: { nome: true } },
        mensagensEnviadas: { orderBy: { enviadoEm: "desc" } },
      },
    });

    if (!registro) {
      return null;
    }

    return {
      id: registro.id,
      nomeCliente: registro.cliente.nome,
      valor: registro.valor.toNumber(),
      vencimento: registro.vencimento,
      status: registro.status,
      linkPagamento: registro.linkPagamento,
      pixCopiaECola: registro.pixCopiaECola,
      origem: registro.origem,
      descricao: registro.descricao,
      mensagens: registro.mensagensEnviadas.map((mensagem) => ({
        id: mensagem.id,
        tipo: mensagem.tipo,
        canal: mensagem.canal,
        statusEnvio: mensagem.statusEnvio as "ENVIADO" | "FALHA",
        enviadoEm: mensagem.enviadoEm,
      })),
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
