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
import { criarAlertaOperacionalService } from "./use-cases-factory.js";

export async function iniciarWorkers(logger: FastifyBaseLogger): Promise<void> {
  const gerarCobrancaQueue = criarGerarCobrancaQueue();
  const dispararReguaAtrasoQueue = criarDispararReguaAtrasoQueue();

  await agendarGerarCobrancaJob(gerarCobrancaQueue);
  await agendarDispararReguaAtrasoJob(dispararReguaAtrasoQueue);

  const gerarCobrancaWorker = criarGerarCobrancaWorker(logger);
  const dispararReguaAtrasoWorker = criarDispararReguaAtrasoWorker();
  const alertaOperacionalService = criarAlertaOperacionalService();

  gerarCobrancaWorker.on("failed", (job, error) => {
    logger.error({ err: error, jobId: job?.id }, "Job de geração de cobrança falhou");

    alertaOperacionalService.alertar({ job: "gerar-cobranca", erro: error }).catch((erroAlerta: unknown) => {
      logger.error({ err: erroAlerta }, "Falha ao disparar alerta operacional");
    });
  });

  dispararReguaAtrasoWorker.on("failed", (job, error) => {
    logger.error({ err: error, jobId: job?.id }, "Job de régua de atraso falhou");

    alertaOperacionalService
      .alertar({ job: "disparar-regua-atraso", erro: error })
      .catch((erroAlerta: unknown) => {
        logger.error({ err: erroAlerta }, "Falha ao disparar alerta operacional");
      });
  });
}
