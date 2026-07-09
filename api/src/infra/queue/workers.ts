import type { FastifyBaseLogger } from "fastify";

import {
  agendarDispararReguaAtrasoJob,
  criarDispararReguaAtrasoQueue,
  criarDispararReguaAtrasoWorker,
} from "./disparar-regua-atraso-job.js";
import {
  agendarGerarCobrancaJob,
  criarGerarCobrancaQueue,
  criarGerarCobrancaWorker,
} from "./gerar-cobranca-job.js";

export async function iniciarWorkers(logger: FastifyBaseLogger): Promise<void> {
  const gerarCobrancaQueue = criarGerarCobrancaQueue();
  const dispararReguaAtrasoQueue = criarDispararReguaAtrasoQueue();

  await agendarGerarCobrancaJob(gerarCobrancaQueue);
  await agendarDispararReguaAtrasoJob(dispararReguaAtrasoQueue);

  const gerarCobrancaWorker = criarGerarCobrancaWorker(logger);
  const dispararReguaAtrasoWorker = criarDispararReguaAtrasoWorker();

  gerarCobrancaWorker.on("failed", (job, error) => {
    logger.error({ err: error, jobId: job?.id }, "Job de geração de cobrança falhou");
  });

  dispararReguaAtrasoWorker.on("failed", (job, error) => {
    logger.error({ err: error, jobId: job?.id }, "Job de régua de atraso falhou");
  });
}
