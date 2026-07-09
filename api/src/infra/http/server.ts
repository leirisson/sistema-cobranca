import { env } from "../../shared/config/env.js";
import { iniciarWorkers } from "../queue/workers.js";
import { buildApp } from "./app.js";

const app = buildApp();

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => iniciarWorkers(app.log))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
