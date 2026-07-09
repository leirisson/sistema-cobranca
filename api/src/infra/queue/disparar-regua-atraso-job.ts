import { Queue, Worker, type Job } from "bullmq";

import { redisConnection } from "./redis-connection.js";
import { criarDispararReguaAtrasoUseCase } from "./use-cases-factory.js";

export const DISPARAR_REGUA_ATRASO_QUEUE_NAME = "disparar-regua-atraso";
const CRON_DIARIO_09H = "0 9 * * *";

export function criarDispararReguaAtrasoQueue(): Queue {
  return new Queue(DISPARAR_REGUA_ATRASO_QUEUE_NAME, { connection: redisConnection });
}

export async function agendarDispararReguaAtrasoJob(queue: Queue): Promise<void> {
  await queue.upsertJobScheduler(
    DISPARAR_REGUA_ATRASO_QUEUE_NAME,
    { pattern: CRON_DIARIO_09H },
    { name: "diario" },
  );
}

export function criarDispararReguaAtrasoWorker(): Worker {
  return new Worker(
    DISPARAR_REGUA_ATRASO_QUEUE_NAME,
    async (_job: Job) => {
      const dispararReguaAtrasoUseCase = criarDispararReguaAtrasoUseCase();

      await dispararReguaAtrasoUseCase.executar(new Date());
    },
    { connection: redisConnection },
  );
}
