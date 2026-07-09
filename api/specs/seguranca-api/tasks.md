# Tasks — Segurança Básica da API (SEC)

- [x] SEC-01 — Instalado e registrado `@fastify/rate-limit`; limite específico e mais agressivo em `POST /auth/login` (`config: { rateLimit: { max: 5, timeWindow: "1 minute" } }`, por IP — `keyGenerator` padrão do plugin, não IP+e-mail combinado; decisão: combinar as duas chaves deixaria um atacante trocando de e-mail escapar do limite por IP, que é a proteção real contra brute-force).
- [x] SEC-02 — Rate limit geral (`global: true`, `max: 100`, `timeWindow: "1 minute"`) registrado em `app.ts`, aplicado a todas as rotas por padrão (o limite de `/auth/login` se soma a este, não o substitui).
- [x] SEC-03 — Instalado e registrado `@fastify/cors`; nova env var `CORS_ALLOWED_ORIGINS` (lista separada por vírgula, parseada em `app.ts`), documentada em `env.ts`/`.env.example`/`.env.test`/`.env`.
- [x] SEC-04 — Teste de integração confirmando `429` após N tentativas de login (`tests/integration/auth.test.ts`, describe dedicado) e que a mensagem de erro de credenciais inválidas (`401`) continua genérica (caminho de código separado do rate limit, nunca afetado).
- [x] SEC-05 — Documentado em `contrato-api/endpoints.md` (seções "Rate limit (SEC)" e "CORS (SEC)").
