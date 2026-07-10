import type { FastifyInstance } from "fastify";

import { BuscarDetalheCobrancaUseCase } from "../../../application/cobranca/buscar-detalhe-cobranca-use-case.js";
import { BuscarErrosOperacionaisUseCase } from "../../../application/cobranca/buscar-erros-operacionais-use-case.js";
import { BuscarIndicadoresDashboardUseCase } from "../../../application/cobranca/buscar-indicadores-dashboard-use-case.js";
import { ListarCobrancasDashboardUseCase } from "../../../application/cobranca/listar-cobrancas-dashboard-use-case.js";
import type { StatusCobranca } from "../../../domain/cobranca/cobranca.js";
import { CobrancaInvalidaError } from "../../../domain/cobranca/cobranca-invalida-error.js";
import { CobrancaNaoEncontradaError } from "../../../domain/cobranca/cobranca-nao-encontrada-error.js";
import { MensagemInvalidaError } from "../../../domain/mensagem/mensagem-invalida-error.js";
import { MensagemNaoEncontradaError } from "../../../domain/mensagem/mensagem-nao-encontrada-error.js";
import { PrismaDashboardCobrancaQuery } from "../../database/prisma-dashboard-cobranca-query.js";
import { prisma } from "../../database/prisma-client.js";
import { criarCancelarCobrancaUseCase, criarReenviarMensagemUseCase } from "../../queue/use-cases-factory.js";
import { autenticar } from "../plugins/auth.js";

const STATUS_VALIDOS: StatusCobranca[] = ["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"];

interface DashboardQuerystring {
  status?: string;
  busca?: string;
  mes?: string;
  ano?: string;
  pagina?: string;
  itensPorPagina?: string;
}

interface ErrosQuerystring {
  paginaErros?: string;
  paginaMensagens?: string;
}

export async function dashboardRoutes(app: FastifyInstance) {
  const dashboardCobrancaQuery = new PrismaDashboardCobrancaQuery(prisma);
  const useCase = new ListarCobrancasDashboardUseCase(dashboardCobrancaQuery);
  const buscarDetalheUseCase = new BuscarDetalheCobrancaUseCase(dashboardCobrancaQuery);
  const buscarErrosOperacionaisUseCase = new BuscarErrosOperacionaisUseCase(dashboardCobrancaQuery);
  const buscarIndicadoresUseCase = new BuscarIndicadoresDashboardUseCase(dashboardCobrancaQuery);

  app.addHook("preHandler", autenticar);

  app.get<{ Querystring: DashboardQuerystring }>("/dashboard/cobrancas", async (request, reply) => {
    const { status, busca, mes, ano, pagina, itensPorPagina } = request.query;

    if (status && !STATUS_VALIDOS.includes(status as StatusCobranca)) {
      return reply.status(400).send({ error: "Status inválido" });
    }

    const resultado = await useCase.executar({
      status: status as StatusCobranca | undefined,
      busca,
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
      pagina: pagina ? Number(pagina) : undefined,
      itensPorPagina: itensPorPagina ? Number(itensPorPagina) : undefined,
    });

    return reply.status(200).send(resultado);
  });

  app.get<{ Querystring: Pick<DashboardQuerystring, "mes" | "ano"> }>(
    "/dashboard/indicadores",
    async (request, reply) => {
      const { mes, ano } = request.query;

      const resultado = await buscarIndicadoresUseCase.executar({
        mes: mes ? Number(mes) : undefined,
        ano: ano ? Number(ano) : undefined,
      });

      return reply.status(200).send(resultado);
    },
  );

  app.get<{ Querystring: ErrosQuerystring }>("/dashboard/erros", async (request, reply) => {
    const { paginaErros, paginaMensagens } = request.query;

    const resultado = await buscarErrosOperacionaisUseCase.executar({
      paginaErros: paginaErros ? Number(paginaErros) : undefined,
      paginaMensagens: paginaMensagens ? Number(paginaMensagens) : undefined,
    });

    return reply.status(200).send(resultado);
  });

  app.get<{ Params: { id: string } }>("/dashboard/cobrancas/:id", async (request, reply) => {
    const detalhe = await buscarDetalheUseCase.executar(request.params.id);

    if (!detalhe) {
      return reply.status(404).send({ error: "Cobrança não encontrada" });
    }

    return reply.status(200).send(detalhe);
  });

  app.patch<{ Params: { id: string } }>("/dashboard/cobrancas/:id/cancelar", async (request, reply) => {
    try {
      const cancelarCobrancaUseCase = await criarCancelarCobrancaUseCase();
      await cancelarCobrancaUseCase.executar(request.params.id);

      const detalhe = await buscarDetalheUseCase.executar(request.params.id);
      return reply.status(200).send(detalhe);
    } catch (error) {
      if (error instanceof CobrancaNaoEncontradaError) {
        return reply.status(404).send({ error: error.message });
      }

      if (error instanceof CobrancaInvalidaError) {
        return reply.status(400).send({ error: error.message });
      }

      throw error;
    }
  });

  app.post<{ Params: { id: string; mensagemId: string } }>(
    "/dashboard/cobrancas/:id/mensagens/:mensagemId/reenviar",
    async (request, reply) => {
      try {
        const reenviarMensagemUseCase = criarReenviarMensagemUseCase();
        await reenviarMensagemUseCase.executar(request.params.mensagemId);

        const detalhe = await buscarDetalheUseCase.executar(request.params.id);
        return reply.status(200).send(detalhe);
      } catch (error) {
        if (error instanceof MensagemNaoEncontradaError || error instanceof CobrancaNaoEncontradaError) {
          return reply.status(404).send({ error: error.message });
        }

        if (error instanceof MensagemInvalidaError || error instanceof CobrancaInvalidaError) {
          return reply.status(400).send({ error: error.message });
        }

        throw error;
      }
    },
  );
}
