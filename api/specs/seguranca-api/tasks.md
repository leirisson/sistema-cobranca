# Tasks — Segurança Básica da API (SEC)

- [ ] SEC-01 — Instalar e registrar `@fastify/rate-limit`; configurar limite específico e mais agressivo em `POST /auth/login` (por IP + e-mail).
- [ ] SEC-02 — Configurar rate limit geral (todas as rotas) com limite mais permissivo.
- [ ] SEC-03 — Instalar e registrar `@fastify/cors`; nova env var `CORS_ALLOWED_ORIGINS` (lista separada por vírgula), documentar em `env.ts`/`.env.example`.
- [ ] SEC-04 — Teste de integração confirmando `429` após N tentativas de login e mensagem de erro ainda genérica (SEC-R-04).
- [ ] SEC-05 — Documentar os novos comportamentos (429, CORS) em `contrato-api/endpoints.md`.
