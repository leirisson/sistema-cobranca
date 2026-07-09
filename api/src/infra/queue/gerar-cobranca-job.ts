import { Queue, Worker, type Job } from "bullmq";

import type { FastifyBaseLogger } from "fastify";

import { redisConnection } from "./redis-connection.js";
import {
  criarDispararLembreteInicialUseCase,
  criarGerarCobrancaUseCase,
} from "./use-cases-factory.js";

export const GERAR_COBRANCA_QUEUE_NAME = "gerar-cobranca";
const CRON_DIARIO_08H = "0 8 * * *";

export function criarGerarCobrancaQueue(): Queue {
  return new Queue(GERAR_COBRANCA_QUEUE_NAME, { connection: redisConnection });
}

export async function agendarGerarCobrancaJob(queue: Queue): Promise<void> {
  await queue.upsertJobScheduler(GERAR_COBRANCA_QUEUE_NAME, { pattern: CRON_DIARIO_08H }, { name: "diario" });
}

export function criarGerarCobrancaWorker(logger: FastifyBaseLogger): Worker {
  return new Worker(
    GERAR_COBRANCA_QUEUE_NAME,
    async (_job: Job) => {
      const gerarCobrancaUseCase = await criarGerarCobrancaUseCase();
      const dispararLembreteInicialUseCase = criarDispararLembreteInicialUseCase();

      const cobrancasGeradas = await gerarCobrancaUseCase.executar(new Date());

      for (const cobranca of cobrancasGeradas) {
        try {
          await dispararLembreteInicialUseCase.executar(cobranca);
        } catch (error) {
          logger.error({ err: error, cobrancaId: cobranca.id }, "Falha ao disparar lembrete inicial");
        }
      }
    },
    { connection: redisConnection },
  );
}
