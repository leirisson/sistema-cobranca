# Tasks — Contrato de API (API)

> Nenhum código novo — documentação do que já existe (CAD, COB, MSG, EMAIL, PAG, DASH, AUTH)
> mais o processo para manter o contrato atualizado dali para frente.

- [x] API-01 — Escrever `api/specs/contrato-api/endpoints.md`, documentando todas as rotas já implementadas hoje: `/health`, `/auth/login`, `/webhooks/asaas`, `/dashboard/cobrancas`, `/dashboard/cobrancas/:id`, `/clientes`, `/clientes/:id`, `/clientes/:id/status` — método, autenticação, request, response, erros, a partir de `claude.md` seção 4.3 e do código-fonte de `src/infra/http/routes/`. **Divergência encontrada e corrigida:** `POST /cobrancas` (módulo `cobranca-avulsa`, já implementada e registrada em `app.ts`) não constava na lista original da task nem em `claude.md` §4.3 — incluída no `endpoints.md` e no `claude.md`.
- [x] API-02 — Adicionar ao checklist padrão (`claude.md` seção 7.2) o item "endpoints novos documentados em `contrato-api/endpoints.md`"; adicionar a mesma task-modelo aos `tasks.md` dos módulos que ainda vão criar rota nova (onboarding, cancelamento-cobranca, reenvio-mensagem — `cobranca-avulsa` já implementado, não precisa mais).
