import type { ConnectionOptions } from "bullmq";

import { env } from "../../shared/config/env.js";

export const redisConnection: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
};
