import type { FastifyInstance } from "fastify";

import { BuscarDetalheCobrancaUseCase } from "../../../application/cobranca/buscar-detalhe-cobranca-use-case.js";
import { ListarCobrancasDashboardUseCase } from "../../../application/cobranca/listar-cobrancas-dashboard-use-case.js";
import type { StatusCobranca } from "../../../domain/cobranca/cobranca.js";
import { PrismaDashboardCobrancaQuery } from "../../database/prisma-dashboard-cobranca-query.js";
import { prisma } from "../../database/prisma-client.js";
import { autenticar } from "../plugins/auth.js";

const STATUS_VALIDOS: StatusCobranca[] = ["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"];

interface DashboardQuerystring {
  status?: string;
  busca?: string;
  mes?: string;
  ano?: string;
}

export async function dashboardRoutes(app: FastifyInstance) {
  const dashboardCobrancaQuery = new PrismaDashboardCobrancaQuery(prisma);
  const useCase = new ListarCobrancasDashboardUseCase(dashboardCobrancaQuery);
  const buscarDetalheUseCase = new BuscarDetalheCobrancaUseCase(dashboardCobrancaQuery);

  app.addHook("preHandler", autenticar);

  app.get<{ Querystring: DashboardQuerystring }>("/dashboard/cobrancas", async (request, reply) => {
    const { status, busca, mes, ano } = request.query;

    if (status && !STATUS_VALIDOS.includes(status as StatusCobranca)) {
      return reply.status(400).send({ error: "Status inválido" });
    }

    const resultado = await useCase.executar({
      status: status as StatusCobranca | undefined,
      busca,
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
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
}
