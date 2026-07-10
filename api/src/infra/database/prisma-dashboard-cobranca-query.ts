import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  CobrancaDashboardDetalhe,
  CobrancaDashboardItem,
  DashboardCobrancaQuery,
  ErroGeracaoCobrancaDashboardItem,
  FiltroDashboardCobranca,
  IndicadoresDashboard,
  MensagemComFalhaDashboardItem,
  PaginacaoInput,
  ResultadoPaginado,
  TotaisDashboard,
} from "../../domain/cobranca/dashboard-cobranca-query.js";

export class PrismaDashboardCobrancaQuery implements DashboardCobrancaQuery {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(
    filtro: FiltroDashboardCobranca,
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<CobrancaDashboardItem>> {
    const where = this.montarWhere(filtro);

    const [registros, totalItens] = await Promise.all([
      this.prisma.cobranca.findMany({
        where,
        include: { cliente: { select: { nome: true } } },
        orderBy: { vencimento: "asc" },
        skip: (paginacao.pagina - 1) * paginacao.itensPorPagina,
        take: paginacao.itensPorPagina,
      }),
      this.prisma.cobranca.count({ where }),
    ]);

    return {
      itens: registros.map((registro) => ({
        id: registro.id,
        nomeCliente: registro.cliente.nome,
        valor: registro.valor.toNumber(),
        vencimento: registro.vencimento,
        status: registro.status,
        origem: registro.origem,
      })),
      paginaAtual: paginacao.pagina,
      totalPaginas: Math.max(1, Math.ceil(totalItens / paginacao.itensPorPagina)),
      totalItens,
    };
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

  async calcularIndicadores(
    filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">,
    referencia: Date,
  ): Promise<IndicadoresDashboard> {
    const { inicio, fim } = this.intervaloDoMes(filtro.mes, filtro.ano);

    const [agregadosPorStatus, agregadoGeral, agregadoAvulsas, proximosVencimentos] = await Promise.all([
      this.prisma.cobranca.groupBy({
        by: ["status"],
        where: { vencimento: { gte: inicio, lt: fim } },
        _count: { _all: true },
      }),
      this.prisma.cobranca.aggregate({
        where: { vencimento: { gte: inicio, lt: fim }, status: { not: "CANCELADO" } },
        _count: { _all: true },
        _sum: { valor: true },
      }),
      this.prisma.cobranca.count({
        where: { vencimento: { gte: inicio, lt: fim }, origem: "AVULSA", status: { not: "CANCELADO" } },
      }),
      this.prisma.cobranca.aggregate({
        where: {
          status: "PENDENTE",
          vencimento: { gte: referencia, lte: new Date(referencia.getTime() + 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { _all: true },
        _sum: { valor: true },
      }),
    ]);

    const contagemPorStatus = (status: string) =>
      agregadosPorStatus.find((agregado) => agregado.status === status)?._count._all ?? 0;

    const totalGeradas = agregadoGeral._count._all;
    const somaValor = agregadoGeral._sum.valor?.toNumber() ?? 0;

    return {
      totalGeradas,
      totalPagas: contagemPorStatus("PAGO"),
      totalAtrasadas: contagemPorStatus("ATRASADO"),
      ticketMedio: totalGeradas > 0 ? somaValor / totalGeradas : 0,
      totalAvulsas: agregadoAvulsas,
      proximosVencimentos: {
        quantidade: proximosVencimentos._count._all,
        valorTotal: proximosVencimentos._sum.valor?.toNumber() ?? 0,
      },
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

  async listarErrosGeracaoCobranca(
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<ErroGeracaoCobrancaDashboardItem>> {
    const [registros, totalItens] = await Promise.all([
      this.prisma.erroGeracaoCobranca.findMany({
        orderBy: { ocorridoEm: "desc" },
        skip: (paginacao.pagina - 1) * paginacao.itensPorPagina,
        take: paginacao.itensPorPagina,
      }),
      this.prisma.erroGeracaoCobranca.count(),
    ]);

    return {
      itens: registros.map((registro) => ({
        id: registro.id,
        clienteId: registro.clienteId,
        nomeCliente: registro.nomeCliente,
        mensagemErro: registro.mensagemErro,
        ocorridoEm: registro.ocorridoEm,
      })),
      paginaAtual: paginacao.pagina,
      totalPaginas: Math.max(1, Math.ceil(totalItens / paginacao.itensPorPagina)),
      totalItens,
    };
  }

  async listarMensagensComFalha(
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<MensagemComFalhaDashboardItem>> {
    const where = { statusEnvio: "FALHA" as const };

    const [registros, totalItens] = await Promise.all([
      this.prisma.mensagemEnviada.findMany({
        where,
        include: { cobranca: { include: { cliente: { select: { nome: true } } } } },
        orderBy: { enviadoEm: "desc" },
        skip: (paginacao.pagina - 1) * paginacao.itensPorPagina,
        take: paginacao.itensPorPagina,
      }),
      this.prisma.mensagemEnviada.count({ where }),
    ]);

    return {
      itens: registros.map((registro) => ({
        id: registro.id,
        cobrancaId: registro.cobrancaId,
        nomeCliente: registro.cobranca.cliente.nome,
        tipo: registro.tipo,
        canal: registro.canal,
        enviadoEm: registro.enviadoEm,
      })),
      paginaAtual: paginacao.pagina,
      totalPaginas: Math.max(1, Math.ceil(totalItens / paginacao.itensPorPagina)),
      totalItens,
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
