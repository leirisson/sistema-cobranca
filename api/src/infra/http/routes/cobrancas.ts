import type { FastifyInstance } from "fastify";

import { ClienteInvalidoError } from "../../../domain/cliente/cliente-invalido-error.js";
import { ClienteNaoEncontradoError } from "../../../domain/cliente/cliente-nao-encontrado-error.js";
import { CobrancaInvalidaError } from "../../../domain/cobranca/cobranca-invalida-error.js";
import { criarCriarCobrancaManualUseCase, criarDispararLembreteInicialUseCase } from "../../queue/use-cases-factory.js";
import { autenticar } from "../plugins/auth.js";

interface CriarCobrancaManualBody {
  clienteId: string;
  valor: number;
  vencimento: string;
  descricao?: string | null;
}

export async function cobrancasRoutes(app: FastifyInstance) {
  const dispararLembreteInicialUseCase = criarDispararLembreteInicialUseCase();

  app.addHook("preHandler", autenticar);

  app.post<{ Body: CriarCobrancaManualBody }>("/cobrancas", async (request, reply) => {
    try {
      const criarCobrancaManualUseCase = await criarCriarCobrancaManualUseCase();
      const cobranca = await criarCobrancaManualUseCase.executar({
        clienteId: request.body.clienteId,
        valor: request.body.valor,
        vencimento: new Date(request.body.vencimento),
        descricao: request.body.descricao,
      });

      dispararLembreteInicialUseCase.executar(cobranca).catch((error) => {
        app.log.error({ err: error, cobrancaId: cobranca.id }, "Falha ao disparar lembrete de cobrança avulsa");
      });

      return reply.status(201).send({
        id: cobranca.id,
        status: cobranca.status,
        origem: cobranca.origem,
        descricao: cobranca.descricao,
        linkPagamento: cobranca.linkPagamento,
        pixCopiaECola: cobranca.pixCopiaECola,
      });
    } catch (error) {
      if (error instanceof ClienteNaoEncontradoError) {
        return reply.status(404).send({ error: error.message });
      }

      if (error instanceof ClienteInvalidoError || error instanceof CobrancaInvalidaError) {
        return reply.status(400).send({ error: error.message });
      }

      throw error;
    }
  });
}
